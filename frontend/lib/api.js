// =====================================================================
//  รวมฟังก์ชันเรียก Backend ไว้ที่ไฟล์เดียว  — หน้าอื่นๆ แค่ import ไปใช้
//  ถ้าเปลี่ยน URL ของ API แก้ที่ .env.local (NEXT_PUBLIC_API_URL) ที่เดียว
// =====================================================================

// NEXT_PUBLIC_ = ตัวแปรที่ฝั่ง browser อ่านได้ (ไม่มี prefix นี้ browser จะมองไม่เห็น)
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// แปลง path ปก "/uploads/xxx.jpg" ให้เป็น URL เต็ม เพื่อเอาไปใส่ <img src>
export const fileUrl = (p) => (p ? `${API_URL}${p}` : null);

// ฟังก์ชันกลาง: ยิง fetch -> แปลงผลเป็น JSON -> ถ้า error (status ไม่ใช่ 2xx) ให้ throw ข้อความจาก backend
async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store", ...options }); // no-store = ไม่แคช เอาข้อมูลสดเสมอ
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด"); // ไปตกที่ catch ของหน้าที่เรียกใช้
  return data;
}

// ตัวช่วยสร้าง options สำหรับส่งข้อมูลแบบ JSON
const json = (method, body) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// ---------- catalogs: ส่ง JSON ธรรมดา ----------
export const getCatalogs = () => request("/api/catalogs");
export const createCatalog = (body) => request("/api/catalogs", json("POST", body));
export const updateCatalog = (id, body) => request(`/api/catalogs/${id}`, json("PUT", body));
export const deleteCatalog = (id) => request(`/api/catalogs/${id}`, { method: "DELETE" });

// ---------- books: ส่ง FormData เพราะมีไฟล์ปก ----------
// !! ห้ามใส่ headers Content-Type เอง — browser จะใส่ multipart + boundary ให้อัตโนมัติ
//    ถ้าใส่เอง ไฟล์จะไปไม่ถึง backend
// encodeURIComponent = แปลงคำค้นภาษาไทย/อักขระพิเศษให้ใส่ใน URL ได้
export const getBooks = (q = "", catalogId = "") =>
  request(`/api/books?q=${encodeURIComponent(q)}&catalogId=${encodeURIComponent(catalogId)}`);
export const getBook = (id) => request(`/api/books/${id}`);
export const createBook = (fd) => request("/api/books", { method: "POST", body: fd });
export const updateBook = (id, fd) => request(`/api/books/${id}`, { method: "PUT", body: fd });
export const deleteBook = (id) => request(`/api/books/${id}`, { method: "DELETE" });
