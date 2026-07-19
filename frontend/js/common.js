const API_ORIGIN =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "";

const API_BASE = `${API_ORIGIN}/api`;

const STORAGE_KEYS = {
  token: "token",
  user: "user",
  bookmarks: "bookmarks",
  downloads: "downloadCounts",
  seenAnnouncements: "seenAnnouncements"
};

function getToken() {
  return localStorage.getItem(STORAGE_KEYS.token);
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.user) || "null");
  } catch {
    return null;
  }
}

function saveUser(user) {
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

function isAdmin() {
  const user = getUser();
  return Boolean(getToken() && user && user.role === "admin");
}

function isLoggedIn() {
  return Boolean(getToken());
}

function logout() {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
  window.location.href = "index.html";
}

function authHeaders(isJson = true) {
  const headers = {};
  if (isJson) headers["Content-Type"] = "application/json";
  if (getToken()) headers.Authorization = `Bearer ${getToken()}`;
  return headers;
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {})
    }
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (res.status === 401) {
    logout();
    return;
  }

  if (!res.ok) {
    const message = data?.message || "Request failed";
    throw new Error(message);
  }

  return data;
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function formatDate(value) {
  if (!value) return "Not available";
  return new Date(value).toLocaleDateString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function getFileUrl(filePath = "") {
  if (!filePath) return "#";
  if (filePath.startsWith("http")) return filePath;

  const cleanPath = filePath
    .replace(/\\/g, "/")
    .replace(/^.*backend\/uploads\//, "/uploads/")
    .replace(/^.*uploads\//, "/uploads/")
    .replace(/^\/?uploads\//, "/uploads/");

  return `${API_ORIGIN}${cleanPath}`;
}

function getAvatarUrl(profileImage = "") {
  const user = getUser();
  const image = profileImage || user?.profileImage || "";
  return image ? getFileUrl(image) : "";
}

function renderAvatar(profileImage = "", name = "User", size = 48) {
  const url = getAvatarUrl(profileImage);
  const initial = escapeHTML(String(name || "U").trim().charAt(0).toUpperCase() || "U");

  if (url) {
    return `<img src="${url}" alt="${escapeHTML(name)}" class="profile-avatar" style="width:${size}px;height:${size}px;">`;
  }

  return `<span class="profile-avatar profile-avatar--initial" style="width:${size}px;height:${size}px;font-size:${Math.max(size / 2.4, 16)}px;">${initial}</span>`;
}

function showLoader(id, text = "Loading data...") {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerHTML = `
    <div class="col-12">
      <div class="empty-state">
        <div class="spinner-border text-primary"></div>
        <p class="meta mt-3 mb-0">${escapeHTML(text)}</p>
      </div>
    </div>
  `;
}

function showEmpty(id, message = "No data available") {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerHTML = `
    <div class="col-12">
      <div class="empty-state">
        <h5 class="fw-bold mb-2">Nothing found</h5>
        <p class="mb-0">${escapeHTML(message)}</p>
      </div>
    </div>
  `;
}

function showLoginRequired(id, resourceName = "resources") {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerHTML = `
    <div class="col-12">
      <div class="empty-state auth-required-state">
        <h4 class="fw-bold mb-2">Login Required</h4>
        <p class="mb-4">
          Please login or create an account to view ${escapeHTML(resourceName)}.
        </p>

        <div class="d-flex justify-content-center gap-2 flex-wrap">
          <a href="login.html" class="btn btn-primary">Login</a>
          <a href="register.html" class="btn btn-outline-primary">Create Account</a>
        </div>
      </div>
    </div>
  `;
}

function showAlert(id, type, message) {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerHTML = `
    <div class="alert alert-${type} rounded-4">
      ${escapeHTML(message)}
    </div>
  `;
}

function showToast(message = "Action completed", type = "success") {
  let toastContainer = document.getElementById("toastContainer");

  if (!toastContainer) {
    document.body.insertAdjacentHTML("beforeend", `
      <div id="toastContainer" class="toast-container position-fixed top-0 end-0 p-3"></div>
    `);

    toastContainer = document.getElementById("toastContainer");
  }

  const toastId = `toast-${Date.now()}`;

  const toastClasses = {
    success: "text-bg-success",
    error: "text-bg-danger",
    danger: "text-bg-danger",
    warning: "text-bg-warning",
    info: "text-bg-info",
    primary: "text-bg-primary"
  };

  const toastTitle = {
    success: "Success",
    error: "Error",
    danger: "Error",
    warning: "Warning",
    info: "Info",
    primary: "Notice"
  };

  const selectedClass = toastClasses[type] || toastClasses.success;
  const selectedTitle = toastTitle[type] || toastTitle.success;

  toastContainer.insertAdjacentHTML("beforeend", `
    <div id="${toastId}" class="toast align-items-center ${selectedClass} border-0 toast-custom" role="alert">
      <div class="d-flex">
        <div class="toast-body">
          <strong>${escapeHTML(selectedTitle)}:</strong> ${escapeHTML(message)}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  `);

  const toastElement = document.getElementById(toastId);

  if (window.bootstrap && bootstrap.Toast) {
    const toast = new bootstrap.Toast(toastElement, {
      delay: 3000,
      autohide: true
    });

    toast.show();

    toastElement.addEventListener("hidden.bs.toast", () => {
      toastElement.remove();
    });
  } else {
    toastElement.classList.add("show");

    setTimeout(() => {
      toastElement.remove();
    }, 3000);
  }
}

function confirmAction(message = "Are you sure?", onConfirm, options = {}) {
  const title = options.title || "Confirm Action";
  const confirmText = options.confirmText || "Confirm";
  const cancelText = options.cancelText || "Cancel";
  const confirmButtonClass = options.confirmButtonClass || "btn-danger";

  let modal = document.getElementById("confirmActionModal");

  if (!modal) {
    document.body.insertAdjacentHTML("beforeend", `
      <div class="modal fade" id="confirmActionModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content rounded-4 border-0 shadow-lg">
            <div class="modal-header">
              <h5 class="modal-title" id="confirmActionTitle">Confirm Action</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div class="modal-body">
              <p class="mb-0" id="confirmActionMessage">Are you sure?</p>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal" id="confirmActionCancel">
                Cancel
              </button>
              <button type="button" class="btn btn-danger" id="confirmActionButton">
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    `);

    modal = document.getElementById("confirmActionModal");
  }

  document.getElementById("confirmActionTitle").textContent = title;
  document.getElementById("confirmActionMessage").textContent = message;

  const cancelButton = document.getElementById("confirmActionCancel");
  const confirmButton = document.getElementById("confirmActionButton");

  cancelButton.textContent = cancelText;
  confirmButton.textContent = confirmText;
  confirmButton.className = `btn ${confirmButtonClass}`;

  const newConfirmButton = confirmButton.cloneNode(true);
  confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);

  const modalInstance = window.bootstrap && bootstrap.Modal
    ? new bootstrap.Modal(modal)
    : null;

  newConfirmButton.addEventListener("click", async () => {
    if (modalInstance) {
      modalInstance.hide();
    } else {
      modal.style.display = "none";
    }

    if (typeof onConfirm === "function") {
      await onConfirm();
    }
  });

  if (modalInstance) {
    modalInstance.show();
  } else {
    const confirmed = window.confirm(message);
    if (confirmed && typeof onConfirm === "function") {
      onConfirm();
    }
  }
}

function getBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.bookmarks) || "[]");
  } catch {
    return [];
  }
}

function saveBookmarks(items) {
  localStorage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(items));
}

function isBookmarked(type, id) {
  return getBookmarks().some(item => item.type === type && item.id === id);
}

function toggleBookmark(type, item) {
  const bookmarks = getBookmarks();
  const id = item._id || item.id;

  const exists = bookmarks.some(bookmark => bookmark.type === type && bookmark.id === id);

  if (exists) {
    saveBookmarks(bookmarks.filter(bookmark => !(bookmark.type === type && bookmark.id === id)));
    return false;
  }

  bookmarks.push({
    type,
    id,
    title: item.title || "Untitled",
    subject: item.subject || "",
    department: item.department || "",
    semester: item.semester || "",
    year: item.year || "",
    filePath: item.filePath || "",
    createdAt: new Date().toISOString()
  });

  saveBookmarks(bookmarks);
  return true;
}

function getDownloadCounts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.downloads) || "{}");
  } catch {
    return {};
  }
}

function increaseLocalDownloadCount(type, id) {
  const counts = getDownloadCounts();
  const key = `${type}:${id}`;
  counts[key] = Number(counts[key] || 0) + 1;
  localStorage.setItem(STORAGE_KEYS.downloads, JSON.stringify(counts));
  return counts[key];
}

function getLocalDownloadCount(type, id, serverCount = 0) {
  const counts = getDownloadCounts();
  return Number(serverCount || counts[`${type}:${id}`] || 0);
}

async function trackDownload(type, id) {
  increaseLocalDownloadCount(type, id);

  try {
    await apiFetch(`/${type}/${id}/download`, {
      method: "PATCH",
      headers: authHeaders()
    });
  } catch {
  }
}

function openFilePreview(url, title = "File Preview") {
  let modal = document.getElementById("filePreviewModal");

  if (!modal) {
    document.body.insertAdjacentHTML("beforeend", `
      <div class="modal fade" id="filePreviewModal" tabindex="-1">
        <div class="modal-dialog modal-xl modal-dialog-centered">
          <div class="modal-content rounded-4 overflow-hidden">
            <div class="modal-header">
              <h5 class="modal-title" id="filePreviewTitle">File Preview</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-0">
              <iframe id="filePreviewFrame" class="preview-frame"></iframe>
            </div>
            <div class="modal-footer">
              <a id="filePreviewOpen" href="#" target="_blank" class="btn btn-outline-primary">Open New Tab</a>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    `);
    modal = document.getElementById("filePreviewModal");
  }

  document.getElementById("filePreviewTitle").textContent = title;
  document.getElementById("filePreviewFrame").src = url;
  document.getElementById("filePreviewOpen").href = url;

  const instance = new bootstrap.Modal(modal);
  instance.show();
}

function renderPagination({ mountId, page, totalPages, onPageChange }) {
  const root = document.getElementById(mountId);
  if (!root) return;

  if (totalPages <= 1) {
    root.innerHTML = "";
    return;
  }

  let buttons = "";

  for (let i = 1; i <= totalPages; i++) {
    buttons += `
      <button class="btn ${i === page ? "btn-primary" : "btn-outline-primary"} btn-sm"
              onclick="${onPageChange}(${i})">
        ${i}
      </button>
    `;
  }

  root.innerHTML = `
    <div class="d-flex justify-content-center align-items-center gap-2 flex-wrap mt-4">
      <button class="btn btn-outline-primary btn-sm" ${page <= 1 ? "disabled" : ""} onclick="${onPageChange}(${page - 1})">
        Previous
      </button>
      ${buttons}
      <button class="btn btn-outline-primary btn-sm" ${page >= totalPages ? "disabled" : ""} onclick="${onPageChange}(${page + 1})">
        Next
      </button>
    </div>
  `;
}

function getNotificationState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.seenAnnouncements) || "{}");
  } catch {
    return {};
  }
}

function markAnnouncementsSeen(count) {
  localStorage.setItem(STORAGE_KEYS.seenAnnouncements, JSON.stringify({
    count,
    seenAt: new Date().toISOString()
  }));
}

async function getAnnouncementBadge() {
  try {
    const announcements = await apiFetch("/announcements");
    const state = getNotificationState();
    const currentCount = Array.isArray(announcements) ? announcements.length : 0;
    const oldCount = Number(state.count || 0);
    return Math.max(currentCount - oldCount, 0);
  } catch {
    return 0;
  }
}

function setAuthButtons(containerId = "authButtons") {
  const root = document.getElementById(containerId);
  if (!root) return;

  const user = getUser();

  if (!user) {
    root.innerHTML = `
      <a class="btn btn-light me-2" href="login.html">Student Login</a>
      <a class="btn btn-soft-light" href="admin-login.html">Admin</a>
    `;
    return;
  }

  root.innerHTML = `
    <button class="btn btn-soft-light" onclick="logout()">Logout</button>
  `;
}

async function renderNavbar(active = "") {
  const nav = document.getElementById("navbarMount");
  if (!nav) return;

  const user = getUser();
  const dashboardLink = user?.role === "admin" ? "admin-dashboard.html" : "dashboard.html";

  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  const dashboardPages = [
    "dashboard.html",
    "admin-dashboard.html",
    "admin-notes.html",
    "admin-pyq.html",
    "admin-users.html",
    "admin-announcements.html",
    "admin-feedback.html",
    "admin-success-stories.html",
    "recent-activity.html",
    "profile.html",
    "upload-notes.html",
    "upload-pyq.html",
    "change-password.html",
    "feedback.html",
    "cgpa.html"
  ];

  const showDashboardLink = Boolean(user && !dashboardPages.includes(currentPage));

  nav.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark custom-nav">
      <div class="container py-2">
        <a class="navbar-brand d-flex align-items-center fw-bold" href="index.html">
          <span>MU Resource System</span>
        </a>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navMenu">
          <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-2">
            <li class="nav-item">
              <a class="nav-link ${active === "home" ? "active" : ""}" href="index.html">Home</a>
            </li>

            <li class="nav-item">
              <a class="nav-link ${active === "announcements" ? "active" : ""}" href="announcements.html">
                Announcements <span id="announcementBadge" class="notify-badge d-none">0</span>
              </a>
            </li>

           <li class="nav-item">
              <a class="nav-link ${active === "notes" ? "active" : ""}" href="view-notes.html">Notes</a>
            </li>

            <li class="nav-item">
              <a class="nav-link ${active === "pyq" ? "active" : ""}" href="view-pyq.html">PYQ</a>
            </li>

            <li class="nav-item">
              <a class="nav-link ${active === "alumni" ? "active" : ""}" href="alumni-network.html">Alumni</a>
            </li>

            ${showDashboardLink ? `
              <li class="nav-item">
                <a class="nav-link ${active === "dashboard" ? "active" : ""}" href="${dashboardLink}">Dashboard</a>
              </li>
            ` : ""}
          </ul>

          <div class="ms-lg-3 mt-3 mt-lg-0" id="authButtons"></div>
        </div>
      </div>
    </nav>
  `;

  setAuthButtons();

  const badge = document.getElementById("announcementBadge");
  if (badge) {
    const count = await getAnnouncementBadge();
    if (count > 0) {
      badge.textContent = count > 9 ? "9+" : count;
      badge.classList.remove("d-none");
    }
  }
}

function renderFooter() {
  const footer = document.getElementById("footerMount");
  if (!footer) return;

  footer.innerHTML = `
    <footer class="footer mt-5">
      <div class="container">
        <div class="row g-4">
          <div class="col-md-5">
            <h4 class="fw-bold mb-3">MU Resource System</h4>
            <p>
              A web-based academic resource platform for notes, previous year questions,
              announcements, feedback, CGPA tools and student support.
            </p>
          </div>

          <div class="col-md-3">
            <h5 class="fw-semibold mb-3">Quick Links</h5>
            <ul class="list-unstyled d-grid gap-2">
              <li><a href="index.html">Home</a></li>
              <li><a href="view-notes.html">Notes</a></li>
              <li><a href="view-pyq.html">PYQ</a></li>
              <li><a href="contact.html">Contact Support</a></li>
            </ul>
          </div>

          <div class="col-md-4">
            <h5 class="fw-semibold mb-3">Student Tools</h5>
            <ul class="list-unstyled d-grid gap-2">
              <li><a href="cgpa.html">CGPA Calculator</a></li>
              <li><a href="announcements.html">Announcements</a></li>
              <li><a href="feedback.html">Feedback</a></li>
              <li><a href="profile.html">Profile</a></li>
            </ul>
          </div>
        </div>

        <hr class="border-light opacity-25 my-4">

        <p class="mb-0 text-center">© 2026 MU Resource System. All rights reserved.</p>
      </div>
    </footer>
  `;
}

function renderSidebar(active = "") {
  const root = document.getElementById("sidebarMount");
  if (!root) return;

  const user = getUser();

  const studentLinks = [
    ["dashboard.html", "dashboard", "Dashboard"],
    ["view-notes.html", "notes", "Notes"],
    ["view-pyq.html", "pyq", "PYQ"],
    ["announcements.html", "announcements", "Announcements"],
    ["cgpa.html", "cgpa", "CGPA Calculator"],
    ["profile.html", "profile", "Profile"],
    ["feedback.html", "feedback", "Feedback"]
  ];

  const adminLinks = [
    ["admin-dashboard.html", "dashboard", "Dashboard"],
    ["admin-notes.html", "notes", "Manage Notes"],
    ["admin-pyq.html", "pyq", "Manage PYQ"],
    ["admin-announcements.html", "announcements", "Announcements"],
    ["admin-success-stories.html", "success-stories", "Success Stories"],
    ["admin-users.html", "users", "Users"],
    ["admin-feedback.html", "feedback", "Feedback"],
    ["recent-activity.html", "activity", "Recent Activity"]
  ];

  const alumniLinks = [
    ["alumni-network.html", "alumni", "Alumni Network"],
    ["alumni-messages.html", "messages", "Messages"],
    ["profile.html", "profile", "Profile"]
  ];

  const links = user?.role === "admin" ? adminLinks : user?.role === "alumni" ? alumniLinks : studentLinks;

  root.innerHTML = `
    <div class="side-card">
      <div class="d-flex align-items-center gap-3 mb-4">
        ${renderAvatar(user?.profileImage, user?.name, 52)}
        <div>
          <h6 class="fw-bold mb-0">${escapeHTML(user?.name || "Guest")}</h6>
          <small class="meta">${escapeHTML(user?.role || "visitor")}</small>
        </div>
      </div>

      <div class="d-grid gap-2">
        ${links.map(([href, key, label]) => `
          <a class="side-link ${active === key ? "active" : ""}" href="${href}">
            ${label}
          </a>
        `).join("")}
        <button class="side-link text-start border-0" onclick="logout()">Logout</button>
      </div>
    </div>
  `;
}

function ensureLoggedIn() {
  if (!getToken()) {
    window.location.href = "login.html";
  }
}

function ensureAdmin() {
  const user = getUser();

  if (!getToken() || !user || user.role !== "admin") {
    window.location.href = "admin-login.html";
  }
}

function addPageAnimation() {
  const items = document.querySelectorAll(
    ".content-card, .dashboard-tile, .panel-card, .top-card, .list-card, .stat-card, .side-card"
  );

  items.forEach((item, index) => {
    item.style.animationDelay = `${index * 0.04}s`;
  });
}

document.addEventListener("DOMContentLoaded", addPageAnimation);
