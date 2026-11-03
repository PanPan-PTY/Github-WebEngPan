// =====================================================================
//  book.js — หน้ารายละเอียด book.html?id=3 (READ ตาม id) + แก้ไข/ลบ
// =====================================================================
const id = new URLSearchParams(location.search).get("id");
const box = document.getElementById("detail");

async function load() {
  try {
    const b = await getBook(id); // ไม่พบ -> backend ตอบ 404 -> ไปตกที่ catch
    box.innerHTML = `
      <a href="index.html" class="meta">← กลับไปหน้าหนังสือ</a>
      <div class="detail" style="margin-top:16px">
        <div class="detail-img">${b.cover ? `<img src="${fileUrl(b.cover)}" alt="${esc(b.title)}">` : ""}</div>
        <div>
          <span class="badge">${esc(b.catalogName)}</span>
          <h1>${esc(b.title)}</h1>
          <p class="meta">โดย ${esc(b.author)}</p>
          <div class="price" style="font-size:32px">฿${b.price.toLocaleString()}</div>
          <p class="stock ${b.stock < 5 ? "low" : ""}">คงเหลือ ${b.stock} เล่ม</p>
          <p style="line-height:1.8">${esc(b.description) || "— ไม่มีรายละเอียด —"}</p>
          <p class="meta">รหัส #${b.id} · เพิ่มเมื่อ ${new Date(b.createdAt).toLocaleString("th-TH")}</p>
          <div class="form-actions">
            <a href="book-form.html?id=${b.id}" class="btn btn-primary">✏️ แก้ไข</a>
            <button class="btn btn-danger" id="delBtn">🗑️ ลบหนังสือ</button>
          </div>
        </div>
      </div>`;
    document.getElementById("delBtn").addEventListener("click", async () => {
      if (!confirm("ต้องการลบหนังสือเล่มนี้ใช่หรือไม่?")) return;
      await deleteBook(b.id);
      location.href = "index.html"; // ลบแล้วกลับหน้าแรก
    });
  } catch (e) {
    box.innerHTML = `<div class="alert alert-error">${esc(e.message)}</div><a href="index.html" class="btn btn-outline">← กลับหน้าแรก</a>`;
  }
}
load();
