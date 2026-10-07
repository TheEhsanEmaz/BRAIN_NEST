const loginForm = document.getElementById("loginForm");

if (loginForm) {
  const studentIdInput = document.getElementById("studentId");
  const passwordInput = document.getElementById("password");
  const confirmPasswordGroup = document.getElementById("confirmPasswordGroup");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const errorEl = document.getElementById("loginError");
  const submitButton = loginForm.querySelector('button[type="submit"]');
  const modeToggle = document.getElementById("authModeToggle");
  const heading = document.getElementById("authHeading");
  const subtitle = document.getElementById("authSubtitle");
  let isRegistering = false;

  modeToggle.addEventListener("click", () => {
    isRegistering = !isRegistering;
    heading.textContent = isRegistering ? "Create your account" : "Welcome back";
    subtitle.textContent = isRegistering
      ? "Create a student account to register for courses."
      : "Sign in to your student account to continue.";
    submitButton.textContent = isRegistering ? "Create account" : "Sign in";
    modeToggle.textContent = isRegistering ? "Already have an account? Sign in" : "New student? Create an account";
    confirmPasswordGroup.hidden = !isRegistering;
    confirmPasswordInput.required = isRegistering;
    passwordInput.autocomplete = isRegistering ? "new-password" : "current-password";
    errorEl.style.display = "none";
    errorEl.textContent = "";
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorEl.style.display = "none";
    errorEl.textContent = "";

    if (isRegistering && passwordInput.value !== confirmPasswordInput.value) {
      errorEl.textContent = "The passwords do not match.";
      errorEl.style.display = "block";
      return;
    }

    submitButton.disabled = true;
    modeToggle.disabled = true;
    submitButton.textContent = isRegistering ? "Creating account…" : "Signing in…";
    try {
      await Api.request(isRegistering ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          studentId: studentIdInput.value.trim(),
          password: passwordInput.value
        })
      });
      window.location.href = "courses.html";
    } catch (error) {
      errorEl.textContent = error.message;
      errorEl.style.display = "block";
      submitButton.disabled = false;
      modeToggle.disabled = false;
      submitButton.textContent = isRegistering ? "Create account" : "Sign in";
    }
  });
}
