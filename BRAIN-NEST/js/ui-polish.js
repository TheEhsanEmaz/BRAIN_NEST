document.addEventListener("DOMContentLoaded", () => {
  const studentId = localStorage.getItem("loggedInStudent");
  const navEl = document.querySelector("nav");

  if (studentId && navEl && !document.getElementById("studentBadge")) {
    const badge = document.createElement("div");
    badge.id = "studentBadge";
    badge.innerHTML = `
      <span>👤 <strong>${studentId}</strong></span>
      <a href="#" id="logoutLink">Logout</a>`;
    navEl.appendChild(badge);

    document.getElementById("logoutLink").addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("loggedInStudent");
      window.location.href = "login.html";
    });
  }
});