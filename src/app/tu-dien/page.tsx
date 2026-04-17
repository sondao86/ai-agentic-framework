import { Suspense } from "react";
import { dbConnect } from "@/lib/mongodb";
import GlossaryTerm from "@/models/GlossaryTerm";
import type { GlossaryTermData, GlossaryCategory } from "@/types/glossary";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import GlossarySearch from "@/components/glossary/GlossarySearch";
import Spinner from "@/components/ui/Spinner";

export const dynamic = "force-dynamic";

const categoryLabels: Record<GlossaryCategory, string> = {
  contemplative: "Chiêm niệm",
  biblical: "Kinh Thánh",
  mindfulness: "Chánh niệm",
  general: "Chung",
};

interface PageProps {
  searchParams: Promise<{ search?: string; category?: string }>;
}

export default async function GlossaryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  await dbConnect();

  const filter: Record<string, unknown> = {};
  if (params.category) {
    filter.category = params.category;
  }
  if (params.search) {
    filter.$or = [
      { termVi: { $regex: params.search, $options: "i" } },
      { termEn: { $regex: params.search, $options: "i" } },
      { definition: { $regex: params.search, $options: "i" } },
    ];
  }

  const terms = await GlossaryTerm.find(filter)
    .sort({ termVi: 1 })
    .lean<GlossaryTermData[]>();

  const serialized = terms.map((t) => ({
    ...t,
    _id: String(t._id),
  })) as unknown as GlossaryTermData[];

  // Group by first letter
  const grouped: Record<string, GlossaryTermData[]> = {};
  for (const term of serialized) {
    const letter = term.termVi.charAt(0).toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(term);
  }
  const sortedLetters = Object.keys(grouped).sort();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="font-serif text-4xl font-bold text-sacred-800 md:text-5xl tracking-tight">
          Từ điển chiêm niệm
        </h1>
        <div className="h-1 w-16 bg-sacred-300/60 mx-auto mt-6 rounded-full" />
        <p className="mt-6 text-lg text-sacred-700/80 leading-relaxed">
          Tra cứu và tĩnh nguyện với các thuật ngữ trong không gian Kinh Thánh, chiêm niệm và chánh niệm
        </p>
      </div>

      <div className="mb-8">
        <Suspense fallback={<div className="h-10" />}>
          <GlossarySearch />
        </Suspense>
      </div>

      {serialized.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sacred-700/50">
            Không tìm thấy thuật ngữ nào.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {sortedLetters.map((letter) => (
            <section key={letter}>
              <h2 className="mb-6 font-serif text-3xl font-bold text-sacred-300/80 flex items-center gap-4">
                {letter}
                <div className="h-px bg-sacred-200/50 flex-grow" />
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {grouped[letter].map((term) => (
                  <Card key={term._id} hover className="h-full flex flex-col items-start relative overflow-hidden bg-white/70">
                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-sacred-50/50 blur-2xl -z-10" />

                    <div className="flex flex-col gap-1.5 mb-4">
                      <h3 className="font-serif text-xl font-semibold text-sacred-800">
                        {term.termVi}
                      </h3>
                      <span className="text-sm font-medium text-sacred-500/80">
                        {term.termEn}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <Badge className="bg-sacred-100/50 text-sacred-700 border-sacred-200/40">
                        {categoryLabels[term.category] ?? term.category}
                      </Badge>
                      {term.relatedAuthors.map((author) => (
                        <Badge key={author} variant={author} />
                      ))}
                    </div>

                    <p className="text-base leading-relaxed text-sacred-700/80 flex-grow">
                      {term.definition}
                    </p>

                    {term.relatedVerses.length > 0 && (
                      <div className="mt-5 w-full pt-4 border-t border-sacred-100/50 flex items-center gap-2">
                        <svg className="w-4 h-4 text-sacred-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="text-sm font-medium text-sacred-600/90">
                          {term.relatedVerses.join(", ")}
                        </span>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
