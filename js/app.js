// ============================================================
// Ứng dụng chính: sidebar danh sách chương/chủ đề + nội dung bài học
// ============================================================

let STRUCTURE = null;
let CURRENT_TOPIC = null;

function typesetMath() {
  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise().catch(() => {});
  } else {
    // MathJax script vẫn đang tải (defer) — thử lại sau một chút
    setTimeout(typesetMath, 400);
  }
}

function findTopicMeta(topicId) {
  for (const chuong of STRUCTURE) {
    for (const ct of chuong.chuDe) {
      if (ct.id === topicId) return { chuong, chuDe: ct };
    }
  }
  return null;
}

function renderSidebar() {
  const nav = document.getElementById("sidebar");
  nav.innerHTML = "";
  STRUCTURE.forEach((chuong) => {
    const block = document.createElement("div");
    block.className = "chuong-block";
    block.dataset.chuong = chuong.id;

    const header = document.createElement("div");
    header.className = "chuong-header";
    header.innerHTML = `<span class="chuong-icon">${chuong.icon || "📘"}</span><span>${chuong.ten}</span><span class="chuong-caret">▾</span>`;
    header.addEventListener("click", () => block.classList.toggle("collapsed"));
    block.appendChild(header);

    const ul = document.createElement("ul");
    ul.className = "chude-list";
    chuong.chuDe.forEach((ct) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.className = "chude-link";
      a.href = `#${ct.id}`;
      a.textContent = `Chủ đề ${ct.so}: ${ct.ten}`;
      a.dataset.topicId = ct.id;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        loadTopic(ct.id);
        closeSidebarOnMobile();
      });
      li.appendChild(a);
      ul.appendChild(li);
    });
    block.appendChild(ul);
    nav.appendChild(block);
  });
}

function setActiveLink(topicId) {
  document.querySelectorAll(".chude-link").forEach((a) => {
    a.classList.toggle("active", a.dataset.topicId === topicId);
  });
}

function renderWelcome() {
  document.getElementById("content-area").innerHTML = `
    <div class="welcome-box">
      <h2>Chào mừng bạn 👋</h2>
      <p>Chọn một chủ đề ở danh sách bên trái để bắt đầu học.</p>
    </div>
  `;
}

function sectionBlock(tagNum, title, innerHtml, emptyText) {
  const hasContent = innerHtml && innerHtml.trim().length > 0;
  return `
    <div class="section-block">
      <div class="section-title"><span class="tag">${tagNum}</span> ${title}</div>
      ${hasContent ? `<div class="theory-content">${innerHtml}</div>` : `<p class="page-desc">${emptyText}</p>`}
    </div>
  `;
}

function loadTopic(topicId) {
  const meta = findTopicMeta(topicId);
  if (!meta) {
    document.getElementById("content-area").innerHTML = '<p class="loading">Không tìm thấy chủ đề này.</p>';
    return;
  }
  CURRENT_TOPIC = topicId;
  setActiveLink(topicId);
  window.location.hash = topicId;

  document.getElementById("content-area").innerHTML = '<div class="loading">Đang tải nội dung...</div>';

  fetch(`data/topics/${topicId}.json`)
    .then((r) => {
      if (!r.ok) throw new Error("not found");
      return r.json();
    })
    .then((data) => {
      document.title = `${data.tieuDe} — ${SITE_NAME}`;

      const notesKey = "notes_" + topicId;
      const savedNotes = localStorage.getItem(notesKey) || "";

      document.getElementById("content-area").innerHTML = `
        <h2 class="page-title">Chủ đề ${meta.chuDe.so}: ${data.tieuDe}</h2>
        <p class="page-desc">${meta.chuong.ten}</p>

        ${sectionBlock(1, "Lý thuyết", data.lyThuyetHtml, "(Chưa có nội dung lý thuyết cho chủ đề này)")}
        ${sectionBlock(2, "Bài tập minh họa", data.baiTapMinhHoaHtml, "(Chưa có bài tập minh họa cho chủ đề này)")}
        ${sectionBlock(3, "Bài tập tự luyện", data.baiTapTuLuyenHtml, "(Chưa có bài tập tự luyện cho chủ đề này)")}

        <div class="section-block">
          <div class="section-title"><span class="tag">4</span> Ghi chú của em</div>
          <textarea class="notes-area" id="notes-area" placeholder="Ghi chú riêng của em về bài học này...">${savedNotes}</textarea>
          <div class="notes-hint">Ghi chú được lưu tự động trên trình duyệt này (không gửi cho giáo viên).</div>
        </div>

        <div class="report-section">
          <button class="report-link-btn" id="report-open-btn">🚩 Báo lỗi nội dung ở chủ đề này</button>
        </div>
      `;

      document.getElementById("notes-area").addEventListener("input", (e) => {
        localStorage.setItem(notesKey, e.target.value);
      });

      document.getElementById("report-open-btn").addEventListener("click", () => {
        openReportModal(topicId, `Chủ đề ${meta.chuDe.so}: ${data.tieuDe}`);
      });

      typesetMath();
      window.scrollTo({ top: 0, behavior: "instant" });
    })
    .catch(() => {
      document.getElementById("content-area").innerHTML =
        '<p class="loading">Không tải được nội dung chủ đề này.</p>';
    });
}

// Bấm nút "Xem lời giải" / "Hiện đáp án" — dùng event delegation
// vì nội dung được chèn động.
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".reveal-btn");
  if (!btn) return;
  const box = btn.nextElementSibling;
  if (!box) return;
  const willShow = !box.classList.contains("show");
  box.classList.toggle("show");
  if (box.classList.contains("solution-box")) {
    btn.textContent = willShow ? "Ẩn lời giải" : "Xem lời giải";
  } else {
    btn.textContent = willShow ? "Ẩn đáp án" : "Hiện đáp án";
  }
});

function closeSidebarOnMobile() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-overlay").classList.remove("show");
}

function initSidebarToggle() {
  const toggle = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (!toggle) return;
  toggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("show");
  });
  overlay.addEventListener("click", closeSidebarOnMobile);
}

// ---------- Modal báo lỗi nội dung ----------
let REPORT_TOPIC_ID = null;

function openReportModal(topicId, topicLabel) {
  REPORT_TOPIC_ID = topicId;
  document.getElementById("report-topic-name").textContent = topicLabel;
  document.getElementById("report-text").value = "";
  const msg = document.getElementById("report-msg");
  msg.textContent = "";
  msg.className = "modal-msg";
  document.getElementById("report-overlay").classList.add("show");
  document.getElementById("report-text").focus();
}

function closeReportModal() {
  document.getElementById("report-overlay").classList.remove("show");
}

function submitReport() {
  const text = document.getElementById("report-text").value.trim();
  const msg = document.getElementById("report-msg");

  if (!text) {
    msg.textContent = "Vui lòng nhập nội dung lỗi.";
    msg.className = "modal-msg error";
    return;
  }
  if (APPS_SCRIPT_URL.includes("DAN_LINK_APPS_SCRIPT_VAO_DAY")) {
    msg.textContent = "Chưa cấu hình xong máy chủ, không gửi được lúc này.";
    msg.className = "modal-msg error";
    return;
  }

  const session = getSession();
  const submitBtn = document.getElementById("report-submit");
  submitBtn.disabled = true;
  submitBtn.textContent = "Đang gửi...";

  const meta = findTopicMeta(REPORT_TOPIC_ID);
  const chuDeTen = meta ? `Chủ đề ${meta.chuDe.so}: ${meta.chuDe.ten}` : REPORT_TOPIC_ID;

  jsonpRequest(APPS_SCRIPT_URL, {
    action: "baoloi",
    chuDeId: REPORT_TOPIC_ID,
    chuDeTen,
    email: (session && session.email) || "",
    noiDung: text,
  })
    .then((res) => {
      if (res && res.success) {
        msg.textContent = "Đã gửi, cảm ơn em!";
        msg.className = "modal-msg ok";
        setTimeout(closeReportModal, 1200);
      } else {
        msg.textContent = (res && res.message) || "Gửi không thành công, thử lại sau.";
        msg.className = "modal-msg error";
      }
    })
    .catch((err) => {
      msg.textContent = err.message || "Có lỗi xảy ra, thử lại sau.";
      msg.className = "modal-msg error";
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = "Gửi báo lỗi";
    });
}

function initReportModal() {
  const cancelBtn = document.getElementById("report-cancel");
  const submitBtn = document.getElementById("report-submit");
  const overlay = document.getElementById("report-overlay");
  if (!overlay) return;
  cancelBtn.addEventListener("click", closeReportModal);
  submitBtn.addEventListener("click", submitReport);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeReportModal();
  });
}

function initApp() {
  initReportModal();
  initSidebarToggle();
  fetch("data/structure.json")
    .then((r) => r.json())
    .then((structure) => {
      STRUCTURE = structure;
      renderSidebar();
      const hashTopic = window.location.hash.replace("#", "");
      if (hashTopic) {
        loadTopic(hashTopic);
      } else {
        renderWelcome();
      }
    })
    .catch(() => {
      document.getElementById("content-area").innerHTML =
        '<p class="loading">Không tải được danh sách chương.</p>';
    });

  window.addEventListener("hashchange", () => {
    const hashTopic = window.location.hash.replace("#", "");
    if (hashTopic && hashTopic !== CURRENT_TOPIC) loadTopic(hashTopic);
  });
}
