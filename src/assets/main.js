const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

function initNavigation() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (!toggle || !nav) return;
  const close = (restore = false) => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    if (restore) toggle.focus();
  };
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
  });
  nav.addEventListener("click", (event) => { if (event.target.closest("a")) close(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && nav.classList.contains("is-open")) close(true); });
  document.addEventListener("click", (event) => { if (nav.classList.contains("is-open") && !nav.contains(event.target) && !toggle.contains(event.target)) close(); });
}

function initLanguage() {
  document.querySelectorAll("[data-language]").forEach((link) => {
    const target = new URL(link.href);
    target.hash = location.hash;
    link.href = target.href;
    link.addEventListener("click", () => {
      try { localStorage.setItem("nonote-locale", link.href.includes("/zh-CN/") ? "zh-CN" : "en"); } catch {}
    });
  });
}

function initDemo() {
  const root = document.querySelector("[data-demo]");
  if (!root) return;
  const buttons = [...root.querySelectorAll("[data-demo-step]")];
  const focuses = [...root.querySelectorAll(".demo-focus")];
  let active = 0;
  let timer;
  const select = (index, user = false) => {
    active = index;
    buttons.forEach((button, i) => {
      button.classList.toggle("is-active", i === index);
      button.setAttribute("aria-pressed", String(i === index));
    });
    focuses.forEach((focus, i) => focus.classList.toggle("is-active", i === index));
    if (user && timer) clearInterval(timer);
  };
  buttons.forEach((button, index) => button.addEventListener("click", () => select(index, true)));
  select(0);
  if (!reducedMotion.matches) {
    timer = setInterval(() => {
      if (document.hidden) return;
      if (active === buttons.length - 1) return clearInterval(timer);
      select(active + 1);
    }, 1800);
  }
}

function initWorkflow() {
  const root = document.querySelector("[data-workflow]");
  if (!root) return;
  const tabs = [...root.querySelectorAll("[data-workflow-tab]")];
  const panels = [...root.querySelectorAll("[data-workflow-panel]")];
  const signals = [...root.querySelectorAll(".workflow-signal span")];
  const select = (index, focus = false) => {
    root.style.setProperty("--workflow-step", index);
    tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    panels.forEach((panel, i) => { panel.hidden = i !== index; });
    signals.forEach((signal, i) => signal.classList.toggle("is-active", i === index));
    if (focus) tabs[index].focus();
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(index));
    tab.addEventListener("keydown", (event) => {
      const delta = ["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 0;
      if (!delta) return;
      event.preventDefault();
      select((index + delta + tabs.length) % tabs.length, true);
    });
  });
  select(0);
}

function platform() {
  const value = navigator.userAgentData?.platform || navigator.platform || navigator.userAgent;
  if (/mac/i.test(value)) return { os: "macos", arch: /arm|aarch64/i.test(navigator.userAgent) ? "arm64" : "" };
  if (/win/i.test(value)) return { os: "windows", arch: "x64" };
  return { os: "", arch: "" };
}

function initDownloads() {
  const detected = platform();
  const cards = [...document.querySelectorAll(".download-card")];
  const message = document.querySelector("[data-platform-message]");
  let match;
  if (detected.os === "windows") match = cards.find((card) => card.dataset.platform === "windows");
  if (detected.os === "macos" && detected.arch) match = cards.find((card) => card.dataset.platform === "macos" && card.dataset.arch === detected.arch);
  if (match) {
    match.classList.add("is-recommended");
    match.querySelector(".recommendation")?.removeAttribute("hidden");
  } else if (message) {
    message.textContent = detected.os === "macos" ? message.dataset.macUnknown : message.dataset.unknown;
    message.hidden = false;
  }
  document.querySelectorAll("[data-download]").forEach((link) => link.addEventListener("click", () => link.setAttribute("aria-busy", "true"), { once: true }));
}

function initReveal() {
  const items = [...document.querySelectorAll("[data-reveal]")];
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }
  document.documentElement.classList.add("has-motion");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  items.forEach((item) => observer.observe(item));
}

function initLocalMap() {
  const map = document.querySelector("[data-local]");
  if (!map || reducedMotion.matches || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    map.classList.add("is-active");
    observer.disconnect();
  }, { threshold: 0.3 });
  observer.observe(map);
}

function initMediaDialog() {
  const dialog = document.querySelector("[data-media-dialog]");
  const content = dialog?.querySelector("[data-media-dialog-content]");
  const close = dialog?.querySelector("[data-media-close]");
  if (!dialog || !content || !close) return;
  let trigger;
  document.querySelectorAll("[data-media-open]").forEach((button) => button.addEventListener("click", () => {
    trigger = button;
    content.replaceChildren(button.querySelector("[data-media-asset]").cloneNode(true));
    dialog.showModal();
    close.focus();
  }));
  const dismiss = () => dialog.close();
  close.addEventListener("click", dismiss);
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dismiss(); });
  dialog.addEventListener("close", () => trigger?.focus());
}

initNavigation();
initLanguage();
initDemo();
initWorkflow();
initDownloads();
initReveal();
initLocalMap();
initMediaDialog();
