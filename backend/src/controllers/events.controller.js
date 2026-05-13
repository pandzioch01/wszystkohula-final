const { getEventsInRange } = require('../services/events/getEventsInRange');
const { getEventDetails } = require('../services/events/getEventDetails');
const { createEvent } = require('../services/events/createEvent');
const { updateEvent } = require('../services/events/updateEvent');
const { deleteEvent } = require('../services/events/deleteEvent');

function parseId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid event id' });
    return null;
  }
  return id;
}

function parseDate(value) {
  if (typeof value !== 'string' || value === '') return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Validates the request body for create (partial=false) and update (partial=true).
// Returns { errors, parsed } where parsed has dates already converted to Date objects.
function validateEventBody(body, { partial }) {
  const errors = [];
  const parsed = {};

  // title
  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim() === '') {
      errors.push('title must be a non-empty string');
    } else {
      parsed.title = body.title.trim();
    }
  } else if (!partial) {
    errors.push('title is required');
  }

  // description (optional, string or null)
  if (body.description !== undefined) {
    if (body.description !== null && typeof body.description !== 'string') {
      errors.push('description must be a string or null');
    } else {
      parsed.description = body.description;
    }
  }

  // clientName (optional, string or null)
  if (body.clientName !== undefined) {
    if (body.clientName !== null && typeof body.clientName !== 'string') {
      errors.push('clientName must be a string or null');
    } else {
      parsed.clientName = body.clientName;
    }
  }

  // firmsNames (optional, array of strings)
  if (body.firmsNames !== undefined) {
    if (!Array.isArray(body.firmsNames) || body.firmsNames.some((f) => typeof f !== 'string')) {
      errors.push('firmsNames must be an array of strings');
    } else {
      parsed.firmsNames = body.firmsNames;
    }
  }

  // toolIds (optional, array of positive integers)
  if (body.toolIds !== undefined) {
    if (
      !Array.isArray(body.toolIds) ||
      body.toolIds.some((n) => !Number.isInteger(n) || n <= 0)
    ) {
      errors.push('toolIds must be an array of positive integers');
    } else {
      // De-duplicate so a tool isn't assigned twice in one call.
      parsed.toolIds = [...new Set(body.toolIds)];
    }
  }

  // startDate
  if (body.startDate !== undefined) {
    const d = parseDate(body.startDate);
    if (d === null || d === undefined) {
      errors.push('startDate must be a valid ISO date string');
    } else {
      parsed.startDate = d;
    }
  } else if (!partial) {
    errors.push('startDate is required');
  }

  // endDate
  if (body.endDate !== undefined) {
    const d = parseDate(body.endDate);
    if (d === null || d === undefined) {
      errors.push('endDate must be a valid ISO date string');
    } else {
      parsed.endDate = d;
    }
  } else if (!partial) {
    errors.push('endDate is required');
  }

  // Cross-field check: endDate must be on or after startDate (when both present)
  if (parsed.startDate && parsed.endDate && parsed.endDate < parsed.startDate) {
    errors.push('endDate must be on or after startDate');
  }

  return { errors, parsed };
}

async function listEvents(req, res, next) {
  try {
    const start = parseDate(req.query.start);
    const end = parseDate(req.query.end);

    if (start === null) return res.status(400).json({ error: 'Invalid start date' });
    if (end === null) return res.status(400).json({ error: 'Invalid end date' });

    const limitParam = Number(req.query.limit);
    const limit = Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 1000
      ? limitParam
      : 500;

    const events = await getEventsInRange({ start, end, limit });
    res.json(events);
  } catch (err) {
    next(err);
  }
}

async function getEventById(req, res, next) {
  try {
    const id = parseId(req, res);
    if (id === null) return;
    const event = await getEventDetails(id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    next(err);
  }
}

// Extracts the optional actorMemberId from the body without consuming the
// event-field validator. Returns the id (or undefined) plus an error string
// if the value was provided but malformed.
function parseActorMemberId(body) {
  if (body.actorMemberId === undefined || body.actorMemberId === null) {
    return { actorMemberId: undefined, error: null };
  }
  const id = Number(body.actorMemberId);
  if (!Number.isInteger(id) || id <= 0) {
    return { actorMemberId: undefined, error: 'actorMemberId must be a positive integer' };
  }
  return { actorMemberId: id, error: null };
}

async function createEventHandler(req, res, next) {
  try {
    const actor = parseActorMemberId(req.body);
    if (actor.error) return res.status(400).json({ error: actor.error });

    const { errors, parsed } = validateEventBody(req.body, { partial: false });
    if (errors.length) return res.status(400).json({ errors });

    const event = await createEvent(parsed, actor.actorMemberId);
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
}

async function updateEventHandler(req, res, next) {
  try {
    const id = parseId(req, res);
    if (id === null) return;

    const actor = parseActorMemberId(req.body);
    if (actor.error) return res.status(400).json({ error: actor.error });

    const { errors, parsed } = validateEventBody(req.body, { partial: true });
    if (errors.length) return res.status(400).json({ errors });

    if (Object.keys(parsed).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    try {
      const event = await updateEvent(id, parsed, actor.actorMemberId);
      res.json(event);
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Event not found' });
      throw err;
    }
  } catch (err) {
    next(err);
  }
}

async function deleteEventHandler(req, res, next) {
  try {
    const id = parseId(req, res);
    if (id === null) return;

    // Delete uses no body — accept actorMemberId via query string instead.
    let actorMemberId;
    if (req.query.actorMemberId !== undefined) {
      const n = Number(req.query.actorMemberId);
      if (!Number.isInteger(n) || n <= 0) {
        return res.status(400).json({ error: 'actorMemberId must be a positive integer' });
      }
      actorMemberId = n;
    }

    try {
      await deleteEvent(id, actorMemberId);
      res.status(204).end();
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Event not found' });
      throw err;
    }
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listEvents,
  getEventById,
  createEventHandler,
  updateEventHandler,
  deleteEventHandler,
};
