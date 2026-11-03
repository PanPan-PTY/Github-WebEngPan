// =====================================================================
//  books.js — หน้าแรก: แสดงรายการหนังสือ + ค้นหา + กรอง + ลบ
//  แนวคิด: ดึงข้อมูลจาก API -> สร้าง HTML เป็นสตริง -> ใส่ลงใน #list
// =====================================================================
const listEl = document.getElementById("list");
const searchEl = document.getElementById("search");
const filterEl = document.getElementById("catalogFilter");

// ดึงหนังสือตามคำค้น/ตัวกรองปัจจุบัน แล้ววาดการ์ด
async function loadBooks() {
  try {
    showError("");
    const books = await getBooks(searchEl.value, filterEl.value);
    if (books.length === 0) {
      listEl.innerHTML = '<div class="empty">ไม่พบหนังสือ</div>';
      return;
    }
    // .map สร้าง HTML ต่อเล่ม แล้ว .join("") ต่อเป็นสตริงเดียว
    listEl.innerHTML = books.map((b) => `
      <div class="card">
        <a href="book.html?id=${b.id}" class="card-img">
          ${b.cover ? `<img src="${fileUrl(b.cover)}" alt="${esc(b.title)}">` : "ไม่มีปก"}
        </a>
        <div class="card-body">
          <span class="badge">${esc(b.catalogName)}</span>
          <a href="book.html?id=${b.id}"><h3 class="card-title">${esc(b.title)}</h3></a>
          <div class="meta">${esc(b.author)}</div>
          <div class="price">฿${b.price.toLocaleString()}</div>
          <div class="stock ${b.stock < 5 ? "low" : ""}">คงเหลือ ${b.stock} เล่ม</div>
          <div class="card-actions">
            <a href="book-form.html?id=${b.id}" class="btn btn-outline">แก้ไข</a>
            <button class="btn btn-danger" onclick="onDelete(${b.id}, '${esc(b.title).replace(/'/g, "")}')">ลบ</button>
          </div>
        </div>
      </div>`).join("");
  } catch (e) {
    showError("เชื่อมต่อ API ไม่ได้: " + e.message);
  }
}

// ลบ: ถามยืนยัน -> เรียก API -> วาดรายการใหม่
// (ฟังก์ชันนี้ถูกเรียกจาก onclick ใน HTML ด้านบน จึงต้องเป็นฟังก์ชันระดับบนสุด)
async function onDelete(id, title) {
  if (!confirm('ต้องการลบ "' + title + '" ใช่หรือไม่?')) return;
  try { await deleteBook(id); loadBooks(); } catch (e) { showError(e.message); }
}

// เติม dropdown กรองด้วย catalog ทั้งหมด (ทำครั้งเดียวตอนเปิดหน้า)
async function loadFilter() {
  const catalogs = await getCatalogs();
  catalogs.forEach((c) => {
    filterEl.insertAdjacentHTML("beforeend", `<option value="${c.id}">${esc(c.name)}</option>`);
  });
}

// ค้นหาแบบ debounce: รอ 300ms หลังหยุดพิมพ์ค่อยยิง API
let timer;
searchEl.addEventListener("input", () => {
  clearTimeout(timer);
  timer = setTimeout(loadBooks, 300);
});
filterEl.addEventListener("change", loadBooks);

// เริ่มทำงานเมื่อเปิดหน้า
loadFilter().catch(() => {});
loadBooks();
