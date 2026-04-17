import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { EpisodeData } from "@/types/episode";

interface EpisodeCardProps {
  episode: EpisodeData;
}

export default function EpisodeCard({ episode }: EpisodeCardProps) {
  return (
    <Link href={`/tap/${episode.slug}`} className="group block h-full">
      <Card hover className="h-full flex flex-col relative overflow-hidden bg-white/80">
        <div className="absolute top-0 right-0 w-24 h-24 bg-sacred-100/40 rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-125 group-hover:bg-sacred-200/30" />

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge variant={episode.workstream} />
          {episode.lensInterpretations.map((lens) => (
            <Badge key={lens.author} variant={lens.author} />
          ))}
          <Badge variant={episode.status} className="ml-auto" />
        </div>

        <h3 className="font-serif text-xl font-semibold text-sacred-800 group-hover:text-sacred-600 transition-colors leading-snug">
          Tập {episode.episodeNumber}: {episode.title}
        </h3>

        {episode.bibleAnchor.verses.length > 0 && (
          <p className="mt-2 text-sm font-medium text-sacred-600/70 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {episode.bibleAnchor.verses.join(", ")}
          </p>
        )}

        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-sacred-700/70 flex-grow">
          {episode.contemplativeReading.slice(0, 150)}...
        </p>

        {episode.keywords.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-sacred-100/50">
            {episode.keywords.slice(0, 4).map((kw) => (
              <span
                key={kw}
                className="rounded-md bg-sacred-50/80 px-2 py-1 text-xs font-medium text-sacred-700/60 transition-colors group-hover:bg-sacred-100/50"
              >
                #{kw}
              </span>
            ))}
          </div>
        )}
      </Card>
    </Link>
  );
}
