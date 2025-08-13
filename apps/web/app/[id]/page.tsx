async function getBlueprint(id: string) {
  const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/blueprints/${id}`, { cache: 'no-store' });
  if (!r.ok) throw new Error('Not found');
  return r.json();
}

export default async function AppPage({ params }: any) {
  const { id } = params;
  const bp = await getBlueprint(id);
  return (
    <main className="container wide">
      <a href="/">← Home</a>
      <h1>{bp.name}</h1>
      <Renderer blueprintId={bp.id} spec={bp.spec} />
    </main>
  );
}

import dynamic from 'next/dynamic';
// Corrected relative path: [id]/page.tsx is one level below the app root,
// so components live at ../components/Renderer
const Renderer = dynamic(() => import('../components/Renderer'), { ssr: false });
