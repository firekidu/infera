'use client';
import { useState } from 'react';

export default function Generate() {
  const [prompt, setPrompt] = useState('A simple CRM: contacts (name, email, phone, notes). List + add form. When a new contact is added, trigger a webhook.');
  const [id, setId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const json = await r.json();
      setId(json.id);
    } finally { setLoading(false); }
  };

  return (
    <main className="container">
      <h1>Describe your app</h1>
      <form onSubmit={onSubmit}>
        <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={8}/>
        <div style={{marginTop:12}}>
          <button disabled={loading} type="submit">{loading ? 'Generating…' : 'Generate'}</button>
        </div>
      </form>
      {id && (
        <p style={{marginTop:20}}>Done → <a href={`/app/${id}`}>Open your app</a></p>
      )}
    </main>
  );
}