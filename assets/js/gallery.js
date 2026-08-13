(function () {
  var gridEl = document.getElementById("galleryGrid");
  var filterEl = document.getElementById("galleryFilter");
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxClose = document.getElementById("lightboxClose");
  if (!gridEl) return;

  var DEFAULT_IMAGES = [
    { label: "صورة أكاديمية", cat: "academic", src: "assets/1.jpeg" },
    { label: "صورة رسمية", cat: "media", src: "assets/2.jpeg" },
    { label: "لقطة من الميدان", cat: "field", src: "assets/3.jpeg" },
    { label: "أثناء العمل", cat: "field", src: "assets/4.jpeg" },
    { label: "صورة شخصية", cat: "media", src: "assets/5.jpeg" }
  ];

  var custom = window.HAStorage.getGallery();
  var items = [];

  DEFAULT_IMAGES.forEach(function (d) {
    items.push({ label: d.label, cat: d.cat, src: d.src, kind: "url" });
  });
  custom.forEach(function (g) {
    items.push({ label: g.label || "صورة", cat: g.cat || "media", src: g.src, kind: g.type || "url", id: g.id });
  });

  var activeFilter = "all";
  var objectURLs = {};

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function resolveSrc(item) {
    if (item.kind === "idb") {
      return objectURLs[item.id] || "";
    }
    return item.src;
  }

  function render() {
    var visible = items.filter(function (it) {
      return activeFilter === "all" || it.cat === activeFilter;
    });

    if (!visible.length) {
      gridEl.innerHTML =
        '<div class="empty-state" style="grid-column:1/-1">' +
        '<div class="empty-ico"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>' +
        "<h3>لا توجد صور في هذا التصنيف</h3></div>";
      return;
    }

    gridEl.innerHTML = visible.map(function (it) {
      var src = resolveSrc(it);
      return (
        '<figure class="gallery-item" data-cat="' + esc(it.cat) + '">' +
        (src ? '<img src="' + esc(src) + '" alt="' + esc(it.label) + '" loading="lazy">' : "") +
        "<figcaption>" + esc(it.label) + "</figcaption>" +
        "</figure>"
      );
    }).join("");
  }

  function refresh() {
    items = [];
    DEFAULT_IMAGES.forEach(function (d) {
      items.push({ label: d.label, cat: d.cat, src: d.src, kind: "url" });
    });
    window.HAStorage.getGallery().forEach(function (g) {
      items.push({ label: g.label || "صورة", cat: g.cat || "media", src: g.src, kind: g.type || "url", id: g.id });
    });
    render();
  }

  /* تحميل صور IndexedDB */
  items.forEach(function (it) {
    if (it.kind === "idb" && it.id) {
      window.HAStorage.getFile(it.id).then(function (blob) {
        if (!blob) return;
        objectURLs[it.id] = URL.createObjectURL(blob);
        var img = gridEl.querySelector('.gallery-item[data-blob="' + it.id + '"]');
        render();
      });
    }
  });

  gridEl.addEventListener("click", function (e) {
    var fig = e.target.closest(".gallery-item");
    if (!fig) return;
    var img = fig.querySelector("img");
    if (!img) return;
    lightboxImg.src = img.src;
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
  });

  if (lightboxClose) {
    lightboxClose.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLightbox();
    });
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
  }

  if (filterEl) {
    filterEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-btn");
      if (!btn) return;
      filterEl.querySelectorAll(".filter-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      activeFilter = btn.getAttribute("data-filter");
      refresh();
    });
  }

  render();
})();
