const W = 23100;
const H = 1024;
const scroller = document.getElementById("jf-scroller");
const spacer = document.getElementById("jf-spacer");
const canvas = document.getElementById("jf-canvas");
const menuIcon = document.getElementById("jf-menu-icon");
const indexContainer = document.getElementById("index-container");
const closeIndexButton = document.getElementById("index-close");
const navButtons = Array.from(document.querySelectorAll("[data-target]"));

const textEls = Array.from(
  canvas?.querySelectorAll("p, span, h1, h2, h3, h4, h5, h6") || [],
).filter((el) => el.textContent?.trim());

let targetScroll = scroller.scrollLeft;
let rafId = null;

const updateTextOpacity = () => {
  const width = window.innerWidth;
  const fadeStart = width * 1.02;
  const fadeEnd = width * 0.4;

  textEls.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const x = rect.left;
    const progress = 1 - (x - fadeEnd) / (fadeStart - fadeEnd);
    el.style.opacity = `${Math.min(1, Math.max(0, progress))}`;
  });
};

const setTargetScroll = (value) => {
  if (!scroller) return;
  targetScroll = Math.max(
    0,
    Math.min(value, scroller.scrollWidth - scroller.clientWidth),
  );
  if (rafId === null) {
    const animate = () => {
      const current = scroller.scrollLeft;
      const delta = targetScroll - current;
      if (Math.abs(delta) < 0.5) {
        scroller.scrollLeft = targetScroll;
        rafId = null;
        return;
      }
      scroller.scrollLeft = current + delta * 0.36;
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
  }
};

const update = () => {
  if (!canvas || !spacer) return;
  const scale = window.innerHeight / H;
  canvas.style.transform = `scale(${scale})`;
  spacer.style.width = `${W * scale}px`;
  updateTextOpacity();
};

const onScroll = () => {
  if (!scroller || !canvas) return;
  targetScroll = scroller.scrollLeft;
  canvas.style.left = `-${scroller.scrollLeft}px`;
  updateTextOpacity();
};

const onWheel = (event) => {
  event.preventDefault();
  const delta = event.deltaY;
  if (delta === 0) return;
  setTargetScroll(targetScroll + delta * 1.0);
};

const openIndex = () => {
  indexContainer.classList.remove("hidden");
};

const closeIndex = () => {
  indexContainer.classList.add("hidden");
};

const handleNavigation = (scrollPos) => {
  closeIndex();
  setTimeout(() => {
    scroller.scrollLeft = scrollPos;
    targetScroll = scrollPos;
    canvas.style.left = `-${scrollPos}px`;
    updateTextOpacity();
  }, 50);
};

menuIcon?.addEventListener("click", openIndex);
closeIndexButton?.addEventListener("click", closeIndex);
navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const positions = {
      Joboji: 3096,
      Process: 7174,
      Living: 18135,
      Future: 21648,
    };
    const target = button.dataset.target;
    handleNavigation(positions[target] || 0);
  });
});

update();
window.addEventListener("resize", update);
scroller?.addEventListener("scroll", onScroll, { passive: true });
scroller?.addEventListener("wheel", onWheel, { passive: false });

tryPlayVideo();
