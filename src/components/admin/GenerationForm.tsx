"use client";

import { useState } from "react";
import { Input, Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { AuthorLens, Workstream } from "@/types/episode";

interface GenerationResult {
  episodeId: string;
  title: string;
  contemplativeReading: string;
  christianContext: string;
  lensInterpretations: { author: string; content: string }[];
  lifeApplication: string;
  practiceScript: { text: string; durationMinutes: number };
}

interface VerificationResult {
  isVerified: boolean;
  notes: string;
  bibleReferencesChecked: string[];
}

export default function GenerationForm() {
  const [workstream, setWorkstream] = useState<Workstream>("A");
  const [episodeNumber, setEpisodeNumber] = useState("");
  const [title, setTitle] = useState("");
  const [bibleVerses, setBibleVerses] = useState("");
  const [keywords, setKeywords] = useState("");
  const [lens, setLens] = useState<AuthorLens>("tolle");

  const [generating, setGenerating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const [result, setResult] = useState<GenerationResult | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setError("");
    setResult(null);
    setVerification(null);

    try {
      const res = await fetch("/api/generate/episode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workstream,
          episodeNumber: parseInt(episodeNumber, 10),
          title,
          bibleVerses: bibleVerses.split(",").map((v) => v.trim()).filter(Boolean),
          keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
          lens,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Không thể tạo nội dung. Vui lòng thử lại.");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleVerify() {
    if (!result?.episodeId) return;
    setVerifying(true);
    setError("");

    try {
      const res = await fetch("/api/generate/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodeId: result.episodeId }),
      });

      if (!res.ok) {
        throw new Error("Không thể xác minh. Vui lòng thử lại.");
      }

      const data = await res.json();
      setVerification(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Generation Form */}
      <Card>
        <h2 className="mb-6 font-serif text-xl font-semibold text-sacred-700">
          Thông tin tập mới
        </h2>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-sacred-700">
                Dòng
              </label>
              <select
                value={workstream}
                onChange={(e) => setWorkstream(e.target.value as Workstream)}
                className="w-full rounded-lg border border-sacred-200 bg-white px-4 py-2.5 text-sm text-sacred-900 focus:border-sacred-500 focus:outline-none focus:ring-1 focus:ring-sacred-500"
              >
                <option value="A">Dòng A - Kinh Thánh và bản chất thế giới</option>
                <option value="B">Dòng B - Lời dạy từ bi của Đức Giê-su</option>
              </select>
            </div>

            <Input
              id="episodeNumber"
              label="Số tập"
              type="number"
              min="1"
              value={episodeNumber}
              onChange={(e) => setEpisodeNumber(e.target.value)}
              placeholder="VD: 1"
            />
          </div>

          <Input
            id="title"
            label="Tiêu đề"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Kenosis - Con đường từ hủy"
          />

          <Input
            id="bibleVerses"
            label="Câu Kinh Thánh (phân cách bởi dấu phẩy)"
            value={bibleVerses}
            onChange={(e) => setBibleVerses(e.target.value)}
            placeholder="VD: Philipphê 2:6-8, Gioan 12:24"
          />

          <Input
            id="keywords"
            label="Từ khóa (phân cách bởi dấu phẩy)"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="VD: kenosis, từ hủy, hiện diện"
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-sacred-700">
              Lăng kính chính
            </label>
            <select
              value={lens}
              onChange={(e) => setLens(e.target.value as AuthorLens)}
              className="w-full rounded-lg border border-sacred-200 bg-white px-4 py-2.5 text-sm text-sacred-900 focus:border-sacred-500 focus:outline-none focus:ring-1 focus:ring-sacred-500"
            >
              <option value="tolle">Eckhart Tolle</option>
              <option value="demello">Anthony de Mello</option>
              <option value="rohr">Richard Rohr</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            type="submit"
            disabled={generating || !title.trim() || !episodeNumber || !bibleVerses.trim()}
          >
            {generating ? (
              <>
                <Spinner size="sm" />
                Đang tạo nội dung...
              </>
            ) : (
              "Tạo nội dung"
            )}
          </Button>
        </form>
      </Card>

      {/* Generated Result */}
      {result && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-sacred-700">
              Kết quả tạo nội dung
            </h2>
            <Badge variant="draft">Bản nháp</Badge>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-sm font-medium text-sacred-700/60">
                Tiêu đề
              </h3>
              <p className="font-serif text-lg text-sacred-700">{result.title}</p>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium text-sacred-700/60">
                Đọc chiêm niệm
              </h3>
              <div className="prose-sacred rounded-lg bg-sacred-50 p-4">
                {result.contemplativeReading.split("\n").map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium text-sacred-700/60">
                Bối cảnh Kitô giáo
              </h3>
              <div className="prose-sacred rounded-lg bg-sacred-50 p-4">
                {result.christianContext.split("\n").map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>

            {result.lensInterpretations.map((interp) => (
              <div key={interp.author}>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-sm font-medium text-sacred-700/60">
                    Diễn giải
                  </h3>
                  <Badge variant={interp.author as "tolle" | "demello" | "rohr"} />
                </div>
                <div className="prose-sacred rounded-lg bg-sacred-50 p-4">
                  {interp.content.split("\n").map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <h3 className="mb-2 text-sm font-medium text-sacred-700/60">
                Áp dụng vào đời sống
              </h3>
              <div className="prose-sacred rounded-lg bg-sacred-50 p-4">
                {result.lifeApplication.split("\n").map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium text-sacred-700/60">
                Bài tập thực hành ({result.practiceScript.durationMinutes} phút)
              </h3>
              <div className="prose-sacred rounded-lg bg-sacred-50 p-4">
                {result.practiceScript.text.split("\n").map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Verify Button */}
          <div className="mt-6 border-t border-sacred-200 pt-6">
            <Button
              onClick={handleVerify}
              disabled={verifying}
              variant="secondary"
            >
              {verifying ? (
                <>
                  <Spinner size="sm" />
                  Đang xác minh...
                </>
              ) : (
                "Xác minh"
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Verification Result */}
      {verification && (
        <Card
          className={
            verification.isVerified
              ? "border-green-300 bg-green-50"
              : "border-red-300 bg-red-50"
          }
        >
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-serif text-xl font-semibold text-sacred-700">
              Kết quả xác minh
            </h2>
            {verification.isVerified ? (
              <Badge variant="verified">Đạt</Badge>
            ) : (
              <span className="inline-flex items-center rounded-full border border-red-300 bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                Không đạt
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-sacred-700/80">
            {verification.notes}
          </p>
          {verification.bibleReferencesChecked.length > 0 && (
            <div className="mt-3">
              <span className="text-xs font-medium text-sacred-700/50">
                Câu Kinh Thánh đã kiểm tra:{" "}
              </span>
              <span className="text-xs text-sacred-500">
                {verification.bibleReferencesChecked.join(", ")}
              </span>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
