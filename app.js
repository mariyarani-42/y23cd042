"use strict";

/* ═══════════════════════════════════════
   CONFIG
═══════════════════════════════════════ */
const API = "http://127.0.0.1:5000";

/* ═══════════════════════════════════════
   STATE
═══════════════════════════════════════ */
window.currentUser  = null;
window.selectedRole = "student";
window.allUsers     = [];
window.activationToken = null;

/* ═══════════════════════════════════════
   PAGE ROUTER
═══════════════════════════════════════ */
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const el = document.getElementById(id);
  if (el) { el.classList.add("active"); window.scrollTo(0, 0); }
  else console.warn("Page not found:", id);
}

/* ═══════════════════════════════════════
   TOAST
═══════════════════════════════════════ */
let _toastTimer;
function toast(msg, type = "success") {
  const t = document.getElementById("toast");
  if (!t) { alert(msg); return; }
  document.getElementById("toast-msg").textContent = msg;
  t.className = type === "error" ? "error show" : "show";
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove("show"), 3500);
}

/* ═══════════════════════════════════════
   LOADING
═══════════════════════════════════════ */
function setLoading(show, msg = "Loading…") {
  const l = document.getElementById("loading");
  if (!l) return;
  document.getElementById("loading-msg").textContent = msg;
  l.classList.toggle("show", show);
}

/* ═══════════════════════════════════════
   MODAL
═══════════════════════════════════════ */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("open");
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("open");
}

/* ═══════════════════════════════════════
   ROLE SELECT
═══════════════════════════════════════ */
function selectRole(role) {
  window.selectedRole = role;
  document.getElementById("role-student-btn").classList.toggle("active", role === "student");
  document.getElementById("role-employee-btn").classList.toggle("active", role === "employee");
}

/* ═══════════════════════════════════════
   SKILL TAG MANAGER
═══════════════════════════════════════ */
function addTag(inputId, containerId) {
  const inp = document.getElementById(inputId);
  const con = document.getElementById(containerId);
  if (!inp || !con) return;
  const val = inp.value.trim();
  if (!val) return;
  const exists = Array.from(con.querySelectorAll(".sk-tag"))
    .some(t => t.dataset.val === val.toLowerCase());
  if (exists) { toast("Skill already added", "error"); inp.value = ""; return; }
  const tag = document.createElement("div");
  tag.className = "sk-tag";
  tag.dataset.val = val.toLowerCase();
  tag.innerHTML = `${val} <span class="rm" onclick="this.closest('.sk-tag').remove()"><i class="fas fa-times"></i></span>`;
  con.appendChild(tag);
  inp.value = ""; inp.focus();
}

function getTags(containerId) {
  const con = document.getElementById(containerId);
  if (!con) return [];
  return Array.from(con.querySelectorAll(".sk-tag"))
    .map(t => t.childNodes[0].textContent.trim());
}

/* ═══════════════════════════════════════
   AVATAR PREVIEW
═══════════════════════════════════════ */
function previewAvatar(input, previewId) {
  if (!input.files?.[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    const el = document.getElementById(previewId);
    if (el) el.innerHTML = `<img src="${e.target.result}" alt="avatar">`;
  };
  reader.readAsDataURL(input.files[0]);
}

/* ═══════════════════════════════════════
   HELPERS
═══════════════════════════════════════ */
function set(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = (val !== undefined && val !== null && val !== "") ? val : "—";
}

function initials(name = "") {
  return name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

function goToRegister() {
  if (window.selectedRole === "employee") showPage("page-register-employee");
  else showPage("page-register-student");
}

async function loadJobs() {
  const res = await fetch(`${API}/jobs`);
  return await res.json();
}

async function applyJob(jobId) {
  await fetch(`${API}/apply`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      email: window.currentUser.email,
      job_id: jobId
    })
  });
  toast("Applied successfully 🚀");
}

async function postJob() {
  const title = document.getElementById("job-title").value;
  const company = document.getElementById("job-company").value;
  const skills = document.getElementById("job-skills").value.split(",");
  const link = document.getElementById("job-link").value;

  await fetch(`${API}/post-job`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      title,
      company,
      skills,
      link,
      email: window.currentUser.email
    })
  });

  toast("Job posted!");
}

async function loadNotifications() {
  const res = await fetch(`${API}/notifications`);
  const data = await res.json();

  const el = document.getElementById("notif-box");
  if (!el) return;

  el.innerHTML = data.map(n => `
    <div style="padding:6px;border-bottom:1px solid #eee">${n.msg}</div>
  `).join("");
}

/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  loadNotifications();
  // Sticky landing nav
  const nav = document.getElementById("lnav");
  if (nav) {
    window.addEventListener("scroll", () => {
      nav.classList.toggle("scrolled", window.scrollY > 40);
    });
  }

  // Close modals on overlay click
  document.querySelectorAll(".modal-overlay").forEach(o => {
    o.addEventListener("click", e => {
      if (e.target === o) o.classList.remove("open");
    });
  });

  // Auto-login if session exists
  tryAutoLogin();
});
