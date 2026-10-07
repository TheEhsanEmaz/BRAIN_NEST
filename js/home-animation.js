document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("typedOutput");
  if (!el) return;

  const text = "register(CSE101);";
  let i = 0;

  function typeChar() {
    if (i < text.length) {
      el.textContent += text.charAt(i);
      i++;
      setTimeout(typeChar, 80);
    } else {
      setTimeout(() => {
        el.textContent = "";
        i = 0;
        typeChar();
      }, 2000);
    }
  }

  typeChar();
});