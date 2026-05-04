const { getMemberProfile } = require('../services/members/getMemberProfile');
const { getMemberChanges } = require('../services/members/getMemberChanges');
const { searchMembers } = require('../services/members/searchMembers');

function parseId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid member id' });
    return null;
  }
  return id;
}

async function getMemberById(req, res, next) {
  try {
    const id = parseId(req, res);
    if (id === null) return;
    const member = await getMemberProfile(id);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json(member);
  } catch (err) {
    next(err);
  }
}

async function getMemberNotifications(req, res, next) {
  try {
    const id = parseId(req, res);
    if (id === null) return;
    const changes = await getMemberChanges(id);
    res.json(changes);
  } catch (err) {
    next(err);
  }
}

async function searchMembersHandler(req, res, next) {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const limitParam = Number(req.query.limit);
    const limit = Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 100
      ? limitParam
      : 50;

    const members = await searchMembers({
      query: query || undefined,
      limit,
    });
    res.json(members);
  } catch (err) {
    next(err);
  }
}

module.exports = { getMemberById, getMemberNotifications, searchMembersHandler };
