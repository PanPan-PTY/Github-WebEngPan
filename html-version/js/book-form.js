// =====================================================================
//  book-form.js — ฟอร์มเพิ่ม/แก้ไขหนังสือ (หน้าเดียวใช้ทั้งสองโหมด)
//    book-form.html       -> เพิ่ม
//    book-form.html?id=3  -> แก้ไขเล่มที่ 3
// =====================================================================
const form = document.getElementById("bookForm");
const select = document.getElementById("catalogSelect");
const coverInput = document.getElementById("coverInput");
const dropzone = document.getElementById("dropzone");
const saveBtn = document.getElementById("saveBtn");

// อ่านค่า ?id= จาก URL  (ไม่มี = โหมดเพิ่ม)
const editId = new URLSearchParams(location.search).get("id");

// โชว์รูปตัวอย่างในกรอบอัปโหลด
function showPreview(src) {
  dropzone.querySelectorAll("img").forEach((i) => i.remove());
  dropzone.insertAdjacentHTML("afterbegin", `<img src="${src}" alt="preview">`);
}

// ตอนเลือกไฟล์: สร้าง URL ชั่วคราวไว้โชว์ preview
coverInput.addEventListener("change", () => {
  const f = coverInput.files[0];
  if (f) showPreview(URL.createObjectURL(f));
});

// ตั้งค่าตอนเปิดหน้า
async function init() {
  try {
    // 1) เติม dropdown catalog
    const catalogs = await getCatalogs();
    select.innerHTML = catalogs.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("");

    // 2) ถ้าเป็นโหมดแก้ไข: โหลดข้อมูลเดิมมาใส่ฟอร์ม
    if (editId) {
      document.getElementById("pageTitle").textContent = "แก้ไขหนังสือ";
      const b = await getBook(editId);
      // ใช้ form.elements.ชื่อ (ไม่ใช่ form.title เพราะ form.title ชนกับ property title ของ HTML)
      form.elements.title.value = b.title;
      form.elements.author.value = b.author;
      form.elements.catalogId.value = b.catalogId;
      form.elements.price.value = b.price;
      form.elements.stock.value = b.stock;
      form.elements.description.value = b.description;
      if (b.cover) showPreview(fileUrl(b.cover));
    }
  } catch (e) {
    showError(e.message);
  }
}

// ตอนกดบันทึก
form.addEventListener("submit", async (e) => {
  e.preventDefault();          // กันหน้า refresh
  saveBtn.disabled = true;     // กันกดซ้ำ
  showError("");
  try {
    // new FormData(form) ดึงทุกช่องที่มี name ในฟอร์มมาให้เลย รวมถึงไฟล์ cover
    // (ชื่อ "cover" ต้องตรงกับ upload.single("cover") ฝั่ง backend)
    const fd = new FormData(form);
    const saved = editId ? await updateBook(editId, fd) : await createBook(fd);
    location.href = "book.html?id=" + saved.id; // สำเร็จ -> ไปหน้ารายละเอียด
  } catch (err) {
    showError(err.message);    // เช่น "ไม่พบ catalog ที่เลือก"
    saveBtn.disabled = false;
  }
});

init();
