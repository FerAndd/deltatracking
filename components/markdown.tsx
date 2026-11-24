/**
 * Muestra texto en formato Markdown sencillo (títulos, listas, negritas) sin librerías externas
 * y sin interpretar HTML, para que sea seguro.
 */
function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => (p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p));
}

export function Markdown({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      blocks.push(
        <ul key={blocks.length} className="my-2 list-disc space-y-1 pl-5">
          {list.map((li, i) => <li key={i}>{inline(li)}</li>)}
        </ul>,
      );
      list = [];
    }
  };
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    const li = line.match(/^\s*[-*]\s+(.*)/);
    if (li) {
      list.push(li[1]);
      continue;
    }
    flush();
    if (!line.trim()) continue;
    const h = line.match(/^(#{1,3})\s+(.*)/);
    if (h) {
      const cls = h[1].length === 1 ? "mt-4 text-xl font-bold" : h[1].length === 2 ? "mt-4 text-lg font-semibold" : "mt-3 font-semibold";
      blocks.push(<p key={blocks.length} className={cls}>{inline(h[2])}</p>);
    } else {
      blocks.push(<p key={blocks.length} className="my-2">{inline(line)}</p>);
    }
  }
  flush();
  return <div className="text-[15px] leading-relaxed text-zinc-800 [&>*:first-child]:mt-0">{blocks}</div>;
}
