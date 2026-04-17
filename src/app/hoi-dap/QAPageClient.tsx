"use client";

import { useState } from "react";
import type { QAData } from "@/types/qa";
import QuestionForm from "@/components/qa/QuestionForm";
import Card from "@/components/ui/Card";

interface QAPageClientProps {
  initialQAs: QAData[];
}

export default function QAPageClient({ initialQAs }: QAPageClientProps) {
  const [qaList, setQaList] = useState<QAData[]>(initialQAs);

  function handleNewQA(qa: QAData) {
    setQaList((prev) => [qa, ...prev]);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="font-serif text-4xl font-bold text-sacred-800 md:text-5xl tracking-tight">
          Hỏi &amp; Đáp
        </h1>
        <div className="h-1 w-16 bg-sacred-300/60 mx-auto mt-6 rounded-full" />
        <p className="mt-6 text-lg text-sacred-700/80 leading-relaxed">
          Không gian tĩnh lặng để đặt câu hỏi và nhận về những phản hồi từ góc nhìn chiêm niệm Kitô giáo
        </p>
      </div>

      <div className="mb-10">
        <QuestionForm onNewQA={handleNewQA} />
      </div>

      {qaList.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sacred-700/50">
            Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {qaList.map((qa) => (
            <Card key={qa._id} hover className="relative overflow-hidden bg-white/80">
              <div className="absolute top-0 left-0 w-1 h-full bg-sacred-300/50" />
              <div className="pl-6">
                <h3 className="font-serif text-xl font-semibold text-sacred-800 leading-snug">
                  <span className="text-sacred-400 font-bold mr-2">Q:</span>
                  {qa.question}
                </h3>
                <div className="mt-4 prose-sacred">
                  <span className="text-sacred-500 font-bold mr-2 float-left mt-1">A:</span>
                  {qa.answer.split("\n").map((paragraph, i) => (
                    <p key={i} className={i === 0 ? "inline" : "mt-4"}>{paragraph}</p>
                  ))}
                </div>
                {qa.relatedVerses.length > 0 && (
                  <div className="mt-6 border-t border-sacred-100/60 pt-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-sacred-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="text-sm font-medium text-sacred-600/90">
                      {qa.relatedVerses.join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
