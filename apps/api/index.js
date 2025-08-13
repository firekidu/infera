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
    const { data, error } = await db
      .from('blueprints')
      .insert({ name: bp.name, spec: bp })
      .select('id')
      .single();
    if (error) throw error;
    res.json({ id: data.id, blueprint: bp });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Generation failed', detail: String(e.message || e) });
  }
});

// Get blueprint
app.get('/api/blueprints/:id', async (req, res) => {
  const { data, error } = await db
    .from('blueprints')
    .select('id, name, spec')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

// List documents for a collection
app.get('/api/blueprints/:id/docs/:collection', async (req, res) => {
  const { id, collection } = req.params;
  const { data, error } = await db
    .from('documents')
    .select('id, data, created_at, updated_at')
    .eq('blueprint_id', id)
    .eq('collection', collection)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Query failed', detail: error.message });
  res.json(data);
});

// Create a document
app.post('/api/blueprints/:id/docs/:collection', async (req, res) => {
  const { id, collection } = req.params;
  const { data } = req.body;
  const { data: inserted, error } = await db
    .from('documents')
    .insert({ blueprint_id: id, collection, data })
    .select('id')
    .single();
  if (error) return res.status(500).json({ error: 'Insert failed', detail: error.message });
  res.json({ id: inserted.id });
});

// Actions (webhook/email/langflow) – minimal demo
import axios from 'axios';
app.post('/api/blueprints/:id/actions/:name', async (req, res) => {
  const { id, name } = req.params;
  const { payload } = req.body;
  const { data: br, error } = await db
    .from('blueprints')
    .select('spec')
    .eq('id', id)
    .single();
  if (error) return res.status(404).json({ error: 'Blueprint not found' });
  const spec = br.spec;
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