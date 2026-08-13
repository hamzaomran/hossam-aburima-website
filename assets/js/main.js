(function () {
  var header = document.getElementById("siteHeader");
  var navToggle = document.querySelector(".nav-toggle");
  var mainNav = document.querySelector(".main-nav");

  if (header) {
    function onScroll() {
      header.classList.toggle("scrolled", window.scrollY > 40);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      var open = mainNav.classList.toggle("open");
      navToggle.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mainNav.classList.remove("open");
        navToggle.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* تحديد القسم النشط حسب اسم الصفحة */
  if (mainNav) {
    var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (page === "" ) page = "index.html";
    var homeActive = page === "index.html";
    mainNav.querySelectorAll("a[data-page]").forEach(function (link) {
      var target = link.getAttribute("data-page").toLowerCase();
      var match = target === page || (target === "index.html" && homeActive);
      if (match) link.classList.add("active");
    });

    /* للصفحة الرئيسية: تتبع التمرير بين الأقسام */
    if (homeActive) {
      var anchors = mainNav.querySelectorAll('a[href^="#"]');
      var sections = [];
      anchors.forEach(function (a) {
        var el = document.querySelector(a.getAttribute("href"));
        if (el) sections.push({ link: a, el: el });
      });
      function setActive() {
        var pos = window.scrollY + 140;
        var current = sections.length ? sections[0].link : null;
        sections.forEach(function (s) {
          if (s.el.offsetTop <= pos) current = s.link;
        });
        mainNav.querySelectorAll("a[data-page]").forEach(function (l) { l.classList.remove("active"); });
        if (current) current.classList.add("active");
      }
      window.addEventListener("scroll", setActive, { passive: true });
      setActive();
    }
  }

  /* حركة الظهور */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* عدادات الإحصائيات */
  var counters = document.querySelectorAll(".stat .num");
  function animateCounter(el) {
    var target = parseInt(el.getAttribute("data-target"), 10);
    if (isNaN(target)) return;
    var duration = 1400;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      el.textContent = Math.floor(progress * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  if (counters.length && "IntersectionObserver" in window) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { counterObserver.observe(c); });
  } else {
    counters.forEach(function (c) {
      var t = parseInt(c.getAttribute("data-target"), 10);
      if (!isNaN(t)) c.textContent = t;
    });
  }

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
