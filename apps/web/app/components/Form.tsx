'use client';
import { useState } from 'react';

export default function Form({ blueprintId, collection, fields }: any) {
  const [data, setData] = useState<Record<string, any>>({});
  const onChange = (k: string, v: any) => setData(d => ({...d, [k]: v}));
  const submit = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/blueprints/${blueprintId}/docs/${collection}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    alert('Saved');
  };
  return (
    <div>
      {fields.map((f: any) => (
        <div key={f.name} style={{marginBottom:8}}>
          <label>{f.name}</label><br/>
          <input onChange={e=>onChange(f.name, e.target.value)} />
        </div>
      ))}
      <button onClick={submit}>Submit</button>
    </div>
  );
}