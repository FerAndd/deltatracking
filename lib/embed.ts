/** Convierte un link de Drive / YouTube / Vimeo / Frame.io en algo que se pueda mostrar en la página. */
export type Embed = { kind: "iframe" | "video"; src: string } | null;

export function embedFor(link: string | null): Embed {
  if (!link) return null;
  let u: URL;
  try {
    u = new URL(link);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^www\./, "");

  if (/\.(mp4|mov|webm)$/i.test(u.pathname)) return { kind: "video", src: u.toString() };

  if (host === "drive.google.com") {
    const m = u.pathname.match(/\/file\/d\/([^/]+)/) ?? null;
    const id = m?.[1] ?? u.searchParams.get("id");
    if (id) return { kind: "iframe", src: `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview` };
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = u.searchParams.get("v") ?? u.pathname.match(/\/shorts\/([^/]+)/)?.[1];
    if (id) return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` };
  }
  if (host === "youtu.be") {
    const id = u.pathname.slice(1);
    if (id) return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` };
  }
  if (host === "vimeo.com") {
    const id = u.pathname.match(/^\/(\d+)/)?.[1];
    if (id) return { kind: "iframe", src: `https://player.vimeo.com/video/${id}` };
  }
  if (host === "f.io" || host.endsWith("frame.io")) {
    return { kind: "iframe", src: u.toString() };
  }
  return null;
}
