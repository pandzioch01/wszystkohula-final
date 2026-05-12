const { getToolProfile } = require('../services/tools/getToolProfile');
const { searchTools } = require('../services/tools/searchTools');

const VALID_TOOL_STATUSES = new Set([
  'IN_STORAGE',
  'AT_EVENT',
  'BORROWED',
  'MAINTENANCE',
  'LOST',
]);

function parseId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid tool id' });
    return null;
  }
  return id;
}

async function getToolById(req, res, next) {
  try {
    const id = parseId(req, res);
    if (id === null) return;
    const tool = await getToolProfile(id);
    if (!tool) return res.status(404).json({ error: 'Tool not found' });
    res.json(tool);
  } catch (err) {
    next(err);
  }
}

async function searchToolsHandler(req, res, next) {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    let status;
    if (typeof req.query.status === 'string' && req.query.status !== '') {
      const candidate = req.query.status.toUpperCase();
      if (!VALID_TOOL_STATUSES.has(candidate)) {
        return res.status(400).json({ error: 'Invalid status filter' });
      }
      status = candidate;
    }

    const limitParam = Number(req.query.limit);
    const limit = Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 100
      ? limitParam
      : 50;

    const tools = await searchTools({
      query: query || undefined,
      status,
      limit,
    });
    res.json(tools);
  } catch (err) {
    next(err);
  }
}

module.exports = { getToolById, searchToolsHandler };
