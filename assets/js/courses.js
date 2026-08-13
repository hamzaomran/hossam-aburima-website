(function () {
  var listEl = document.getElementById("videoList");
  if (!listEl) return;

  var videos = window.HAStorage.getVideos();

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString("ar-LY", {
        year: "numeric", month: "long", day: "numeric"
      });
    } catch (e) {
      return "";
    }
  }

  function frameHTML(video) {
    if (video.type === "youtube") {
      return '<div class="video-frame"><iframe src="https://www.youtube.com/embed/' +
        window.HAStorage.youtubeId(video.url) +
        '" title="' + esc(video.title) + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>';
    }
    if (video.type === "url") {
      return '<div class="video-frame"><video src="' + esc(video.url) + '" controls preload="metadata"></video></div>';
    }
    if (video.type === "idb") {
      return '<div class="video-frame" data-blob="' + esc(video.id) + '"></div>';
    }
    return "";
  }

  function render() {
    if (!videos.length) {
      listEl.innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-ico"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m10 9 5 3-5 3V9z"/></svg></div>' +
        '<h3>لا توجد محاضرات بعد</h3>' +
        '<p>سيتم إضافة المحاضرات قريبًا. تابعنا للاستفادة من المحتوى التعليمي المجاني.</p>' +
        "</div>";
      return;
    }

    listEl.innerHTML = videos.map(function (v) {
      var date = v.date ? '<span class="video-date">' + formatDate(v.date) + "</span>" : "";
      return (
        '<article class="video-card">' +
        frameHTML(v) +
        '<div class="video-body">' +
        '<h3 class="video-title">' + esc(v.title) + "</h3>" +
        (v.desc ? '<p class="video-desc">' + esc(v.desc) + "</p>" : "") +
        date +
        "</div>" +
        "</article>"
      );
    }).join("");

    listEl.querySelectorAll(".video-frame[data-blob]").forEach(function (frame) {
      window.HAStorage.getFile(frame.getAttribute("data-blob")).then(function (blob) {
        if (!blob) return;
        var video = document.createElement("video");
        video.controls = true;
        video.preload = "metadata";
        video.src = URL.createObjectURL(blob);
        frame.appendChild(video);
      });
    });
  }

  render();
})();
