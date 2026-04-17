"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Card from "@/components/ui/Card";
import type { QAData } from "@/types/qa";

interface QuestionFormProps {
  onNewQA: (qa: QAData) => void;
}

export default function QuestionForm({ onNewQA }: QuestionFormProps) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!res.ok) {
        throw new Error("Không thể gửi câu hỏi. Vui lòng thử lại.");
      }

      const data: QAData = await res.json();
      onNewQA(data);
      setQuestion("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="bg-white/80 border-sacred-300/40 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-sacred-100/30 rounded-bl-full -z-10 pointer-events-none" />
      <h2 className="mb-6 font-serif text-2xl font-semibold text-sacred-800">
        Đặt câu hỏi của bạn
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Textarea
          id="question"
          placeholder="Nhập câu hỏi về Kinh Thánh, chiêm niệm, tỉnh thức..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <Button type="submit" disabled={loading || !question.trim()}>
          {loading ? (
            <>
              <Spinner size="sm" />
              Đang xử lý...
            </>
          ) : (
            "Gửi câu hỏi"
          )}
        </Button>
      </form>
    </Card>
  );
}
