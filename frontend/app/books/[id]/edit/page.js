"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BookForm from "@/components/BookForm";
import { getBook } from "@/lib/api";

// หน้า "/books/1/edit" = แก้ไขหนังสือ
// ขั้นตอน: ดึง id จาก URL -> โหลดข้อมูลเดิม -> ส่งให้ฟอร์มเติมค่า
export default function EditBookPage() {
  const { id } = useParams();            // อ่านค่า [id] จาก URL
  const [book, setBook] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getBook(id).then(setBook).catch((e) => setError(e.message));
  }, [id]);

  return (
    <div className="panel">
      <h1>แก้ไขหนังสือ</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {/* รอโหลดข้อมูลเสร็จก่อนค่อยแสดงฟอร์ม (ไม่งั้นช่องจะว่าง) */}
      {book ? <BookForm initial={book} /> : !error && <p>กำลังโหลด...</p>}
    </div>
  );
}
