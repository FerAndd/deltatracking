import { embedFor } from "@/lib/embed";

export function Preview({ link, title }: { link: string; title: string }) {
  const embed = embedFor(link);
  return (
    <div className="space-y-2">
      {embed?.kind === "video" && (
        <video src={embed.src} controls playsInline className="max-h-[70vh] w-full rounded-xl bg-black" />
      )}
      {embed?.kind === "iframe" && (
        <div className="relative mx-auto aspect-[9/16] max-h-[70vh] w-full max-w-sm overflow-hidden rounded-xl bg-zinc-900">
          <iframe
            src={embed.src}
            title={`Vista previa: ${title}`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      )}
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-delta px-4 py-2.5 text-sm font-medium text-white hover:bg-delta-dark"
      >
        Abrir para revisar ↗
      </a>
    </div>
  );
}
