import BookForm from "@/components/BookForm";

// หน้า "/books/new" = เพิ่มหนังสือ (ใช้ฟอร์มกลาง ไม่ส่ง initial)
export default function NewBookPage() {
  return (
    <div className="panel">
      <h1>เพิ่มหนังสือใหม่</h1>
      <BookForm />
    </div>
  );
}
