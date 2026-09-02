// Intel Hub — landing page logic
// Ports must match orchestrator.py's CONFIG block.
const SERVICES = {
  website: { url: "http://localhost:5173", label: ":5173" },
  documents: { url: "http://localhost:8010", label: ":8010" },
  ncrp: { url: "http://localhost:8080", label: ":8080" },
};

// Show each service's port under its card.
Object.entries(SERVICES).forEach(([key, svc]) => {
  const el = document.getElementById(`port-${key}`);
  if (el) el.textContent = svc.label;
});

// Live clock.
function tickClock() {
  const el = document.getElementById("clock");
  if (el) el.textContent = new Date().toLocaleTimeString([], { hour12: false });
}
tickClock();
setInterval(tickClock, 1000);

// Ping each service so its status dot goes green once it's actually up.
// no-cors mode: we can't read the response, but a resolved fetch means
// *something* answered on that port, which is all we need for a heartbeat.
async function checkStatus(key, url) {
  const dot = document.querySelector(`.dot[data-status="${key}"]`);
  if (!dot) return;
  try {
    await fetch(url, { mode: "no-cors", cache: "no-store" });
    dot.classList.add("online");
    dot.classList.remove("offline");
  } catch {
    dot.classList.add("offline");
    dot.classList.remove("online");
  }
}

function pollAll() {
  Object.entries(SERVICES).forEach(([key, svc]) => checkStatus(key, svc.url));
}
pollAll();
setInterval(pollAll, 4000);

// Clicking a card or its button opens that workspace in a new tab.
function openWorkspace(key) {
  const svc = SERVICES[key];
  if (svc) window.open(svc.url, "_blank", "noopener");
}

document.querySelectorAll(".launch").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    openWorkspace(btn.dataset.target);
  });
});

document.querySelectorAll(".panel").forEach((panel) => {
  panel.addEventListener("click", () => openWorkspace(panel.dataset.target));
});
