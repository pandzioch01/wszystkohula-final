const { getToolProfile } = require('../services/tools/getToolProfile');
const { searchTools } = require('../services/tools/searchTools');

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

    const limitParam = Number(req.query.limit);
    const limit = Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 100
      ? limitParam
      : 50;

    const tools = await searchTools({
      query: query || undefined,
      limit,
    });
    res.json(tools);
  } catch (err) {
    next(err);
  }
}

module.exports = { getToolById, searchToolsHandler };
