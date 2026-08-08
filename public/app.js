// ============================================================
//  DSA GURU — Frontend Chat App
// ============================================================

const messagesContainer = document.getElementById("messagesContainer");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const typingIndicator = document.getElementById("typingIndicator");
const welcomeScreen = document.getElementById("welcomeScreen");
const charCount = document.getElementById("charCount");
const questionCounter = document.getElementById("questionCount");
const sessionTimer = document.getElementById("sessionTime");
const toggleSidebar = document.getElementById("toggleSidebar");
const sidebar = document.getElementById("sidebar");
const mobileMenuBtn = document.getElementById("mobileMenu");
const newChatBtn = document.getElementById("newChatBtn");
const clearChatBtn = document.getElementById("clearChat");

// ──────────────────────────────────────────────
//  State
// ──────────────────────────────────────────────
let questionCount = 0;
let sessionStart = Date.now();
let sidebarCollapsed = false;
let overlay = null;
let isWaiting = false; // prevent double sends

// ──────────────────────────────────────────────
//  Session timer
// ──────────────────────────────────────────────
setInterval(() => {
  const minutes = Math.floor((Date.now() - sessionStart) / 60000);
  sessionTimer.textContent =
    minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h`;
}, 60000);

// ──────────────────────────────────────────────
//  Sidebar — desktop collapse/expand
// ──────────────────────────────────────────────
toggleSidebar.addEventListener("click", () => {
  sidebarCollapsed = !sidebarCollapsed;
  sidebar.classList.toggle("collapsed", sidebarCollapsed);
});

// ──────────────────────────────────────────────
//  Sidebar — mobile open/close
// ──────────────────────────────────────────────
function createOverlay() {
  if (overlay) return;
  overlay = document.createElement("div");
  overlay.className = "sidebar-overlay";
  document.body.appendChild(overlay);
  overlay.addEventListener("click", closeMobileSidebar);
}

function closeMobileSidebar() {
  sidebar.classList.remove("mobile-open");
  if (overlay) {
    overlay.classList.remove("visible");
    setTimeout(() => {
      overlay?.remove();
      overlay = null;
    }, 300);
  }
}

mobileMenuBtn.addEventListener("click", () => {
  createOverlay();
  sidebar.classList.add("mobile-open");
  setTimeout(() => overlay?.classList.add("visible"), 10);
});

// ──────────────────────────────────────────────
//  Textarea — auto-resize & char count
// ──────────────────────────────────────────────
userInput.addEventListener("input", () => {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + "px";

  const len = userInput.value.length;
  charCount.textContent = `${len}/2000`;
  charCount.style.color =
    len > 1800 ? "#ff6584" : len > 1500 ? "#ffcc44" : "var(--text-muted)";

  // Enable send only if there's text and not waiting
  sendBtn.disabled = userInput.value.trim() === "" || isWaiting;
});

// ──────────────────────────────────────────────
//  Keyboard shortcuts
// ──────────────────────────────────────────────
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled && !isWaiting) sendMessage();
  }
});

// ──────────────────────────────────────────────
//  Suggestion chips
// ──────────────────────────────────────────────
document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    userInput.value = chip.dataset.query;
    userInput.dispatchEvent(new Event("input"));
    sendMessage();
  });
});

// ──────────────────────────────────────────────
//  Send button click
// ──────────────────────────────────────────────
sendBtn.addEventListener("click", () => {
  if (!isWaiting) sendMessage();
});

// ──────────────────────────────────────────────
//  New chat
// ──────────────────────────────────────────────
newChatBtn.addEventListener("click", () => {
  if (!confirm("Start a new chat? Current conversation will be cleared."))
    return;
  resetChat();
  closeMobileSidebar();
});

// ──────────────────────────────────────────────
//  Clear chat
// ──────────────────────────────────────────────
clearChatBtn.addEventListener("click", () => {
  if (!confirm("Clear all messages?")) return;
  resetChat();
});

async function resetChat() {
  // Tell backend to clear history
  try {
    await fetch("/api/clear", { method: "POST" });
  } catch (e) {
    console.warn("Could not clear server history:", e);
  }

  // Remove message elements
  const messages = messagesContainer.querySelectorAll(".message");
  messages.forEach((m) => m.remove());

  // Re-show welcome screen
  welcomeScreen.style.display = "flex";

  questionCount = 0;
  questionCounter.textContent = "0";
  sessionStart = Date.now();
  sessionTimer.textContent = "0m";
  showToast("Chat cleared! ✅");
}

// ──────────────────────────────────────────────
//  MAIN SEND FUNCTION
// ──────────────────────────────────────────────
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text || isWaiting) return;

  // Hide welcome screen
  welcomeScreen.style.display = "none";

  // Add user bubble
  appendMessage(text, "user");

  // Reset input
  userInput.value = "";
  userInput.style.height = "auto";
  charCount.textContent = "0/2000";
  sendBtn.disabled = true;
  isWaiting = true;

  // Show typing indicator
  showTyping(true);
  scrollBottom();

  try {
    console.log("Sending message to /api/chat:", text);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    console.log("Response status:", response.status);

    const data = await response.json();
    console.log("Response data:", data);

    if (!response.ok) {
      throw new Error(data.error || `Server error ${response.status}`);
    }

    showTyping(false);
    isWaiting = false;

    const isRude = detectRude(data.reply);
    appendMessage(data.reply, "bot", isRude);

    questionCount++;
    questionCounter.textContent = questionCount;
  } catch (err) {
    showTyping(false);
    isWaiting = false;
    console.error("Chat error:", err);
    appendMessage(`⚠️ Error: ${err.message}. Please try again.`, "bot", false);
    showToast("Request failed! Check console for details.");
  }

  scrollBottom();
}

// ──────────────────────────────────────────────
//  Detect rude response
// ──────────────────────────────────────────────
function detectRude(text) {
  const rudeKeywords = [
    "idiot",
    "dumb",
    "stupid",
    "fool",
    "nonsense",
    "wasting my time",
    "absolute",
    "insulting",
    "not related",
  ];
  return rudeKeywords.some((kw) => text.toLowerCase().includes(kw));
}

// ──────────────────────────────────────────────
//  Append message bubble to chat
// ──────────────────────────────────────────────
function appendMessage(text, sender, rude = false) {
  const wrapper = document.createElement("div");
  wrapper.className = `message ${sender}-message`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.innerHTML =
    sender === "user"
      ? '<i class="fas fa-user"></i>'
      : '<i class="fas fa-code"></i>';

  const contentCol = document.createElement("div");
  contentCol.className = "message-content";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble" + (rude ? " rude-response" : "");
  bubble.innerHTML = formatText(text);

  const timeEl = document.createElement("div");
  timeEl.className = "message-time";
  timeEl.textContent = currentTime();

  contentCol.appendChild(bubble);
  contentCol.appendChild(timeEl);
  wrapper.appendChild(avatar);
  wrapper.appendChild(contentCol);
  messagesContainer.appendChild(wrapper);

  scrollBottom();
}

// ──────────────────────────────────────────────
//  Format text (basic markdown)
// ──────────────────────────────────────────────
function formatText(text) {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks
  html = html.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Headings
  html = html.replace(
    /^### (.+)$/gm,
    "<h4 style='margin:8px 0 4px;color:var(--primary-light)'>$1</h4>"
  );
  html = html.replace(
    /^## (.+)$/gm,
    "<h3 style='margin:10px 0 6px;color:var(--primary-light)'>$1</h3>"
  );
  html = html.replace(
    /^# (.+)$/gm,
    "<h2 style='margin:12px 0 8px;color:var(--primary-light)'>$1</h2>"
  );

  // Bullet list
  html = html.replace(/^- (.+)$/gm, "<li style='margin-left:16px'>$1</li>");

  // Line breaks
  html = html.replace(/\n/g, "<br>");

  return html;
}

// ──────────────────────────────────────────────
//  Typing indicator
// ──────────────────────────────────────────────
function showTyping(show) {
  typingIndicator.classList.toggle("visible", show);
}

// ──────────────────────────────────────────────
//  Scroll to bottom
// ──────────────────────────────────────────────
function scrollBottom() {
  setTimeout(() => {
    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: "smooth",
    });
  }, 50);
}

// ──────────────────────────────────────────────
//  Current time
// ──────────────────────────────────────────────
function currentTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ──────────────────────────────────────────────
//  Toast notification
// ──────────────────────────────────────────────
function showToast(message) {
  const existing = document.querySelector(".toast");
  existing?.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<i class="fas fa-info-circle" style="color:var(--primary)"></i> ${message}`;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("show"));
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ──────────────────────────────────────────────
//  Topic items sidebar
// ──────────────────────────────────────────────
document.querySelectorAll(".topic-item").forEach((item) => {
  item.addEventListener("click", () => {
    document
      .querySelectorAll(".topic-item")
      .forEach((i) => i.classList.remove("active"));
    item.classList.add("active");
    closeMobileSidebar();
  });
});