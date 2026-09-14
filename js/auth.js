// ============================================================
// Xử lý đăng nhập bằng mã do giáo viên cấp, gửi qua email.
// Dùng kỹ thuật JSONP để gọi Google Apps Script từ trang tĩnh
// (GitHub Pages) mà không bị chặn bởi CORS.
// ============================================================

const SESSION_KEY = "hocsinh_session_v1";

function jsonpRequest(baseUrl, params, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const callbackName = "jsonp_cb_" + Math.random().toString(36).slice(2);
    const script = document.createElement("script");
    const qs = new URLSearchParams({ ...params, callback: callbackName }).toString();

    const cleanup = () => {
      delete window[callbackName];
      script.remove();
      clearTimeout(timer);
    };

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Hết thời gian chờ phản hồi từ máy chủ. Kiểm tra lại đường link Apps Script trong js/config.js."));
    }, timeoutMs);

    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    script.src = `${baseUrl}?${qs}`;
    script.onerror = () => {
      cleanup();
      reject(new Error("Không gọi được máy chủ xác thực. Kiểm tra đường link Apps Script và kết nối mạng."));
    };
    document.body.appendChild(script);
  });
}

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function setSession(data) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// Bắt buộc phải đăng nhập mới xem được trang; gọi ở đầu mỗi trang nội bộ
function requireLogin() {
  const session = getSession();
  if (!session || !session.loggedIn) {
    window.location.href = "index.html";
    return null;
  }
  return session;
}

function logout() {
  clearSession();
  window.location.href = "index.html";
}

// Gắn xử lý cho form đăng nhập (gọi trong index.html)
function initLoginForm() {
  const form = document.getElementById("login-form");
  const errorBox = document.getElementById("login-error");
  const submitBtn = document.getElementById("login-submit");

  if (!form) return;

  // Nếu đã đăng nhập rồi thì vào thẳng dashboard
  const existing = getSession();
  if (existing && existing.loggedIn) {
    window.location.href = "dashboard.html";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.classList.remove("show");

    const email = document.getElementById("email").value.trim();
    const code = document.getElementById("code").value.trim();

    if (!email || !code) return;

    if (APPS_SCRIPT_URL.includes("DAN_LINK_APPS_SCRIPT_VAO_DAY")) {
      errorBox.textContent = "Trang web chưa được cấu hình xong: chưa dán link Apps Script vào js/config.js.";
      errorBox.classList.add("show");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Đang kiểm tra...";

    try {
      const res = await jsonpRequest(APPS_SCRIPT_URL, {
        action: "login",
        email,
        code,
      });

      if (res && res.success) {
        setSession({
          loggedIn: true,
          email,
          name: res.name || email,
          loginAt: Date.now(),
        });
        window.location.href = "dashboard.html";
      } else {
        errorBox.textContent = (res && res.message) || "Email hoặc mã đăng nhập không đúng.";
        errorBox.classList.add("show");
      }
    } catch (err) {
      errorBox.textContent = err.message || "Có lỗi xảy ra, thử lại sau.";
      errorBox.classList.add("show");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Đăng nhập";
    }
  });
}
