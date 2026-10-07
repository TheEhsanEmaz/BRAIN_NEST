const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault(); // stop the form from actually submitting

    const studentId = document.getElementById("studentId").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorEl = document.getElementById("loginError");

    if (studentId === "" || password === "") {
      errorEl.textContent = "Please enter both Student ID and Password.";
      errorEl.style.display = "block";
      return;
    }

   
    localStorage.setItem("loggedInStudent", studentId);

   
    window.location.href = "courses.html";
  });
}