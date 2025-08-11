import axios from 'axios';
import { Blueprint } from './blueprint-schema.js';

const system = `You convert a user's app idea into a JSON blueprint. Output ONLY JSON. Schema:
{
  "name": string, 
  "collections": [{"name": string, "fields": [{"name": string, "type": "string|number|boolean|text|date|email|phone", "required": boolean}]}],
  "pages": [{"title": string, "components": [{"type": "table|form", "collection": string, "title"?: string}]}],
  "actions": [{"name": string, "type": "webhook|email|langflow", "config": object}] 
}`;

const pick = (a, b) => (a ?? b);

export async function generateBlueprint(prompt) {
  // 1) OpenAI -> 2) OpenRouter -> 3) Ollama
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    const base = pick(process.env.OPENAI_BASE_URL, 'https://api.openai.com/v1');
    const model = pick(process.env.OPENAI_MODEL, 'gpt-4o-mini');
    const r = await axios.post(`${base}/chat/completions`, {
      model,
      messages: [ { role: 'system', content: system }, { role: 'user', content: prompt } ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    }, { headers: { Authorization: `Bearer ${openaiKey}` } });
    const raw = r.data.choices?.[0]?.message?.content ?? '{}';
    return Blueprint.parse(JSON.parse(raw));
  }

  const orKey = process.env.OPENROUTER_API_KEY;
  if (orKey) {
    const base = pick(process.env.OPENROUTER_BASE_URL, 'https://openrouter.ai/api/v1');
    const model = pick(process.env.OPENROUTER_MODEL, 'openrouter/auto');
    const headers = {
      Authorization: `Bearer ${orKey}`,
      // Optional attribution headers
      ...(process.env.OPENROUTER_HTTP_REFERER ? { 'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER } : {}),
      ...(process.env.OPENROUTER_TITLE ? { 'X-Title': process.env.OPENROUTER_TITLE } : {}),
    };
    const r = await axios.post(`${base}/chat/completions`, {
      model,
      messages: [ { role: 'system', content: system }, { role: 'user', content: prompt } ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    }, { headers });
    const raw = r.data.choices?.[0]?.message?.content ?? '{}';
    return Blueprint.parse(JSON.parse(raw));
  }

  // Ollama fallback
  const ollama = pick(process.env.OLLAMA_BASE_URL, 'http://ollama:11434');
  const model = pick(process.env.OLLAMA_MODEL, 'llama3');
  try {
    const r = await axios.post(`${ollama}/v1/chat/completions`, {
      model,
      messages: [ { role: 'system', content: system }, { role: 'user', content: prompt } ]
    });
    const raw = r.data.choices?.[0]?.message?.content ?? '{}';
    return Blueprint.parse(JSON.parse(raw));
  } catch (e) {
    const r = await axios.post(`${ollama}/api/generate`, { model, prompt: system + "
User:" + prompt, stream: false });
    const text = r.data.response || r.data;
    const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    return Blueprint.parse(JSON.parse(jsonStr));
  }
}