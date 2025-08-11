import express from 'express';
import cors from 'cors';
import db from './db.js';
import { generateBlueprint } from './ai.js';
import { Blueprint } from './blueprint-schema.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Create blueprint from prompt
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
    const bp = await generateBlueprint(prompt);
    const r = await db.query('INSERT INTO blueprints (name, spec) VALUES ($1,$2) RETURNING id', [bp.name, bp]);
    res.json({ id: r.rows[0].id, blueprint: bp });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Generation failed', detail: String(e.message || e) });
  }
});

// Get blueprint
app.get('/api/blueprints/:id', async (req, res) => {
  const r = await db.query('SELECT id, name, spec FROM blueprints WHERE id=$1', [req.params.id]);
  if (!r.rowCount) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
});

// List documents for a collection
app.get('/api/blueprints/:id/docs/:collection', async (req, res) => {
  const { id, collection } = req.params;
  const r = await db.query('SELECT id, data, created_at, updated_at FROM documents WHERE blueprint_id=$1 AND collection=$2 ORDER BY created_at DESC', [id, collection]);
  res.json(r.rows);
});

// Create a document
app.post('/api/blueprints/:id/docs/:collection', async (req, res) => {
  const { id, collection } = req.params;
  const { data } = req.body;
  const r = await db.query('INSERT INTO documents (blueprint_id, collection, data) VALUES ($1,$2,$3) RETURNING id', [id, collection, data]);
  res.json({ id: r.rows[0].id });
});

// Actions (webhook/email/langflow) – minimal demo
import axios from 'axios';
app.post('/api/blueprints/:id/actions/:name', async (req, res) => {
  const { id, name } = req.params;
  const { payload } = req.body;
  const br = await db.query('SELECT spec FROM blueprints WHERE id=$1', [id]);
  if (!br.rowCount) return res.status(404).json({ error: 'Blueprint not found' });
  const spec = br.rows[0].spec;
  const action = (spec.actions || []).find(a => a.name === name);
  if (!action) return res.status(404).json({ error: 'Action not found' });

  try {
    if (action.type === 'webhook') {
      const r = await axios.post(action.config.url, payload, { headers: action.config.headers || {} });
      return res.json({ ok: true, status: r.status });
    }
    if (action.type === 'email') {
      // In real apps integrate Mailgun/SES. For demo just echo.
      return res.json({ ok: true, simulated: { to: action.config.to, subject: action.config.subject } });
    }
    if (action.type === 'langflow') {
      const base = process.env.LANGFLOW_URL || 'http://langflow:7860';
      // Example: POST to a Langflow endpoint (you would publish a flow and call its REST URL)
      const r = await axios.post(`${base}/api/v1/run/${action.config.flowId}`, { inputs: payload });
      return res.json({ ok: true, result: r.data });
    }
    res.status(400).json({ error: 'Unsupported action type' });
  } catch (e) {
    res.status(500).json({ error: 'Action failed', detail: String(e.message || e) });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`API listening on ${port}`));