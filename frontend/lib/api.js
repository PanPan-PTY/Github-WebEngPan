// รวมฟังก์ชันเรียก Backend API ไว้ที่เดียว
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
export const fileUrl = (p) => (p ? `${API_URL}${p}` : null);

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store", ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด");
  return data;
}

const json = (method, body) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// ---- catalogs (JSON) ----
export const getCatalogs = () => request("/api/catalogs");
export const createCatalog = (body) => request("/api/catalogs", json("POST", body));
export const updateCatalog = (id, body) => request(`/api/catalogs/${id}`, json("PUT", body));
export const deleteCatalog = (id) => request(`/api/catalogs/${id}`, { method: "DELETE" });

// ---- books (FormData เพราะมีอัปโหลดปก — ห้ามตั้ง Content-Type เอง) ----
export const getBooks = (q = "", catalogId = "") =>
  request(`/api/books?q=${encodeURIComponent(q)}&catalogId=${encodeURIComponent(catalogId)}`);
export const getBook = (id) => request(`/api/books/${id}`);
export const createBook = (fd) => request("/api/books", { method: "POST", body: fd });
export const updateBook = (id, fd) => request(`/api/books/${id}`, { method: "PUT", body: fd });
export const deleteBook = (id) => request(`/api/books/${id}`, { method: "DELETE" });
