import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const workstreams = [
  {
    id: "A",
    title: "Kinh Thánh và bản chất thế giới",
    description:
      "8 chủ đề khám phá về kenosis (tự hủy), hiện diện, bản ngã và sự giác ngộ qua lăng kính Kinh Thánh.",
    topics: [
      "Kenosis và sự tự hủy",
      "Hiện diện trong im lặng",
      "Bản ngã và bản thể thật",
      "Phục sinh như sự chuyển hóa",
    ],
    href: "/tap?workstream=A",
    badge: "A" as const,
  },
  {
    id: "B",
    title: "Lời dạy từ bi của Đức Giê-su",
    description:
      "10 episode về tha thứ, không phán xét, yêu kẻ thù và lòng từ bi vô điều kiện trong lời dạy của Chúa Giê-su.",
    topics: [
      "Tha thứ vô điều kiện",
      "Không phán xét",
      "Yêu kẻ thù",
      "Từ bi như con đường",
    ],
    href: "/tap?workstream=B",
    badge: "B" as const,
  },
];

const authorLenses = [
  {
    name: "Eckhart Tolle",
    badge: "tolle" as const,
    description:
      "Nhà tư tưởng tâm linh đương đại, tác giả 'Sức Mạnh Của Hiện Tại'. " +
      "Tolle giúp chúng ta nhìn Kinh Thánh qua lăng kính hiện diện và tỉnh thức, " +
      "vạch trần bản ngã và mở ra không gian ý thức sâu sắc hơn.",
  },
  {
    name: "Anthony de Mello",
    badge: "demello" as const,
    description:
      "Tu sĩ Dòng Tên người Ấn Độ, kết hợp chiêm niệm Kitô giáo với trí tuệ phương Đông. " +
      "De Mello mời gọi chúng ta 'tỉnh dậy' khỏi giấc ngủ của sự vô thức " +
      "và gặp gỡ Thiên Chúa trong thực tại hiện tiền.",
  },
  {
    name: "Richard Rohr",
    badge: "rohr" as const,
    description:
      "Tu sĩ Phanxicô, nhà thần học chiêm niệm. " +
      "Rohr hướng dẫn chúng ta về 'Đức Kitô Vũ Trụ' và truyền thống chiêm niệm Kitô giáo, " +
      "nơi Kinh Thánh là bản đồ cho hành trình chuyển hóa nội tâm.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 md:py-32 lg:py-40">
        {/* Subtle decorative background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-sacred-200/40 blur-3xl opacity-50 mix-blend-multiply" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sacred-300/30 blur-3xl opacity-50 mix-blend-multiply" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sacred-100/80 border border-sacred-200/60 mb-8 backdrop-blur-sm shadow-sm">
            <span className="w-2 h-2 rounded-full bg-sacred-400 animate-pulse" />
            <span className="text-xs font-medium text-sacred-700 uppercase tracking-widest">Dự án chiêm niệm</span>
          </div>

          <h1 className="font-serif text-5xl font-bold tracking-tight text-sacred-800 md:text-6xl lg:text-7xl leading-[1.15]">
            Kitô giáo Tỉnh thức
          </h1>
          <p className="mx-auto mt-8 max-w-2xl font-serif text-xl leading-relaxed text-sacred-700/80 md:text-2xl font-medium">
            Khám phá chiều sâu của Kinh Thánh qua lăng kính tỉnh thức và chiêm niệm hiện sinh.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/tap"
              className="inline-flex items-center justify-center w-full sm:w-auto rounded-xl bg-gradient-to-br from-sacred-600 to-sacred-800 px-8 py-4 text-base font-medium text-white shadow-md shadow-sacred-900/10 transition-all hover:scale-105 hover:shadow-lg hover:shadow-sacred-900/20"
            >
              Bắt đầu đọc
            </Link>
            <Link
              href="/tu-dien"
              className="inline-flex items-center justify-center w-full sm:w-auto rounded-xl border border-sacred-200/80 bg-white/60 backdrop-blur-md px-8 py-4 text-base font-medium text-sacred-800 shadow-sm transition-all hover:bg-white hover:border-sacred-300 hover:shadow-md"
            >
              Từ điển chiêm niệm
            </Link>
          </div>
        </div>
      </section>

      {/* Workstreams Section */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center font-serif text-2xl font-semibold text-sacred-700 md:text-3xl">
          Hai dòng khám phá
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sacred-700/70">
          Chọn một dòng để bắt đầu hành trình chiêm niệm của bạn
        </p>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {workstreams.map((ws) => (
            <Link key={ws.id} href={ws.href} className="group block">
              <Card hover className="h-full">
                <div className="flex items-center gap-3">
                  <Badge variant={ws.badge} />
                  <h3 className="font-serif text-xl font-semibold text-sacred-700">
                    {ws.title}
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-sacred-700/70">
                  {ws.description}
                </p>
                <ul className="mt-4 space-y-1.5">
                  {ws.topics.map((topic) => (
                    <li
                      key={topic}
                      className="flex items-center gap-2 text-sm text-sacred-700/60"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-sacred-300" />
                      {topic}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm font-medium text-sacred-500 group-hover:text-sacred-700 transition-colors">
                  Khám phá &rarr;
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Author Lenses Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        {/* Subtle background element */}
        <div className="absolute inset-0 bg-white/40 border-y border-sacred-200/30 backdrop-blur-sm -z-10" />

        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl font-bold text-sacred-800 md:text-4xl tracking-tight">
              Ba lăng kính chiêm niệm
            </h2>
            <div className="h-1 w-20 bg-sacred-300/50 mx-auto mt-6 rounded-full" />
            <p className="mt-6 text-lg text-sacred-700/80 leading-relaxed">
              Mỗi bài học được diễn giải thấu đáo qua góc nhìn sâu sắc của ba nhà tư tưởng tâm linh lớn
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
            {authorLenses.map((author, index) => (
              <Card key={author.name} hover className="h-full flex flex-col group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sacred-100/50 rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110" />
                <Badge variant={author.badge} className="self-start mb-4" />
                <h3 className="font-serif text-2xl font-semibold text-sacred-800 mb-3 group-hover:text-sacred-600 transition-colors">
                  {author.name}
                </h3>
                <p className="text-base leading-relaxed text-sacred-700/70 flex-grow">
                  {author.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Q&A CTA Section */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <div className="rounded-3xl bg-sacred-100/50 border border-sacred-200/50 p-10 md:p-16 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sacred-400/50 to-transparent" />
          <h2 className="font-serif text-3xl font-bold text-sacred-800">
            Bạn có câu hỏi?
          </h2>
          <p className="mt-4 text-lg text-sacred-700/80 max-w-xl mx-auto">
            Đặt câu hỏi về Kinh Thánh, thực hành chiêm niệm, hay bất kỳ chủ đề nào trong hành trình tâm linh của bạn
          </p>
          <Link
            href="/hoi-dap"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-base font-medium text-sacred-800 shadow-sm border border-sacred-200/60 transition-all hover:bg-sacred-50 hover:border-sacred-300 hover:-translate-y-1 hover:shadow-md"
          >
            Đi đến trang Hỏi &amp; Đáp
          </Link>
        </div>
      </section>
    </div>
  );
}
