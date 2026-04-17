import { notFound } from "next/navigation";
import Link from "next/link";
import { dbConnect } from "@/lib/mongodb";
import Episode from "@/models/Episode";
import type { EpisodeData } from "@/types/episode";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function renderParagraphs(text: string) {
  return text.split("\n").filter(Boolean).map((p, i) => (
    <p key={i}>{p}</p>
  ));
}

export default async function EpisodeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  await dbConnect();

  const episode = await Episode.findOne({ slug }).lean<EpisodeData>();
  if (!episode) {
    notFound();
  }

  const isBookFormat = Boolean(episode.chapterBody);

  // Fetch adjacent episodes for navigation
  const [prev, next] = await Promise.all([
    Episode.findOne({
      workstream: episode.workstream,
      episodeNumber: episode.episodeNumber - 1,
      status: "published",
    })
      .select("slug title episodeNumber")
      .lean<Pick<EpisodeData, "slug" | "title" | "episodeNumber">>(),
    Episode.findOne({
      workstream: episode.workstream,
      episodeNumber: episode.episodeNumber + 1,
      status: "published",
    })
      .select("slug title episodeNumber")
      .lean<Pick<EpisodeData, "slug" | "title" | "episodeNumber">>(),
  ]);

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      {/* Back link */}
      <Link
        href="/tap"
        className="mb-8 inline-flex items-center gap-1 text-sm text-sacred-500 hover:text-sacred-700 transition-colors"
      >
        &larr; Mục lục
      </Link>

      {/* Part label */}
      {episode.partTitle && (
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-sacred-400">
          {episode.partTitle}
        </p>
      )}

      {/* Chapter heading */}
      <header className="mb-10">
        <p className="font-serif text-sm text-sacred-500 mb-1">
          Chương {episode.episodeNumber}
        </p>
        <h1 className="font-serif text-3xl font-bold leading-tight text-sacred-700 md:text-4xl">
          {episode.title}
        </h1>
        {episode.keywords.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {episode.keywords.map((kw) => (
              <span
                key={kw}
                className="rounded-md bg-sacred-100 px-2.5 py-1 text-xs text-sacred-700/70"
              >
                {kw}
              </span>
            ))}
          </div>
        )}
      </header>

      {isBookFormat ? (
        /* ── Book format ── */
        <>
          {/* Opening */}
          {episode.chapterOpening && (
            <div className="prose-sacred mb-8 text-base leading-relaxed">
              {renderParagraphs(episode.chapterOpening)}
            </div>
          )}

          {/* Bible anchor */}
          <blockquote className="my-10 rounded-lg border-l-4 border-sacred-300 bg-sacred-50 p-6">
            <p className="font-serif text-base italic leading-relaxed text-sacred-700">
              {episode.bibleAnchor.textVi}
            </p>
            <footer className="mt-3 text-sm text-sacred-500">
              {episode.bibleAnchor.verses.join("; ")}
            </footer>
          </blockquote>

          {/* Chapter body */}
          {episode.chapterBody && (
            <div className="prose-sacred mb-10 text-base leading-relaxed">
              {renderParagraphs(episode.chapterBody)}
            </div>
          )}

          {/* Closing */}
          {episode.chapterClosing && (
            <div className="mb-12 border-t border-sacred-100 pt-8 prose-sacred italic text-sacred-600">
              {renderParagraphs(episode.chapterClosing)}
            </div>
          )}
        </>
      ) : (
        /* ── Legacy format (fallback) ── */
        <>
          <section className="mb-12">
            <h2 className="mb-4 font-serif text-xl font-semibold text-sacred-700">
              Neo Kinh Thánh
            </h2>
            <blockquote className="rounded-lg border-l-4 border-sacred-300 bg-sacred-50 p-6">
              <p className="font-serif text-base italic leading-relaxed text-sacred-700">
                {episode.bibleAnchor.textVi}
              </p>
              <footer className="mt-3 text-sm text-sacred-500">
                {episode.bibleAnchor.verses.join("; ")}
              </footer>
            </blockquote>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 font-serif text-xl font-semibold text-sacred-700">
              Đọc chiêm niệm
            </h2>
            <div className="prose-sacred">
              {renderParagraphs(episode.contemplativeReading)}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 font-serif text-xl font-semibold text-sacred-700">
              Bối cảnh Kitô giáo
            </h2>
            <Card>
              <div className="prose-sacred">
                {renderParagraphs(episode.christianContext)}
              </div>
            </Card>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 font-serif text-xl font-semibold text-sacred-700">
              Diễn giải
            </h2>
            <div className="space-y-6">
              {episode.lensInterpretations.map((lens) => (
                <Card key={lens.author}>
                  <div className="mb-3 flex items-center gap-2">
                    <Badge variant={lens.author} />
                    <span className="text-xs text-sacred-700/50">Diễn giải</span>
                  </div>
                  <div className="prose-sacred">
                    {renderParagraphs(lens.content)}
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 font-serif text-xl font-semibold text-sacred-700">
              Áp dụng vào đời sống
            </h2>
            <Card className="bg-sacred-50">
              <div className="prose-sacred">
                {renderParagraphs(episode.lifeApplication)}
              </div>
            </Card>
          </section>
        </>
      )}

      {/* Practice Script — same for both formats */}
      <section className="mb-12">
        <div className="border-t border-sacred-200 pt-10">
          <h2 className="mb-1 font-serif text-xl font-semibold text-sacred-700">
            Bài tập thực hành
          </h2>
          <p className="mb-6 text-sm text-sacred-500">
            {episode.practiceScript.durationMinutes} phút chiêm niệm
          </p>
          <Card className="bg-sacred-50">
            <div className="prose-sacred">
              {renderParagraphs(episode.practiceScript.text)}
            </div>
            {episode.practiceScript.audioUrl ? (
              <audio
                controls
                src={episode.practiceScript.audioUrl}
                className="mt-4 w-full"
              />
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-sacred-200 p-4 text-center text-sm text-sacred-700/40">
                Âm thanh sẽ sớm được thêm vào
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* Navigation */}
      <nav className="flex items-center justify-between border-t border-sacred-200 pt-8">
        {prev ? (
          <Link
            href={`/tap/${prev.slug}`}
            className="group flex flex-col items-start text-sm"
          >
            <span className="text-xs text-sacred-700/50">&larr; Chương trước</span>
            <span className="font-medium text-sacred-700 group-hover:text-sacred-500 transition-colors">
              {prev.episodeNumber}. {prev.title}
            </span>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={`/tap/${next.slug}`}
            className="group flex flex-col items-end text-sm"
          >
            <span className="text-xs text-sacred-700/50">Chương tiếp &rarr;</span>
            <span className="font-medium text-sacred-700 group-hover:text-sacred-500 transition-colors">
              {next.episodeNumber}. {next.title}
            </span>
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </article>
  );
}
