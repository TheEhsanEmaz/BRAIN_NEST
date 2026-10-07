document.addEventListener("DOMContentLoaded", async () => {
  const navEl = document.querySelector("nav");
  if (!navEl || document.getElementById("studentBadge")) return;

  try {
    const { student } = await Api.request("/api/auth/me");
    const badge = document.createElement("div");
    badge.id = "studentBadge";

    const identity = document.createElement("span");
    identity.textContent = `👤 ${student.studentId}`;
    const logoutLink = document.createElement("a");
    logoutLink.href = "#";
    logoutLink.textContent = "Logout";
    logoutLink.addEventListener("click", async (event) => {
      event.preventDefault();
      logoutLink.textContent = "Signing out…";
      try {
        await Api.request("/api/auth/logout", { method: "POST" });
        window.location.href = "login.html";
      } catch (error) {
        logoutLink.textContent = "Logout";
        console.error("Could not sign out:", error);
      }
    });

    badge.append(identity, logoutLink);
    navEl.appendChild(badge);
  } catch (error) {
    if (error.status !== 401) console.error("Could not load the signed-in student:", error);
  }
});
