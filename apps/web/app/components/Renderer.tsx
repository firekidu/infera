import Form from './Form';
import Table from './Table';

export default function Renderer({ blueprintId, spec }: any) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:20 }}>
      <aside>
        <h3>{spec.name}</h3>
        <ul>
          {spec.pages.map((p:any,i:number)=> (
            <li key={i}><a href={'#p'+i}>{p.title}</a></li>
          ))}
        </ul>
      </aside>
      <section>
        {spec.pages.map((p:any,i:number)=> (
          <div key={i} id={'p'+i} style={{ marginBottom:40 }}>
            <h2>{p.title}</h2>
            {p.components.map((c:any,j:number) => {
              const fields = spec.collections.find((x:any)=> x.name === c.collection)?.fields || [];
              if (c.type === 'form') return <Form key={j} blueprintId={blueprintId} collection={c.collection} fields={fields} />;
              if (c.type === 'table') return <Table key={j} blueprintId={blueprintId} collection={c.collection} fields={fields} />;
              return null;
            })}
          </div>
        ))}
      </section>
    </div>
  );
}
