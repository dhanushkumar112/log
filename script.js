// ------ DYNAMIC COLOR & SHAPE BACKGROUND LOGIC ------
function randomFromArr(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffleArr(arr) {
  let a = arr.slice(),
    n = a.length;
  for (let i = n - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

const allPrimary = ["#a8b3c5", "#b0bbc6", "#a4abb4", "#9fa7b0", "#a2a9b3", "#a8afbb", "#9da3ad", "#afb3bc"];
const allSecondary = ["#f1f5f9", "#f5f7fa", "#f9fafc", "#eff2f7", "#f3f4f6", "#e9ecef", "#f8f9fa", "#f2f4f8"];
const bgShapes = [
  '<svg width="80" height="80"><circle cx="40" cy="40" r="38" fill="{c}" /></svg>',
  '<svg width="80" height="80"><rect x="8" y="8" width="64" height="64" rx="18" fill="{c}" /></svg>',
  '<svg width="80" height="80"><polygon points="40,8 72,72 8,72" fill="{c}" /></svg>',
  '<svg width="80" height="80"><ellipse cx="40" cy="48" rx="30" ry="20" fill="{c}" /></svg>',
  '<svg width="80" height="80"><line x1="12" y1="68" x2="68" y2="12" stroke="{c}" stroke-width="10" stroke-linecap="round"/></svg>',
  '<svg width="80" height="80"><path d="M40 8Q60 26 40 72Q20 26 40 8Z" fill="{c}" /></svg>',
  '<svg width="80" height="80"><polygon points="40,10 70,40 40,70 10,40" fill="{c}" /></svg>'
];
const shapeEmojis = ["🔵", "🔶", "🟩", "🟣", "🟦", "🟧", "🟡", "🟫", "🔺", "⬛", "⬜"];

function applyRandomTheme() {
  const p = randomFromArr(allPrimary).trim();
  const s = randomFromArr(allSecondary).trim();
  const bgh = randomFromArr(allSecondary).trim();
  document.documentElement.style.setProperty("--primary-color", p);
  document.documentElement.style.setProperty("--secondary-color", s);
  document.documentElement.style.setProperty("--minimal-bg", bgh);
}

function drawRandomBGShapes() {
  const num = window.innerWidth < 600 ? 2 : 5;
  const bg = document.getElementById("bg-shapes");
  bg.innerHTML = "";
  for (let i = 0; i < num; ++i) {
    const color = randomFromArr(allPrimary).trim();
    const svg = randomFromArr(bgShapes).replace("{c}", color);
    const div = document.createElement("div");
    div.className = "bg-shape";
    div.style.left = `${randomInt(3, 90)}vw`;
    div.style.top = `${randomInt(4, 80)}vh`;
    div.style.transform = `rotate(${randomInt(0, 360)}deg) scale(${Math.random() * 0.5 + 0.7})`;
    div.innerHTML = svg;
    bg.appendChild(div);
  }
}

applyRandomTheme();
drawRandomBGShapes();
window.addEventListener("resize", drawRandomBGShapes);

// ------ Flashcard Size Toggle ------
let flashcardSize = "medium";
function setFlashcardSize(size) {
  flashcardSize = size;
  loadFlashcards();
}

// ----- DIARY FEATURE - Section Cards, Calendar Modal, Share, Import Files -----
function getDiaryData() {
  let users = JSON.parse(localStorage.getItem("users"));
  return users && users[currentUser] && users[currentUser].diary ? users[currentUser].diary : {};
}
function saveDiaryData(diary) {
  let users = JSON.parse(localStorage.getItem("users"));
  users[currentUser].diary = diary;
  localStorage.setItem("users", JSON.stringify(users));
  debounceGistSync(currentUser, users[currentUser]);
}
function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function getDayName(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { weekday: "long" });
}
function getPrettyDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

// Diary section: render all diary entries as cards/sections
function renderDiaryEntriesSection() {
  const diary = getDiaryData();
  const entriesSection = document.getElementById("diaryEntriesSection");
  entriesSection.innerHTML = "";
  // Sort diary dates descending
  const dates = Object.keys(diary).sort((a, b) => b.localeCompare(a));
  if (dates.length === 0) {
    entriesSection.innerHTML = `<div class="diary-entry-section" style="text-align:center;opacity:0.8;">No diary entries yet. Use the calendar to add one!</div>`;
    return;
  }
  for (const dateStr of dates) {
    const entry = diary[dateStr] || {};
    const content = entry.text || "";
    const files = (entry.files || []);
    // Diary entry card
    const el = document.createElement("div");
    el.className = "diary-entry-section";
    el.innerHTML = `
      <div class="diary-entry-date">${getPrettyDate(dateStr)}</div>
      <div class="diary-entry-content" style="white-space:pre-line;">${content || "<i style='color:#94a3b8;'>No notes for this day</i>"}</div>
      <div class="diary-entry-files">
        ${files.map(f =>
          f.type === "pdf"
          ? `<iframe src="${f.data}" title="PDF"></iframe>`
          : `<div class="file-text-box" style="background:#f1f5f9;border-radius:6px;padding:0.6rem 0.8rem 0.4rem 0.8rem;font-size:0.97rem;margin-bottom:0.4rem;"><b>${f.name}</b><br>${(f.data || "").slice(0, 1000)}</div>`
        ).join("")}
      </div>
      <div class="diary-entry-actions">
        <button class="btn btn-primary" onclick="editDiaryEntry('${dateStr}')">Edit</button>
        <button class="btn" onclick="shareDiaryEntry('${dateStr}')">Share</button>
        <button class="import-btn" onclick="importDiaryFile('${dateStr}')">📂 Import File</button>
      </div>
    `;
    entriesSection.appendChild(el);
  }
}

// Modal calendar for diary date navigation
function openCalendarModal() {
  document.getElementById("calendarModal").style.display = "flex";
  document.getElementById("diaryDatePicker").value = todayISO();
}
function closeCalendarModal() {
  document.getElementById("calendarModal").style.display = "none";
}
function jumpToDiaryDate() {
  const date = document.getElementById("diaryDatePicker").value;
  closeCalendarModal();
  editDiaryEntry(date, true);
}

// Edit diary entry for a date (in modal)
function editDiaryEntry(dateStr, forcedNew = false) {
  const diary = getDiaryData();
  let entry = diary[dateStr] || { text: "", files: [] };
  let modal = document.createElement("div");
  modal.className = "flashcard-note-modal-bg";
  modal.onclick = (e) => { if (e.target === modal) document.body.removeChild(modal); };
  modal.innerHTML = `
    <div class="flashcard-note-modal" onclick="event.stopPropagation();">
      <button class="close-modal" onclick="document.body.removeChild(this.parentNode.parentNode)">×</button>
      <div style="font-weight:700;font-size:1.09rem;margin-bottom:0.4em;">
        Diary for ${getPrettyDate(dateStr)}
      </div>
      <textarea id="diaryEditTextarea" placeholder="Write your notes for this day...">${forcedNew ? "" : entry.text || ""}</textarea>
      <div class="modal-actions">
        <button class="btn btn-primary" onclick="saveDiaryEdit('${dateStr}', this)">Save</button>
      </div>
      <div style="margin-top:0.7rem;color:#64748b;font-size:0.97rem">To add files, save first then use 'Import File'.</div>
    </div>`;
  document.body.appendChild(modal);
}
function saveDiaryEdit(dateStr, btn) {
  const diary = getDiaryData();
  const text = document.getElementById("diaryEditTextarea").value;
  diary[dateStr] = diary[dateStr] || { files: [] };
  diary[dateStr].text = text;
  saveDiaryData(diary);
  document.body.removeChild(btn.closest(".flashcard-note-modal-bg"));
  renderDiaryEntriesSection();
}
function shareDiaryEntry(dateStr) {
  const diary = getDiaryData();
  const entry = diary[dateStr] || { text: "", files: [] };
  let shareText = `Diary for ${getPrettyDate(dateStr)}:\n\n${entry.text || ""}`;
  if (entry.files) {
    shareText += "\n\nFiles:\n" + entry.files.map(f => f.name).join(", ");
  }
  navigator.clipboard.writeText(shareText);
  alert("Diary entry copied to clipboard. You can now paste it anywhere.");
}

// Attach file to diary entry
function importDiaryFile(dateStr) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".txt,application/pdf";
  input.onchange = function (e) {
    const file = e.target.files[0];
    if (!file) return;
    let diary = getDiaryData();
    diary[dateStr] = diary[dateStr] || { text: "", files: [] };
    if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = function (ev) {
        diary[dateStr].files.push({ name: file.name, type: "pdf", data: ev.target.result });
        saveDiaryData(diary);
        renderDiaryEntriesSection();
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = function (ev) {
        diary[dateStr].files.push({ name: file.name, type: "text", data: ev.target.result });
        saveDiaryData(diary);
        renderDiaryEntriesSection();
      };
      reader.readAsText(file);
    }
  };
  input.click();
}

// --- Patch: Overwrite the old diary rendering to new cards layout ---
function openDiary() {
  document.getElementById("auth-section").style.display = "none";
  document.getElementById("main").style.display = "none";
  document.getElementById("subject-view").style.display = "none";
  document.getElementById("account-settings").style.display = "none";
  document.getElementById("change-password").style.display = "none";
  document.getElementById("diary-section").style.display = "block";
  renderDiaryEntriesSection();
}
// --- End Diary Section as Cards ---

// ----- Flashcard/Subject Logic (unchanged except section card look) -----
let isSignup = false;
let currentUser = null;
let currentSubject = null;
const subjectColors = allSecondary.map((x) => x.trim());
const flashcardColors = allPrimary.map((x) => x.trim());

const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");
let menuShowing = false;
function updateMenuVisibility() {
  if (currentUser) {
    menuBtn.style.display = "flex";
  } else {
    menuBtn.style.display = "none";
    menu.classList.remove("show");
    menuShowing = false;
  }
}
menuBtn.addEventListener("click", (e) => {
  menuShowing = !menuShowing;
  menuShowing ? menu.classList.add("show") : menu.classList.remove("show");
});
document.addEventListener("click", (e) => {
  if (!menu.contains(e.target) && e.target !== menuBtn) {
    menu.classList.remove("show");
    menuShowing = false;
  }
});
function toggleAuth() {
  isSignup = !isSignup;
  document.getElementById("auth-button").innerText = isSignup ? "Sign Up" : "Sign In";
  document.getElementById("authTitle").innerText = isSignup ? "Sign Up" : "Sign In";
  document.getElementById("authToggleText").innerHTML = isSignup
    ? 'Already have an account? <b>Sign In</b>'
    : "Don't have an account? <b>Sign Up</b>";
}
async function handleAuth() {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  if (!user || !pass) {
    alert("Please enter both username and password");
    return;
  }
  let users = JSON.parse(localStorage.getItem("users") || "{}");
  if (isSignup) {
    if (users[user]) {
      alert("User already exists!");
    } else {
      users[user] = { password: pass, data: {}, profile: { name: "", phone: "", address: "" }, diary: {} };
      localStorage.setItem("users", JSON.stringify(users));
      await saveUserToGist(user, users[user]);
      alert("Signup successful! Please sign in.");
      toggleAuth();
    }
  } else {
    let remote = await loadUserFromGist(user);
    if (remote) {
      users[user] = remote;
      localStorage.setItem("users", JSON.stringify(users));
    }
    if (users[user] && users[user].password === pass) {
      currentUser = user;
      document.getElementById("auth-section").style.display = "none";
      document.getElementById("main").style.display = "block";
      updateMenuVisibility();
      updateUserBar();
      loadSubjects();
      loadProfileData();
      document.getElementById("diaryBtn").style.display = "flex";
      document.getElementById("siteTitle").innerText = "Log";
    } else {
      alert("Incorrect credentials.");
    }
  }
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
}
function getUserData() {
  let users = JSON.parse(localStorage.getItem("users"));
  return users && users[currentUser] && users[currentUser].data ? users[currentUser].data : {};
}
function getUserProfile() {
  let users = JSON.parse(localStorage.getItem("users"));
  return users && users[currentUser] && users[currentUser].profile ? users[currentUser].profile : { name: "", phone: "", address: "" };
}
function saveUserData(data) {
  let users = JSON.parse(localStorage.getItem("users"));
  users[currentUser].data = data;
  localStorage.setItem("users", JSON.stringify(users));
  debounceGistSync(currentUser, users[currentUser]);
}
function saveUserProfile(profile) {
  let users = JSON.parse(localStorage.getItem("users"));
  users[currentUser].profile = profile;
  localStorage.setItem("users", JSON.stringify(users));
  debounceGistSync(currentUser, users[currentUser]);
}
function loadProfileData() {
  document.getElementById("userUsername").value = currentUser || "";
  const profile = getUserProfile();
  document.getElementById("userName").value = profile.name || "";
  document.getElementById("userPhone").value = profile.phone || "";
  document.getElementById("userAddress").value = profile.address || "";
}
function updateUserBar() {
  const bar = document.getElementById("userInfoBar");
  if (!currentUser) {
    bar.style.display = "none";
    return;
  }
  const profile = getUserProfile();
  bar.innerHTML = `<span><b>Username:</b> ${currentUser}</span>` + (profile.name ? `<span><b>Name:</b> ${profile.name}</span>` : "");
  bar.style.display = "";
}
function addSubject() {
  let name = prompt("Subject Name:");
  if (name) {
    let data = getUserData();
    if (data[name]) {
      alert("Subject already exists!");
      return;
    }
    const color = randomFromArr(subjectColors);
    data[name] = { flashcards: [], color };
    saveUserData(data);
    loadSubjects();
  }
}
function loadSubjects() {
  const container = document.getElementById("subjectContainer");
  container.innerHTML = "";
  const data = getUserData();
  if (Object.keys(data).length === 0) {
    container.innerHTML =
      '<p style="opacity:0.8;color:#64748b;margin-left:0.6rem;">No subjects found. Add your first subject!</p>';
    return;
  }
  Object.keys(data).forEach((subject, i) => {
    const div = document.createElement("div");
    div.className = "subject";
    div.style.backgroundColor = data[subject].color;
    const emoji = shapeEmojis[i % shapeEmojis.length];
    div.innerHTML = `<span>${subject}</span>
          <div class="tools">
            <button class="tool-btn" onclick="event.stopPropagation(); renameSubject('${subject}')">✏️</button>
            <button class="tool-btn" onclick="event.stopPropagation(); deleteSubject('${subject}')">🗑️</button>
          </div>
          <span class="geo-shape">${emoji}</span>`;
    div.onclick = () => openSubject(subject);
    container.appendChild(div);
  });
}
function renameSubject(name) {
  let newName = prompt("New name:", name);
  if (newName && newName !== name) {
    let data = getUserData();
    data[newName] = data[name];
    delete data[name];
    saveUserData(data);
    loadSubjects();
  }
}
function deleteSubject(name) {
  if (confirm(`Are you sure you want to delete "${name}" and all its flashcards?`)) {
    let data = getUserData();
    delete data[name];
    saveUserData(data);
    loadSubjects();
  }
}
function openSubject(name) {
  currentSubject = name;
  document.getElementById("main").style.display = "none";
  document.getElementById("subject-view").style.display = "block";
  document.getElementById("subjectTitle").innerText = name;
  loadFlashcards();
}
function backToMain() {
  document.getElementById("subject-view").style.display = "none";
  document.getElementById("main").style.display = "block";
  currentSubject = null;
  updateUserBar();
}
function addFlashcard() {
  let content = prompt("Enter flashcard content:");
  if (content) {
    let data = getUserData();
    const color = randomFromArr(flashcardColors);
    data[currentSubject].flashcards.push({ content, color, note: "", type: "text" });
    saveUserData(data);
    loadFlashcards();
  }
}
function loadFlashcards() {
  const container = document.getElementById("flashcardContainer");
  container.innerHTML = "";
  let data = getUserData();
  const flashcards = data[currentSubject].flashcards;
  if (flashcards.length === 0) {
    container.innerHTML =
      '<p style="opacity:0.8;color:#64748b;margin-left:0.6rem;">No flashcards found. Add your first flashcard!</p>';
    return;
  }
  flashcards.forEach((fc, idx) => {
    const shapeHtml = `<span class="geo-shape">${randomFromArr(shapeEmojis)}</span>`;
    const div = document.createElement("div");
    div.className = "flashcard " + flashcardSize;
    div.style.backgroundColor = fc.color;
    let contentHtml = "";
    if (fc.type === "pdf") {
      contentHtml = `<iframe src="${fc.content}" style="width:100%; height:200px;" frameborder="0"></iframe>`;
    } else {
      contentHtml = `<span>${fc.content.replace(/\n/g, "<br>")}</span>`;
    }
    div.innerHTML = contentHtml + `
          <div class="tools">
            <button class="note-btn" title="Flashcard Note" onclick="event.stopPropagation(); openFlashcardNote(${idx})">📝</button>
            <button class="import-btn" title="Import file" onclick="event.stopPropagation(); importFileToFlashcard(${idx})">📂</button>
            <button class="export-btn" title="Export flashcard" onclick="event.stopPropagation(); exportFlashcard(${idx})">⬇️</button>
            <button class="tool-btn" onclick="event.stopPropagation(); editFlashcard(${idx})">✏️</button>
            <button class="tool-btn" onclick="event.stopPropagation(); deleteFlashcard(${idx})">🗑️</button>
          </div>
          ${shapeHtml}`;
    container.appendChild(div);
  });
}
function importFileToFlashcard(idx) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".txt,application/pdf";
  input.onchange = async function (e) {
    const file = e.target.files[0];
    if (!file) return;
    let data = getUserData();
    if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = function (ev) {
        data[currentSubject].flashcards[idx] = {
          content: ev.target.result,
          color: data[currentSubject].flashcards[idx].color,
          note: data[currentSubject].flashcards[idx].note || "",
          type: "pdf",
        };
        saveUserData(data);
        loadFlashcards();
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = function (ev) {
        data[currentSubject].flashcards[idx] = {
          content: ev.target.result,
          color: data[currentSubject].flashcards[idx].color,
          note: data[currentSubject].flashcards[idx].note || "",
          type: "text",
        };
        saveUserData(data);
        loadFlashcards();
      };
      reader.readAsText(file);
    }
  };
  input.click();
}
function exportFlashcard(idx) {
  let data = getUserData();
  let fc = data[currentSubject].flashcards[idx];
  let contentToExport = fc.content;
  if (fc.type === "pdf") {
    alert("Exporting PDFs is not supported. Please use the text editor to copy contents.");
    return;
  }
  const blob = new Blob([contentToExport], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `flashcard-${idx + 1}.txt`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
function openFlashcardNote(idx) {
  let data = getUserData();
  let fc = data[currentSubject].flashcards[idx];
  let modalBg = document.getElementById("flashcardNoteModalBg");
  modalBg.innerHTML = `
      <div class="flashcard-note-modal-bg" onclick="closeFlashcardNoteModal(event)">
        <div class="flashcard-note-modal" onclick="event.stopPropagation();">
          <button class="close-modal" onclick="closeFlashcardNoteModal(event)">×</button>
          <div style="font-weight:700;font-size:1.09rem;margin-bottom:0.4em;">Note for this flashcard</div>
          <textarea id="flashcardNoteTextarea" placeholder="Write notes for this flashcard...">${fc.note || ""}</textarea>
          <div class="modal-actions">
            <button class="btn btn-primary" onclick="saveFlashcardNote(${idx})">Save</button>
          </div>
        </div>
      </div>
      `;
  modalBg.style.display = "block";
}
function closeFlashcardNoteModal(e) {
  if (e) e.stopPropagation();
  let modalBg = document.getElementById("flashcardNoteModalBg");
  modalBg.innerHTML = "";
  modalBg.style.display = "none";
}
function saveFlashcardNote(idx) {
  let data = getUserData();
  let fc = data[currentSubject].flashcards[idx];
  fc.note = document.getElementById("flashcardNoteTextarea").value;
  saveUserData(data);
  closeFlashcardNoteModal();
  alert("Note saved!");
}
function editFlashcard(idx) {
  let data = getUserData();
  let fc = data[currentSubject].flashcards[idx];
  let newContent = prompt("Edit flashcard content:", fc.content);
  if (newContent) {
    fc.content = newContent;
    fc.type = "text";
    saveUserData(data);
    loadFlashcards();
  }
}
function deleteFlashcard(idx) {
  if (confirm("Are you sure you want to delete this flashcard?")) {
    let data = getUserData();
    data[currentSubject].flashcards.splice(idx, 1);
    saveUserData(data);
    loadFlashcards();
  }
}
function shuffleFlashcards() {
  let data = getUserData();
  let arr = data[currentSubject].flashcards;
  data[currentSubject].flashcards = shuffleArr(arr);
  saveUserData(data);
  loadFlashcards();
}
function filterSubjects() {
  const value = document.getElementById("searchInput").value.toLowerCase();
  const container = document.getElementById("subjectContainer");
  Array.from(container.children).forEach((child) => {
    child.innerText.toLowerCase().includes(value)
      ? (child.style.display = "")
      : (child.style.display = "none");
  });
}
function showAccountSettings() {
  document.getElementById("main").style.display = "none";
  document.getElementById("subject-view").style.display = "none";
  document.getElementById("account-settings").style.display = "block";
  document.getElementById("change-password").style.display = "none";
  menu.classList.remove("show");
  menuShowing = false;
  loadProfileData();
}
function showChangePassword() {
  document.getElementById("main").style.display = "none";
  document.getElementById("subject-view").style.display = "none";
  document.getElementById("account-settings").style.display = "none";
  document.getElementById("change-password").style.display = "block";
  menu.classList.remove("show");
  menuShowing = false;
}
function backToMainFromSettings() {
  document.getElementById("account-settings").style.display = "none";
  document.getElementById("change-password").style.display = "none";
  document.getElementById("main").style.display = "block";
  updateUserBar();
}
function saveAccountSettings() {
  const profile = {
    name: document.getElementById("userName").value,
    phone: document.getElementById("userPhone").value,
    address: document.getElementById("userAddress").value,
  };
  saveUserProfile(profile);
  updateUserBar();
  alert("Profile updated!");
  backToMainFromSettings();
}
function changePassword() {
  const current = document.getElementById("currentPassword").value;
  const newPass = document.getElementById("newPassword").value;
  const confirm = document.getElementById("confirmPassword").value;
  let users = JSON.parse(localStorage.getItem("users"));
  if (users[currentUser].password !== current) {
    alert("Current password is incorrect.");
    return;
  }
  if (newPass !== confirm) {
    alert("New passwords do not match.");
    return;
  }
  users[currentUser].password = newPass;
  localStorage.setItem("users", JSON.stringify(users));
  debounceGistSync(currentUser, users[currentUser]);
  alert("Password changed successfully!");
  backToMainFromSettings();
}
function logout() {
  currentUser = null;
  document.getElementById("main").style.display = "none";
  document.getElementById("subject-view").style.display = "none";
  document.getElementById("account-settings").style.display = "none";
  document.getElementById("change-password").style.display = "none";
  document.getElementById("auth-section").style.display = "block";
  document.getElementById("diary-section").style.display = "none";
  document.getElementById("diaryBtn").style.display = "none";
  document.getElementById("siteTitle").innerText = "📚 Flashcard Hub";
  updateMenuVisibility();
}
document.addEventListener("DOMContentLoaded", () => {
  let users = JSON.parse(localStorage.getItem("users") || "{}");
  if (currentUser && users[currentUser]) {
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("main").style.display = "block";
    updateMenuVisibility();
    updateUserBar();
    loadSubjects();
    loadProfileData();
  } else {
    updateMenuVisibility();
  }
});

// --- Calendar Modal close on outside click
window.addEventListener("click", function(e) {
  const modal = document.getElementById("calendarModal");
  if (modal && modal.style.display === "flex" && !modal.contains(e.target) && e.target.className !== "calendar-btn") {
    modal.style.display = "none";
  }
});