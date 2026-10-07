const courseListEl = document.getElementById("courseList");
const searchInputEl = document.getElementById("courseSearch");
let allCourses = [];
let registeredIds = [];

if (courseListEl) loadCourses();

async function loadCourses() {
  courseListEl.innerHTML = '<div class="empty-state"><p>Loading courses…</p></div>';
  try {
    const result = await Api.request("/api/courses");
    allCourses = result.courses;
    try {
      registeredIds = (await getRegisteredCourses()).map((course) => course.id);
    } catch (error) {
      if (error.status !== 401) throw error;
      registeredIds = [];
    }
    renderCourseCatalog();
  } catch (error) {
    courseListEl.innerHTML = "";
    const message = document.createElement("p");
    message.className = "status-message status-error";
    message.textContent = `Could not load courses: ${error.message}`;
    courseListEl.appendChild(message);
  }
}

if (searchInputEl) {
  searchInputEl.addEventListener("input", () => {
    renderCourseCatalog(searchInputEl.value.trim().toLowerCase());
  });
}

function renderCourseCatalog(searchTerm = "") {
  if (!courseListEl) return;
  const filtered = allCourses.filter((course) =>
    !searchTerm || course.name.toLowerCase().includes(searchTerm) || course.id.toLowerCase().includes(searchTerm)
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

  filtered.forEach((course, index) => {
    const isRegistered = registeredIds.includes(course.id);
    const card = document.createElement("div");
    card.className = "course-card" + (isRegistered ? " registered" : "");
    card.style.animationDelay = `${index * 0.06}s`;
    card.innerHTML = `
      <div class="card-top">
        <span class="course-code"></span>
        <span class="credit-badge"><span class="course-credits"></span> credits</span>
      </div>
      <h3 class="course-name"></h3>
      <div class="card-meta">
        <div class="meta-row"><span class="meta-icon">👤</span><span class="course-instructor"></span></div>
        <div class="meta-row"><span class="meta-icon">🕐</span><span class="course-schedule"></span></div>
        <div class="meta-row"><span class="meta-icon">💺</span><span class="course-seats"></span></div>
      </div>
      <button class="register-btn"></button>`;
    card.querySelector(".course-code").textContent = course.id;
    card.querySelector(".course-credits").textContent = course.credits;
    card.querySelector(".course-name").textContent = course.name;
    card.querySelector(".course-instructor").textContent = course.instructor;
    card.querySelector(".course-schedule").textContent = course.schedule;
    card.querySelector(".course-seats").textContent = `${course.seats} seats available`;

    const button = card.querySelector(".register-btn");
    button.dataset.id = course.id;
    button.classList.add(isRegistered ? "btn-success" : "btn-primary");
    button.disabled = isRegistered || course.seats === 0;
    button.textContent = isRegistered ? "✓ Registered" : course.seats === 0 ? "Full" : "Register";
    if (!button.disabled) button.addEventListener("click", handleRegisterClick);
    courseListEl.appendChild(card);
  });
}

async function handleRegisterClick(event) {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    await registerCourse(button.dataset.id);
    registeredIds.push(button.dataset.id);
    showStatusMessage("Course registered successfully!", true);
    await loadCourses();
  } catch (error) {
    if (error.status === 401) showLoginPrompt();
    else showStatusMessage(error.message, false);
    button.disabled = false;
  }
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
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });
}

function showStatusMessage(message, success) {
  const existing = document.querySelector(".status-message");
  if (existing) existing.remove();
  const element = document.createElement("div");
  element.className = `status-message ${success ? "status-success" : "status-error"}`;
  element.textContent = message;
  courseListEl.parentElement.insertBefore(element, courseListEl);
  setTimeout(() => {
    if (element.isConnected) element.remove();
  }, 3000);
}
