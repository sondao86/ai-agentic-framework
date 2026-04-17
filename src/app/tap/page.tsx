import Link from "next/link";
import { dbConnect } from "@/lib/mongodb";
import Episode from "@/models/Episode";
import type { EpisodeData } from "@/types/episode";

export const dynamic = "force-dynamic";

const PART_LABELS: Record<string, string> = {
  A: "Phần I: Kinh Thánh và bản chất thế giới",
  B: "Phần II: Lời dạy từ bi của Đức Giêsu",
};

export default async function EpisodesPage() {
  await dbConnect();

  const episodes = await Episode.find({ status: "published" })
    .sort({ workstream: 1, episodeNumber: 1 })
    .lean<EpisodeData[]>();

  const partA = episodes.filter((e) => e.workstream === "A");
  const partB = episodes.filter((e) => e.workstream === "B");

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-16 text-center">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-sacred-400">
          Kitô giáo Tỉnh thức
        </p>
        <h1 className="font-serif text-4xl font-bold text-sacred-800 md:text-5xl tracking-tight">
          Mục lục
        </h1>
        <div className="h-px w-16 bg-sacred-300/60 mx-auto mt-6" />
      </div>

      {[
        { ws: "A", chapters: partA },
        { ws: "B", chapters: partB },
      ].map(({ ws, chapters }) =>
        chapters.length === 0 ? null : (
          <section key={ws} className="mb-16">
            <h2 className="mb-6 font-serif text-lg font-semibold text-sacred-600 border-b border-sacred-100 pb-3">
              {PART_LABELS[ws]}
            </h2>
            <ol className="space-y-1">
              {chapters.map((episode) => (
                <li key={episode.slug}>
                  <Link
                    href={`/tap/${episode.slug}`}
                    className="group flex items-baseline gap-4 rounded-lg px-3 py-3 hover:bg-sacred-50 transition-colors"
                  >
                    <span className="w-6 shrink-0 text-right font-serif text-sm text-sacred-400 group-hover:text-sacred-600 transition-colors">
                      {episode.episodeNumber}
                    </span>
                    <span className="flex-1 font-serif text-base text-sacred-700 group-hover:text-sacred-900 transition-colors leading-snug">
                      {episode.title}
                    </span>
                    <span className="shrink-0 text-xs text-sacred-400/60">
                      {episode.bibleAnchor.verses[0]}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )
      )}

      {episodes.length === 0 && (
        <p className="text-center text-sacred-700/50 py-16">
          Chưa có chương nào được xuất bản.
        </p>
      )}
    </div>
  );
}
