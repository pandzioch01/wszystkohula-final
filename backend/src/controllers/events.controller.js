const { getEventsInRange } = require('../services/events/getEventsInRange');
const { getEventDetails } = require('../services/events/getEventDetails');

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

module.exports = { listEvents, getEventById };
