"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBook, updateBook, getCatalogs, fileUrl } from "@/lib/api";

// ฟอร์มเดียวใช้ได้ทั้ง "เพิ่ม" และ "แก้ไข"
export default function BookForm({ initial }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [catalogs, setCatalogs] = useState([]);
  const [form, setForm] = useState({
    title: initial?.title || "",
    author: initial?.author || "",
    catalogId: initial?.catalogId ?? "",
    price: initial?.price ?? "",
    stock: initial?.stock ?? "",
    description: initial?.description || "",
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(fileUrl(initial?.cover));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCatalogs().then((rows) => {
      setCatalogs(rows);
      // ตั้งค่าเริ่มต้นเป็น catalog แรกเมื่อเป็นฟอร์มเพิ่ม
      setForm((f) => (f.catalogId === "" && rows.length ? { ...f, catalogId: rows[0].id } : f));
    }).catch((e) => setError(e.message));
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append("cover", file); // ชื่อ field ต้องตรงกับ upload.single("cover")
      const saved = isEdit ? await updateBook(initial.id, fd) : await createBook(fd);
      router.push(`/books/${saved.id}`);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-grid">
        <div className="fields">
          <div className="full">
            <label>ชื่อหนังสือ *</label>
            <input className="input" name="title" value={form.title} onChange={onChange} required />
          </div>
          <div>
            <label>ผู้แต่ง *</label>
            <input className="input" name="author" value={form.author} onChange={onChange} required />
          </div>
          <div>
            <label>Catalog *</label>
            <select className="input" name="catalogId" value={form.catalogId} onChange={onChange} required>
              {catalogs.length === 0 && <option value="">(ยังไม่มี catalog)</option>}
              {catalogs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label>ราคา (บาท) *</label>
            <input className="input" type="number" min="0" name="price" value={form.price} onChange={onChange} required />
          </div>
          <div>
            <label>จำนวนคงเหลือ</label>
            <input className="input" type="number" min="0" name="stock" value={form.stock} onChange={onChange} />
          </div>
          <div className="full">
            <label>รายละเอียด</label>
            <textarea className="input" rows={5} name="description" value={form.description} onChange={onChange} />
          </div>
        </div>

        <div>
          <label>ปกหนังสือ</label>
          <label className="dropzone">
            {preview ? <img src={preview} alt="preview" /> : (
              <>
                <span style={{ fontSize: 40 }}>📷</span>
                <span>คลิกเพื่ออัปโหลดปก</span>
                <small>JPG / PNG / WEBP ไม่เกิน 5MB</small>
              </>
            )}
            <input type="file" name="cover" accept="image/*" onChange={onFile} />
          </label>
          {file && <p className="meta">ไฟล์ที่เลือก: {file.name}</p>}
        </div>
      </div>

      <div className="form-actions">
        <button className="btn btn-primary" disabled={saving}>{saving ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "เพิ่มหนังสือ"}</button>
        <button type="button" className="btn btn-outline" onClick={() => router.back()}>ยกเลิก</button>
      </div>
    </form>
  );
}
