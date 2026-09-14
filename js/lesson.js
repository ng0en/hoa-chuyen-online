function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function renderLesson(data) {
  document.getElementById("lesson-title").textContent = data.tieuDe || "";
  document.title = (data.tieuDe || "Bài học") + " — " + SITE_NAME;

  // --- Lý thuyết ---
  const theoryEl = document.getElementById("theory-content");
  theoryEl.innerHTML = data.lyThuyet || "<p>(Chưa có nội dung lý thuyết)</p>";

  // --- Bài tập minh họa (có lời giải, dạng "xem lời giải") ---
  const illustratedWrap = document.getElementById("illustrated-list");
  illustratedWrap.innerHTML = "";
  (data.baiTapMinhHoa || []).forEach((bt, idx) => {
    const box = document.createElement("div");
    box.className = "exercise";
    box.innerHTML = `
      <div class="ex-question"><span class="ex-num">Ví dụ ${idx + 1}.</span>${bt.de}</div>
      <button class="reveal-btn" data-target="sol-${idx}">Xem lời giải</button>
      <div class="solution-box" id="sol-${idx}">
        <div class="sol-label">LỜI GIẢI</div>
        <div>${bt.loiGiai}</div>
      </div>
    `;
    illustratedWrap.appendChild(box);
  });

  // --- Bài tập tự luyện (hiện đáp án) ---
  const practiceWrap = document.getElementById("practice-list");
  practiceWrap.innerHTML = "";
  (data.baiTapTuLuyen || []).forEach((bt, idx) => {
    const box = document.createElement("div");
    box.className = "exercise";
    box.innerHTML = `
      <div class="ex-question"><span class="ex-num">Câu ${idx + 1}.</span>${bt.de}</div>
      <button class="reveal-btn" data-target="ans-${idx}">Hiện đáp án</button>
      <div class="answer-box" id="ans-${idx}">
        <div class="answer-label">ĐÁP ÁN</div>
        <div>${bt.dapAn}</div>
      </div>
    `;
    practiceWrap.appendChild(box);
  });

  // Gắn sự kiện toggle cho tất cả nút hiện đáp án / lời giải
  document.querySelectorAll(".reveal-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.target);
      const willShow = !target.classList.contains("show");
      target.classList.toggle("show");
      btn.textContent = willShow
        ? (btn.textContent.startsWith("Xem") ? "Ẩn lời giải" : "Ẩn đáp án")
        : (target.classList.contains("solution-box") ? "Xem lời giải" : "Hiện đáp án");
    });
  });

  // --- Ghi chú cá nhân (lưu trong trình duyệt của học sinh) ---
  const notesKey = "notes_" + data.id;
  const notesArea = document.getElementById("notes-area");
  notesArea.value = localStorage.getItem(notesKey) || "";
  notesArea.addEventListener("input", () => {
    localStorage.setItem(notesKey, notesArea.value);
  });
}

function loadLesson() {
  const id = getQueryParam("id");
  if (!id) {
    document.getElementById("lesson-body").innerHTML =
      '<p class="loading">Thiếu mã chương học.</p>';
    return;
  }
  fetch(`data/${id}.json`)
    .then((r) => {
      if (!r.ok) throw new Error("not found");
      return r.json();
    })
    .then((data) => {
      data.id = id;
      renderLesson(data);
    })
    .catch(() => {
      document.getElementById("lesson-body").innerHTML =
        '<p class="loading">Không tìm thấy nội dung chương này.</p>';
    });
}
