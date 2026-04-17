/**
 * Full-book render page for PDF export.
 * Renders all published chapters in sequence with table of contents.
 * Optimized for print/PDF via CSS @media print.
 */
import { dbConnect } from "@/lib/mongodb";
import Episode from "@/models/Episode";
import type { EpisodeData } from "@/types/episode";

export const dynamic = "force-dynamic";

function renderParagraphs(text: string) {
  return text
    .split("\n")
    .filter(Boolean)
    .map((p, i) => (
      <p key={i} style={{ marginBottom: "1em", lineHeight: "1.8" }}>
        {p}
      </p>
    ));
}

export default async function BookPage() {
  await dbConnect();

  const episodes = await Episode.find({ status: "published" })
    .sort({ workstream: 1, episodeNumber: 1 })
    .lean<EpisodeData[]>();

  const partA = episodes.filter((e) => e.workstream === "A");
  const partB = episodes.filter((e) => e.workstream === "B");

  const parts = [
    { label: "Phần I: Kinh Thánh và bản chất thế giới", chapters: partA },
    { label: "Phần II: Lời dạy từ bi của Đức Giêsu", chapters: partB },
  ];

  return (
    <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif", color: "#1a1a1a", maxWidth: "680px", margin: "0 auto", padding: "40px 24px" }}>

      {/* ── Cover ── */}
      <div style={{ textAlign: "center", padding: "120px 0 100px", pageBreakAfter: "always" }}>
        <p style={{ fontSize: "13px", letterSpacing: "3px", textTransform: "uppercase", color: "#888", marginBottom: "24px" }}>
          Kitô giáo Tỉnh thức
        </p>
        <h1 style={{ fontSize: "38px", fontWeight: "bold", lineHeight: "1.25", marginBottom: "24px" }}>
          Thế giới – Bản ngã – Từ bi
        </h1>
        <div style={{ width: "48px", height: "2px", background: "#c5a882", margin: "0 auto 32px" }} />
        <p style={{ fontSize: "15px", color: "#666", lineHeight: "1.7", maxWidth: "400px", margin: "0 auto" }}>
          Một hành trình chiêm niệm qua Kinh Thánh dưới lăng kính tỉnh thức
        </p>
      </div>

      {/* ── Table of Contents ── */}
      <div style={{ pageBreakAfter: "always", padding: "60px 0" }}>
        <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "40px", borderBottom: "1px solid #e0d5c5", paddingBottom: "12px" }}>
          Mục lục
        </h2>
        {parts.map(({ label, chapters }) =>
          chapters.length === 0 ? null : (
            <div key={label} style={{ marginBottom: "32px" }}>
              <p style={{ fontSize: "13px", letterSpacing: "2px", textTransform: "uppercase", color: "#888", marginBottom: "12px" }}>
                {label}
              </p>
              <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {chapters.map((ep) => (
                  <li
                    key={ep.slug}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      borderBottom: "1px dotted #ddd",
                      padding: "8px 0",
                      fontSize: "15px",
                    }}
                  >
                    <span>
                      <span style={{ color: "#999", marginRight: "12px", minWidth: "20px", display: "inline-block" }}>
                        {ep.episodeNumber}.
                      </span>
                      {ep.title}
                    </span>
                    <span style={{ color: "#aaa", fontSize: "12px", marginLeft: "12px", whiteSpace: "nowrap" }}>
                      {ep.bibleAnchor.verses[0]}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )
        )}
      </div>

      {/* ── Chapters ── */}
      {parts.map(({ label, chapters }) =>
        chapters.length === 0 ? null : (
          <div key={label}>
            {/* Part title page */}
            <div style={{ textAlign: "center", padding: "120px 0 100px", pageBreakBefore: "always", pageBreakAfter: "always" }}>
              <p style={{ fontSize: "12px", letterSpacing: "3px", textTransform: "uppercase", color: "#aaa", marginBottom: "20px" }}>
                {label.split(":")[0]}
              </p>
              <h2 style={{ fontSize: "28px", fontWeight: "bold", lineHeight: "1.4" }}>
                {label.split(": ")[1]}
              </h2>
            </div>

            {/* Each chapter */}
            {chapters.map((ep, idx) => {
              const isBookFormat = Boolean(ep.chapterBody);
              return (
                <div
                  key={ep.slug}
                  style={{
                    pageBreakBefore: idx === 0 ? undefined : "always",
                    paddingTop: "48px",
                  }}
                >
                  {/* Chapter header */}
                  <p style={{ fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase", color: "#aaa", marginBottom: "8px" }}>
                    Chương {ep.episodeNumber}
                  </p>
                  <h2 style={{ fontSize: "26px", fontWeight: "bold", lineHeight: "1.35", marginBottom: "8px" }}>
                    {ep.title}
                  </h2>
                  <p style={{ fontSize: "13px", color: "#aaa", marginBottom: "36px" }}>
                    {ep.keywords.join(" · ")}
                  </p>

                  {isBookFormat ? (
                    <>
                      {ep.chapterOpening && (
                        <div style={{ fontSize: "16px", marginBottom: "28px" }}>
                          {renderParagraphs(ep.chapterOpening)}
                        </div>
                      )}

                      {/* Bible blockquote */}
                      <blockquote
                        style={{
                          borderLeft: "3px solid #c5a882",
                          paddingLeft: "20px",
                          margin: "32px 0",
                          background: "#fdf9f4",
                          padding: "20px 24px",
                          borderRadius: "4px",
                        }}
                      >
                        <p style={{ fontStyle: "italic", lineHeight: "1.8", marginBottom: "8px", fontSize: "15px" }}>
                          {ep.bibleAnchor.textVi}
                        </p>
                        <footer style={{ fontSize: "13px", color: "#999" }}>
                          {ep.bibleAnchor.verses.join("; ")}
                        </footer>
                      </blockquote>

                      {ep.chapterBody && (
                        <div style={{ fontSize: "15px", marginBottom: "28px" }}>
                          {renderParagraphs(ep.chapterBody)}
                        </div>
                      )}

                      {ep.chapterClosing && (
                        <div
                          style={{
                            borderTop: "1px solid #e8e0d5",
                            paddingTop: "24px",
                            marginTop: "24px",
                            fontStyle: "italic",
                            color: "#666",
                            fontSize: "15px",
                          }}
                        >
                          {renderParagraphs(ep.chapterClosing)}
                        </div>
                      )}
                    </>
                  ) : (
                    /* Legacy fallback */
                    <>
                      <blockquote
                        style={{
                          borderLeft: "3px solid #c5a882",
                          padding: "20px 24px",
                          margin: "0 0 28px",
                          background: "#fdf9f4",
                          borderRadius: "4px",
                        }}
                      >
                        <p style={{ fontStyle: "italic", lineHeight: "1.8", marginBottom: "8px", fontSize: "15px" }}>
                          {ep.bibleAnchor.textVi}
                        </p>
                        <footer style={{ fontSize: "13px", color: "#999" }}>
                          {ep.bibleAnchor.verses.join("; ")}
                        </footer>
                      </blockquote>
                      <div style={{ fontSize: "15px" }}>
                        {renderParagraphs(ep.contemplativeReading)}
                      </div>
                    </>
                  )}

                  {/* Practice script */}
                  <div
                    style={{
                      marginTop: "40px",
                      padding: "20px 24px",
                      background: "#f7f5f0",
                      borderRadius: "6px",
                      pageBreakInside: "avoid",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "11px",
                        letterSpacing: "2px",
                        textTransform: "uppercase",
                        color: "#aaa",
                        marginBottom: "12px",
                      }}
                    >
                      Bài tập thực hành · {ep.practiceScript.durationMinutes} phút
                    </p>
                    <div style={{ fontSize: "14px", color: "#555" }}>
                      {renderParagraphs(ep.practiceScript.text)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Back matter ── */}
      <div style={{ textAlign: "center", padding: "120px 0", pageBreakBefore: "always" }}>
        <div style={{ width: "48px", height: "2px", background: "#c5a882", margin: "0 auto 32px" }} />
        <p style={{ fontSize: "14px", color: "#888", lineHeight: "1.8" }}>
          "Lạy Cha, xin tha cho họ,<br />vì họ không biết việc họ làm."
        </p>
        <p style={{ marginTop: "12px", fontSize: "12px", color: "#bbb" }}>Luca 23:34</p>
      </div>
    </div>
  );
}
