async function getBlueprint(id: string) {
  const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/blueprints/${id}`, { cache: 'no-store' });
  if (!r.ok) throw new Error('Not found');
  return r.json();
}

export default async function AppPage({ params }: any) {
  const { id } = await params;
  const bp = await getBlueprint(id);
  return (
    <main style={{maxWidth:1000,margin:'40px auto',fontFamily:'system-ui'}}>
      <a href="/">← Home</a>
      <h1>{bp.name}</h1>
      {/* @ts-expect-error Async Server Component children */}
      <Renderer blueprintId={bp.id} spec={bp.spec} />
    </main>
  );
}

// Workaround to import client components in RSC file
import dynamic from 'next/dynamic';
const Renderer = dynamic(() => import('../../components/Renderer'), { ssr: false });