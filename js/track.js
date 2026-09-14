// ============================================================
// Thống kê truy cập: mỗi lần mở trang (1 tab) = 1 lượt truy cập,
// định kỳ báo về thời lượng đã ở lại. Dữ liệu lưu ở sheet "TruyCap"
// trong Google Sheet, giáo viên xem qua menu "Cập nhật thống kê truy cập".
// ============================================================

const TRACK_SESSION_KEY = "phien_truycap_v1";
const HEARTBEAT_INTERVAL_MS = 20000; // 20 giây

let trackState = null; // { phienId, startedAt }

function sendHeartbeatBeacon(phienId, thoiLuongGiay) {
  if (!navigator.sendBeacon || APPS_SCRIPT_URL.includes("DAN_LINK_APPS_SCRIPT_VAO_DAY")) return;
  const body = new URLSearchParams({
    action: "capnhatphien",
    phienId: String(phienId),
    thoiLuongGiay: String(thoiLuongGiay),
  }).toString();
  const blob = new Blob([body], { type: "application/x-www-form-urlencoded" });
  try {
    navigator.sendBeacon(APPS_SCRIPT_URL, blob);
  } catch (e) {
    // im lặng bỏ qua — thống kê không quan trọng bằng trải nghiệm học
  }
}

function heartbeatTick() {
  if (!trackState) return;
  const giay = Math.round((Date.now() - trackState.startedAt) / 1000);
  sendHeartbeatBeacon(trackState.phienId, giay);
}

function initTracking() {
  const session = getSession();
  if (!session || !session.loggedIn) return;
  if (APPS_SCRIPT_URL.includes("DAN_LINK_APPS_SCRIPT_VAO_DAY")) return;

  const existing = sessionStorage.getItem(TRACK_SESSION_KEY);
  if (existing) {
    try {
      trackState = JSON.parse(existing);
    } catch (e) {
      trackState = null;
    }
  }

  if (!trackState) {
    jsonpRequest(APPS_SCRIPT_URL, {
      action: "batdauphien",
      email: session.email,
      hoTen: session.name || "",
    })
      .then((res) => {
        if (res && res.success && res.phienId) {
          trackState = { phienId: res.phienId, startedAt: Date.now() };
          sessionStorage.setItem(TRACK_SESSION_KEY, JSON.stringify(trackState));
        }
      })
      .catch(() => {});
  }

  setInterval(heartbeatTick, HEARTBEAT_INTERVAL_MS);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") heartbeatTick();
  });
  window.addEventListener("pagehide", heartbeatTick);
}
