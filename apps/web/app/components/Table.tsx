'use client';
import { useEffect, useState } from 'react';

export default function Table({ blueprintId, collection, fields }: any) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/blueprints/${blueprintId}/docs/${collection}`)
      .then(r=>r.json()).then(setRows);
  }, [blueprintId, collection]);
  return (
    <table border={1} cellPadding={6} cellSpacing={0}>
      <thead>
        <tr>
          {fields.map((f:any)=> <th key={f.name}>{f.name}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r:any)=> (
          <tr key={r.id}>
            {fields.map((f:any)=> <td key={f.name}>{String(r.data?.[f.name] ?? '')}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}