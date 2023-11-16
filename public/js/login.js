let passwordVisible = false;

const eyeContainer = document.getElementById("eye-container");
const eyeOpenSvg = document.getElementById("password-visible-svg");
const eyeClosedSvg = document.getElementById("password-hidden-svg");
const passwordInput = document.getElementById("password-input");

passwordInput.focus();

eyeContainer.onclick = () => {
  passwordVisible = !passwordVisible;
  if (passwordVisible) {
    eyeClosedSvg.style.display = "none";
    eyeOpenSvg.style.display = "block";
    passwordInput.type = "text";
  } else {
    eyeClosedSvg.style.display = "block";
    eyeOpenSvg.style.display = "none";
    passwordInput.type = "password";
  }
};

function login(password) {
  fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  })
    .then((response) => response.json())
    .then((response) => {
      if (response.error) return console.log(response.error);
      window.location.replace("/adminSide/connected");
    });
}

passwordInput.addEventListener("keydown", (key) => {
  if (key.keyCode === 13) login(passwordInput.value);
});
