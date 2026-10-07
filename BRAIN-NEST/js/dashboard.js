// Redirect to login if not logged in
if (!localStorage.getItem("loggedInStudent")) {
  window.location.href = "login.html";
}

const registeredListEl = document.getElementById("registeredList");
const summaryBarEl = document.getElementById("summaryBar");
const sidebarStatsEl = document.getElementById("sidebarStats");

if (registeredListEl) loadDashboard();

async function loadDashboard() {
  let allCourses = [];
  try {
    const res = await fetch("js/courses.json");
    allCourses = await res.json();
  } catch {
    allCourses = typeof courses !== "undefined" ? courses : [];
  }
  renderDashboard(allCourses);
}

function renderDashboard(allCourses) {
  const registeredIds = getRegisteredCourseIds();
  const registered = allCourses.filter(c => registeredIds.includes(c.id));
  const totalCredits = registered.reduce((s, c) => s + c.credits, 0);

  if (summaryBarEl) {
    summaryBarEl.innerHTML = `
      <div class="summary-card">
        <div class="s-label">Registered courses</div>
        <div class="s-value purple">${registered.length}</div>
      </div>
      <div class="summary-card">
        <div class="s-label">Total credits</div>
        <div class="s-value green">${totalCredits}</div>
      </div>
      <div class="summary-card">
        <div class="s-label">Remaining capacity</div>
        <div class="s-value">${Math.max(0, 18 - totalCredits)}</div>
      </div>`;
  }

  if (sidebarStatsEl) {
    sidebarStatsEl.innerHTML = `
      <div class="sidebar-stat"><span class="s-key">Courses enrolled</span><span class="s-val">${registered.length}</span></div>
      <div class="sidebar-stat"><span class="s-key">Credit hours</span><span class="s-val">${totalCredits}</span></div>
      <div class="sidebar-stat"><span class="s-key">Max credits</span><span class="s-val">18</span></div>
      <div class="sidebar-stat"><span class="s-key">Credits remaining</span><span class="s-val">${Math.max(0, 18 - totalCredits)}</span></div>`;
  }

  registeredListEl.innerHTML = "";

  if (registered.length === 0) {
    registeredListEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>No courses yet</h3>
        <p>Head over to the <a href="courses.html">courses page</a> to register for your first class.</p>
      </div>`;
    return;
  }

  registered.forEach((course, i) => {
    const card = document.createElement("div");
    card.className = "reg-card";
    card.style.animationDelay = (i * 0.07) + "s";
    card.innerHTML = `
      <div class="reg-card-icon">${course.id.slice(0,3)}</div>
      <div class="reg-card-info">
        <h3>${course.name}</h3>
        <p>${course.instructor} &nbsp;·&nbsp; ${course.schedule}</p>
      </div>
      <div class="reg-card-credits">${course.credits} cr</div>
      <button data-id="${course.id}" class="drop-btn btn-danger">Drop</button>`;
    registeredListEl.appendChild(card);
  });

  document.querySelectorAll(".drop-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      if (confirm("Drop this course?")) {
        dropCourse(e.target.getAttribute("data-id"));
        renderDashboard(allCourses);
      }
    });
  });
}