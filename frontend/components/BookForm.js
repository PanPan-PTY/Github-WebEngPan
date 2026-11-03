"use client"; // บอก Next.js ว่าไฟล์นี้ทำงานฝั่ง browser (ใช้ useState / useEffect / onClick ได้)
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBook, updateBook, getCatalogs, fileUrl } from "@/lib/api";

// ฟอร์มเดียวใช้ได้ทั้ง "เพิ่ม" และ "แก้ไข"
//   - เพิ่ม:  <BookForm />                    (ไม่ส่ง initial)
//   - แก้ไข: <BookForm initial={ข้อมูลเดิม} />  (ส่งข้อมูลเดิมมาเติมในฟอร์ม)
export default function BookForm({ initial }) {
  const router = useRouter();                // ใช้เปลี่ยนหน้า
  const isEdit = Boolean(initial?.id);       // มี id = โหมดแก้ไข

  // ---------- state (ค่าที่เปลี่ยนแล้วหน้าจอต้องอัปเดต) ----------
  const [catalogs, setCatalogs] = useState([]); // รายการ catalog สำหรับ dropdown
  const [form, setForm] = useState({            // ค่าในช่องกรอก (โหมดแก้ไขเติมค่าเดิมให้)
    title: initial?.title || "",
    author: initial?.author || "",
    catalogId: initial?.catalogId ?? "",
    price: initial?.price ?? "",
    stock: initial?.stock ?? "",
    description: initial?.description || "",
  });
  const [file, setFile] = useState(null);                       // ไฟล์ปกที่เพิ่งเลือก
  const [preview, setPreview] = useState(fileUrl(initial?.cover)); // รูปตัวอย่าง (โหมดแก้ไขโชว์ปกเดิม)
  const [saving, setSaving] = useState(false);                  // กำลังบันทึก -> ปิดปุ่มกันกดซ้ำ
  const [error, setError] = useState("");                       // ข้อความ error จาก backend

  // โหลดรายการ catalog ตอนเปิดหน้า (dependency [] = ทำครั้งเดียว)
  useEffect(() => {
    getCatalogs().then((rows) => {
      setCatalogs(rows);
      // โหมดเพิ่ม: เลือก catalog แรกให้อัตโนมัติ
      setForm((f) => (f.catalogId === "" && rows.length ? { ...f, catalogId: rows[0].id } : f));
    }).catch((e) => setError(e.message));
  }, []);

  // ช่องกรอกทุกช่องใช้ฟังก์ชันนี้ร่วมกัน: ใช้ name ของ input เป็น key (ต้องตรงกับชื่อใน state form)
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ตอนเลือกไฟล์: เก็บไฟล์ไว้ + สร้าง URL ชั่วคราวไว้โชว์ preview
  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  // ตอนกดบันทึก
  const onSubmit = async (e) => {
    e.preventDefault(); // กันไม่ให้หน้า refresh
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();                                 // กล่องใส่ข้อมูล + ไฟล์ ส่งแบบ multipart
      Object.entries(form).forEach(([k, v]) => fd.append(k, v)); // ใส่ทุกช่องข้อความ
      if (file) fd.append("cover", file);                        // ใส่ไฟล์ — ชื่อ "cover" ต้องตรงกับ upload.single("cover") ฝั่ง backend
      const saved = isEdit ? await updateBook(initial.id, fd) : await createBook(fd);
      router.push(`/books/${saved.id}`); // สำเร็จ -> ไปหน้ารายละเอียด
      router.refresh();
    } catch (err) {
      setError(err.message); // โชว์ข้อความที่ backend ตอบมา เช่น "ไม่พบ catalog ที่เลือก"
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
            {/* dropdown จากตาราง catalogs: value คือ id ที่จะส่งไปบันทึกเป็น catalogId */}
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

        {/* ส่วนอัปโหลดปก: label ครอบ input[type=file] ที่ซ่อนไว้ คลิกตรงไหนก็เลือกไฟล์ได้ */}
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
