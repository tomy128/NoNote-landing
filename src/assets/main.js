const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

function initNavigation() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (!toggle || !nav) return;
  const close = ({ restore = false } = {}) => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    if (restore) toggle.focus();
  };
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
  });
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) close({ restore: true });
  });
  document.addEventListener("click", (event) => {
    if (nav.classList.contains("is-open") && !nav.contains(event.target) && !toggle.contains(event.target)) close();
  });
}

function initLanguage() {
  document.querySelectorAll("[data-language]").forEach((link) => {
    link.addEventListener("click", () => {
      const locale = link.href.includes("/zh-CN/") ? "zh-CN" : "en";
      try { localStorage.setItem("nonote-locale", locale); } catch {}
    });
  });
}

function initHeroDemo() {
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
      if (active === buttons.length - 1) {
        clearInterval(timer);
        return;
      }
      select(active + 1);
    }, 2600);
  }
}

function initWorkflow() {
  const root = document.querySelector("[data-workflow]");
  if (!root) return;
  const tabs = [...root.querySelectorAll("[data-workflow-tab]")];
  const panels = [...root.querySelectorAll("[data-workflow-panel]")];
  const select = (index, focus = false) => {
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel, i) => { panel.hidden = i !== index; });
    if (focus) tabs[index].focus();
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(index));
    tab.addEventListener("keydown", (event) => {
      const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
      if (!delta) return;
      event.preventDefault();
      select((index + delta + tabs.length) % tabs.length, true);
    });
  });
}

function platformName() {
  const platform = navigator.userAgentData?.platform || navigator.platform || navigator.userAgent;
  if (/mac/i.test(platform)) return "macos";
  if (/win/i.test(platform)) return "windows";
  return "";
}

function initDownloads() {
  const os = platformName();
  if (!os) return;
  const matches = [...document.querySelectorAll(`[data-platform="${os}"]`)];
  if (!matches.length) return;
  const preferred = os === "macos" && /arm|aarch64/i.test(navigator.userAgent) ? matches[0] : matches.at(-1);
  preferred.classList.add("is-recommended");
  preferred.querySelector(".recommendation")?.removeAttribute("hidden");
  document.querySelectorAll("[data-download]").forEach((link) => {
    link.addEventListener("click", () => link.setAttribute("aria-busy", "true"), { once: true });
  });
}

function initVisibility() {
  const target = document.querySelector("[data-local]");
  if (!target || reducedMotion.matches || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    target.classList.add("is-visible");
    observer.disconnect();
  }, { threshold: 0.35 });
  observer.observe(target);
}

initNavigation();
initLanguage();
initHeroDemo();
initWorkflow();
initDownloads();
initVisibility();
