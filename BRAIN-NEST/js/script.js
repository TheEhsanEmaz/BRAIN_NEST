const courseListEl = document.getElementById("courseList");
const searchInputEl = document.getElementById("courseSearch");
let allCourses = [];

if (courseListEl) loadCourses();

async function loadCourses() {
  try {
    const res = await fetch("js/courses.json");
    allCourses = await res.json();
    renderCourseCatalog();
  } catch {
    allCourses = typeof courses !== "undefined" ? courses : [];
    renderCourseCatalog();
  }
}

if (searchInputEl) {
  searchInputEl.addEventListener("input", () => {
    renderCourseCatalog(searchInputEl.value.trim().toLowerCase());
  });
}

function renderCourseCatalog(searchTerm = "") {
  const registeredIds = getRegisteredCourseIds();
  const filtered = allCourses.filter(c =>
    !searchTerm || c.name.toLowerCase().includes(searchTerm) || c.id.toLowerCase().includes(searchTerm)
  );

  courseListEl.innerHTML = "";

  if (filtered.length === 0) {
    courseListEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No courses found</h3>
        <p>Try a different search term.</p>
      </div>`;
    return;
  }

  filtered.forEach((course, i) => {
    const isRegistered = registeredIds.includes(course.id);
    const card = document.createElement("div");
    card.className = "course-card" + (isRegistered ? " registered" : "");
    card.style.animationDelay = (i * 0.06) + "s";
    card.innerHTML = `
      <div class="card-top">
        <span class="course-code">${course.id}</span>
        <span class="credit-badge">${course.credits} credits</span>
      </div>
      <h3>${course.name}</h3>
      <div class="card-meta">
        <div class="meta-row"><span class="meta-icon">👤</span>${course.instructor}</div>
        <div class="meta-row"><span class="meta-icon">🕐</span>${course.schedule}</div>
        <div class="meta-row"><span class="meta-icon">💺</span>${course.seats} seats available</div>
      </div>
      <button
        data-id="${course.id}"
        class="register-btn ${isRegistered ? "btn-success" : "btn-primary"}"
        ${isRegistered ? "disabled" : ""}>
        ${isRegistered ? "✓ Registered" : "Register"}
      </button>`;
    courseListEl.appendChild(card);
  });

  document.querySelectorAll(".register-btn:not(:disabled)").forEach(btn => {
    btn.addEventListener("click", handleRegisterClick);
  });
}

function handleRegisterClick(e) {
  const loggedIn = localStorage.getItem("loggedInStudent");

  if (!loggedIn) {
    showLoginPrompt();
    return;
  }

  const courseId = e.target.getAttribute("data-id");
  const result = registerCourse(courseId);
  showStatusMessage(result.message, result.success);
  renderCourseCatalog(searchInputEl ? searchInputEl.value.trim().toLowerCase() : "");
}

function showLoginPrompt() {
  const existing = document.getElementById("loginPrompt");
  if (existing) return;

  const overlay = document.createElement("div");
  overlay.id = "loginPrompt";
  overlay.innerHTML = `
    <div class="lp-box">
      <div class="lp-icon">🔐</div>
      <h3>Login required</h3>
      <p>You need to be signed in to register for courses.</p>
      <div class="lp-actions">
        <a href="login.html" class="lp-btn-primary">Go to login</a>
        <button class="lp-btn-ghost" id="lp-close">Maybe later</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("lp-close").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

function showStatusMessage(message, success) {
  const existing = document.querySelector(".status-message");
  if (existing) existing.remove();
  const el = document.createElement("div");
  el.className = "status-message " + (success ? "status-success" : "status-error");
  el.textContent = message;
  courseListEl.parentElement.insertBefore(el, courseListEl);
  setTimeout(() => el.remove(), 3000);
}