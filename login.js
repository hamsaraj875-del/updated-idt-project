// ===== LOAD USERS =====
let users = JSON.parse(localStorage.getItem("users")) || [];

// ===== ELEMENTS =====
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const error = document.getElementById("error");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");

// ===== LOGIN =====
loginBtn.addEventListener("click", (e) => {
    e.preventDefault(); // prevents form refresh

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        error.textContent = "Please fill all fields";
        error.style.color = "#f87171"; // red
        return;
    }

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        localStorage.setItem("loggedUser", username); // mark as logged in
        error.textContent = "";
        window.location.href = "index.html";
    } else {
        error.textContent = "Invalid username or password";
        error.style.color = "#f87171"; // red
    }
});

// ===== SIGN UP =====
signupBtn.addEventListener("click", (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        error.textContent = "Please fill all fields";
        error.style.color = "#f87171"; // red
        return;
    }

    if (users.some(u => u.username === username)) {
        error.textContent = "User already exists";
        error.style.color = "#f87171"; // red
        return;
    }

    // ✅ SAVE USER
    users.push({ username, password });
    localStorage.setItem("users", JSON.stringify(users));

    error.textContent = "Account created! You can login now.";
    error.style.color = "#22c55e"; // green

    usernameInput.value = "";
    passwordInput.value = "";
});
