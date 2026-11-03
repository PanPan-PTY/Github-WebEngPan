"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BookForm from "@/components/BookForm";
import { getBook } from "@/lib/api";

export default function EditBookPage() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getBook(id).then(setBook).catch((e) => setError(e.message));
  }, [id]);

  return (
    <div className="panel">
      <h1>แก้ไขหนังสือ</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {book ? <BookForm initial={book} /> : !error && <p>กำลังโหลด...</p>}
    </div>
  );
}
