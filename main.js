const W = 23100;
const H = 1024;
const scroller = document.getElementById("jf-scroller");
const spacer = document.getElementById("jf-spacer");
const canvas = document.getElementById("jf-canvas");
const menuIcon = document.getElementById("jf-menu-icon");
const indexContainer = document.getElementById("index-container");
const closeIndexButton = document.getElementById("index-close");
const navButtons = Array.from(document.querySelectorAll("[data-target]"));
const video = document.getElementById("main-video");
const videoError = document.getElementById("video-error");
const images = Array.from(canvas?.querySelectorAll("img") || []);
const dropSoundImage = "assets/urushi_kaki.png";
const woodSoundImage = "assets/kiji.png";
const soundProfiles = {
  [dropSoundImage]: {
    src: "assets/drop.mp3",
    baseVolume: 0.7,
  },
  [woodSoundImage]: {
    src: "assets/wood2.wav",
    baseVolume: 0.7,
  },
};

const textEls = Array.from(
  canvas?.querySelectorAll("p, span, h1, h2, h3, h4, h5, h6") || [],
).filter((el) => el.textContent?.trim());

const photoCenterState = new WeakMap();
const soundStateByImage = new WeakMap();

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

const getPhotoSoundProfile = (img) => {
  const src = img.getAttribute("src");
  return src ? soundProfiles[src] || null : null;
};

const getPhotoSoundState = (img) => {
  let state = soundStateByImage.get(img);
  if (state) return state;

  const profile = getPhotoSoundProfile(img);
  if (!profile) return null;

  const audio = new Audio(profile.src);
  audio.preload = "auto";
  audio.loop = false;
  audio.volume = 0;

  state = {
    audio,
    profile,
    isPlaying: false,
    img,
  };
  audio.addEventListener("ended", () => {
    state.isPlaying = false;
    audio.volume = 0;
    audio.currentTime = 0;
    img.classList.remove("sound-active");
  });
  soundStateByImage.set(img, state);
  return state;
};

const startPhotoSound = (state) => {
  if (state.isPlaying) return;
  state.audio.currentTime = 0;
  state.isPlaying = true;
  const playResult = state.audio.play();
  if (playResult && typeof playResult.then === "function") {
    playResult
      .then(() => {})
      .catch((error) => {
        console.warn("Photo sound play prevented:", error);
        state.isPlaying = false;
        state.img.classList.remove("sound-active");
      });
    return;
  }
};

const stopPhotoSound = (state) => {
  if (!state.isPlaying) return;
  state.audio.pause();
  state.audio.currentTime = 0;
  state.audio.volume = 0;
  state.isPlaying = false;
  state.img.classList.remove("sound-active");
};

const updatePhotoCenterSound = () => {
  const viewportCenter = window.innerWidth / 2;
  const fadeZone = Math.max(160, window.innerWidth * 0.18);
  const stopZone = fadeZone * 1.2;

  images.forEach((img) => {
    const rect = img.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const soundState = getPhotoSoundState(img);
    if (!soundState) return;

    const imageCenter = rect.left + rect.width / 2;
    const distance = Math.abs(imageCenter - viewportCenter);
    const wasCentered = photoCenterState.get(img) || false;
    const isCentered = distance <= fadeZone;

    if (isCentered && !wasCentered) {
      startPhotoSound(soundState);
    }

    if (!isCentered && distance >= stopZone) {
      stopPhotoSound(soundState);
      photoCenterState.set(img, false);
      return;
    }

    if (!soundState.isPlaying) return;

    const fadeProgress = Math.max(0, 1 - distance / fadeZone);
    const easedVolume = soundState.profile.baseVolume * fadeProgress;
    soundState.audio.volume = Math.min(
      soundState.profile.baseVolume,
      easedVolume,
    );
    soundState.img.classList.toggle(
      "sound-active",
      soundState.audio.volume > 0.01,
    );
    photoCenterState.set(img, isCentered);
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
  updatePhotoCenterSound();
};

const onScroll = () => {
  if (!scroller || !canvas) return;
  targetScroll = scroller.scrollLeft;
  canvas.style.left = `-${scroller.scrollLeft}px`;
  updateTextOpacity();
  updatePhotoCenterSound();
};

const onWheel = (event) => {
  event.preventDefault();
  const delta = event.deltaY;
  if (delta === 0) return;
  setTargetScroll(targetScroll + delta * 1.0);
};

const tryPlayVideo = async () => {
  if (!video) return;
  try {
    await video.play();
  } catch (error) {
    console.warn("Video play prevented:", error);
  }
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
    updatePhotoCenterSound();
  }, 50);
};

if (video) {
  video.addEventListener("loadeddata", () => {
    if (video.paused) {
      tryPlayVideo();
    }
  });

  video.addEventListener("error", () => {
    if (videoError) {
      videoError.style.display = "flex";
    }
  });

  setInterval(() => {
    if (video.paused) {
      tryPlayVideo();
    }
  }, 3000);
}

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
