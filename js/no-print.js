// Ngăn học sinh in trang / xuất PDF (chỉ mang tính hạn chế, không tuyệt đối —
// không thể chặn chụp màn hình hoặc công cụ chỉnh sửa mã nguồn của trình duyệt).

(function () {
  function blockShortcut(e) {
    const key = (e.key || "").toLowerCase();
    if ((e.ctrlKey || e.metaKey) && key === "p") {
      e.preventDefault();
      alert("Trang này không hỗ trợ in hoặc lưu PDF.");
      return false;
    }
  }
  document.addEventListener("keydown", blockShortcut);

  window.addEventListener("beforeprint", () => {
    document.title = "Không thể in trang này";
  });
})();
