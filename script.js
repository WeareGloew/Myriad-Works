"use strict";

const header = document.querySelector(".site-header");
const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector(".navigation");
const navigationLinks = document.querySelectorAll(".navigation a");
const backToTopButton = document.querySelector(".back-to-top");
const serviceButtons = document.querySelectorAll(".service-enquiry");
const serviceSelect = document.querySelector("#service-select");
const currentYear = document.querySelector("#current-year");

function setMenuState(isOpen) {
  navigation.classList.toggle("open", isOpen);
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute(
    "aria-label",
    isOpen ? "Close navigation menu" : "Open navigation menu"
  );

  document.body.classList.toggle("menu-open", isOpen);
}

function handleScroll() {
  const hasScrolled = window.scrollY > 20;
  const showBackToTop = window.scrollY > 600;

  header.classList.toggle("scrolled", hasScrolled);
  backToTopButton.classList.toggle("visible", showBackToTop);
}

function updateActiveNavigation() {
  const sections = document.querySelectorAll("main section[id]");
  const scrollPosition = window.scrollY + 160;

  let currentSection = "top";

  sections.forEach((section) => {
    if (scrollPosition >= section.offsetTop) {
      currentSection = section.id;
    }
  });

  navigationLinks.forEach((link) => {
    const target = link.getAttribute("href").replace("#", "");
    link.classList.toggle("active", target === currentSection);
  });
}

menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  setMenuState(!isOpen);
});

navigationLinks.forEach((link) => {
  link.addEventListener("click", () => {
    setMenuState(false);
  });
});

serviceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedService = button.dataset.service;

    if (serviceSelect) {
      serviceSelect.value = selectedService;
    }

    document.querySelector("#contact").scrollIntoView({
      behavior: "smooth"
    });

    window.setTimeout(() => {
      serviceSelect?.focus();
    }, 600);
  });
});

backToTopButton.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

window.addEventListener(
  "scroll",
  () => {
    handleScroll();
    updateActiveNavigation();
  },
  { passive: true }
);

window.addEventListener("resize", () => {
  if (window.innerWidth > 980) {
    setMenuState(false);
  }
});

currentYear.textContent = new Date().getFullYear();

handleScroll();
updateActiveNavigation();