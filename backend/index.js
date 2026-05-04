const express = require('express');
const cors = require('cors');
require('dotenv').config();

const membersRouter = require('./src/routes/members.routes');
const toolsRouter = require('./src/routes/tools.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/members', membersRouter);
app.use('/api/tools', toolsRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
