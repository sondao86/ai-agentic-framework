import GenerationForm from "@/components/admin/GenerationForm";

export default function ContentGenerationPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-sacred-700">
          Tạo nội dung
        </h1>
        <p className="mt-2 text-sacred-700/70">
          Sử dụng AI để tạo nội dung chiêm niệm mới. Nội dung sẽ được tạo ở trạng thái bản nháp
          và cần được xác minh trước khi xuất bản.
        </p>
      </div>

      <GenerationForm />
    </div>
  );
}
