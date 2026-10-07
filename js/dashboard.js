const registeredListEl = document.getElementById("registeredList");
const summaryBarEl = document.getElementById("summaryBar");
const sidebarStatsEl = document.getElementById("sidebarStats");

if (registeredListEl) loadDashboard();

async function loadDashboard() {
  registeredListEl.innerHTML = '<div class="empty-state"><p>Loading your courses…</p></div>';
  try {
    const result = await Api.request("/api/registrations");
    renderDashboard(result.courses, result.creditsEnrolled, result.maxCredits);
  } catch (error) {
    if (error.status === 401) {
      window.location.href = "login.html";
      return;
    }
    registeredListEl.innerHTML = "";
    const message = document.createElement("p");
    message.className = "status-message status-error";
    message.textContent = `Could not load your dashboard: ${error.message}`;
    registeredListEl.appendChild(message);
  }
}

function renderDashboard(registered, totalCredits, maxCredits) {
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
        <div class="s-value">${Math.max(0, maxCredits - totalCredits)}</div>
      </div>`;
  }

  if (sidebarStatsEl) {
    sidebarStatsEl.innerHTML = `
      <div class="sidebar-stat"><span class="s-key">Courses enrolled</span><span class="s-val">${registered.length}</span></div>
      <div class="sidebar-stat"><span class="s-key">Credit hours</span><span class="s-val">${totalCredits}</span></div>
      <div class="sidebar-stat"><span class="s-key">Max credits</span><span class="s-val">${maxCredits}</span></div>
      <div class="sidebar-stat"><span class="s-key">Credits remaining</span><span class="s-val">${Math.max(0, maxCredits - totalCredits)}</span></div>`;
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

  registered.forEach((course, index) => {
    const card = document.createElement("div");
    card.className = "reg-card";
    card.style.animationDelay = `${index * 0.07}s`;
    card.innerHTML = `
      <div class="reg-card-icon"></div>
      <div class="reg-card-info">
        <h3></h3>
        <p><span class="reg-instructor"></span> &nbsp;·&nbsp; <span class="reg-schedule"></span></p>
      </div>
      <div class="reg-card-credits"><span class="reg-credits"></span> cr</div>
      <button class="drop-btn btn-danger"></button>`;
    card.querySelector(".reg-card-icon").textContent = course.id.slice(0, 3);
    card.querySelector("h3").textContent = course.name;
    card.querySelector(".reg-instructor").textContent = course.instructor;
    card.querySelector(".reg-schedule").textContent = course.schedule;
    card.querySelector(".reg-credits").textContent = course.credits;

    const button = card.querySelector(".drop-btn");
    button.dataset.id = course.id;
    button.textContent = "Drop";
    button.addEventListener("click", async () => {
      if (!confirm("Drop this course?")) return;
      button.disabled = true;
      try {
        await dropCourse(course.id);
        await loadDashboard();
      } catch (error) {
        button.disabled = false;
        showDashboardMessage(error.message);
      }
    });
    registeredListEl.appendChild(card);
  });
}

function showDashboardMessage(message) {
  const element = document.createElement("p");
  element.className = "status-message status-error";
  element.textContent = message;
  registeredListEl.parentElement.insertBefore(element, registeredListEl);
  setTimeout(() => {
    if (element.isConnected) element.remove();
  }, 4000);
}
