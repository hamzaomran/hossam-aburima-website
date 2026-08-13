(function () {
  var S = window.HAStorage;
  if (!S) return;

  /* ===== التبويبات ===== */
  var tabs = document.querySelectorAll(".admin-tab");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.classList.remove("active"); });
      tab.classList.add("active");
      document.querySelectorAll(".admin-panel").forEach(function (p) { p.classList.add("hidden"); });
      var panel = document.getElementById("panel-" + tab.getAttribute("data-tab"));
      if (panel) panel.classList.remove("hidden");
    });
  });

  /* ===== إشعار ===== */
  var toastEl = null;
  function toast(msg, isError) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.toggle("error", !!isError);
    requestAnimationFrame(function () { toastEl.classList.add("show"); });
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove("show"); }, 3200);
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ===== مصادر الفيديو ===== */
  var sourceRadios = document.querySelectorAll('input[name="vSource"]');
  var youtubeGroup = document.getElementById("youtubeGroup");
  var fileGroup = document.getElementById("fileGroup");
  var urlGroup = document.getElementById("urlGroup");

  function syncSource() {
    var val = document.querySelector('input[name="vSource"]:checked').value;
    youtubeGroup.classList.toggle("hidden", val !== "youtube");
    fileGroup.classList.toggle("hidden", val !== "file");
    urlGroup.classList.toggle("hidden", val !== "url");
  }
  sourceRadios.forEach(function (r) { r.addEventListener("change", syncSource); });
  syncSource();

  /* ===== قائمة الفيديوهات ===== */
  var videoListEl = document.getElementById("videoList");
  var videoCountEl = document.getElementById("videoCount");

  function renderVideos() {
    var videos = S.getVideos();
    videoCountEl.textContent = videos.length;
    if (!videos.length) {
      videoListEl.innerHTML = '<div class="admin-empty">لا توجد محاضرات مضافة بعد.</div>';
      return;
    }
    videoListEl.innerHTML = videos.map(function (v) {
      var meta;
      if (v.type === "youtube") meta = "رابط يوتيوب";
      else if (v.type === "url") meta = "رابط مباشر";
      else meta = "ملف مرفوع";
      return (
        '<div class="admin-item">' +
        '<span class="admin-item-thumb"><svg class="play-ico" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>' +
        '<div class="admin-item-info">' +
        '<div class="admin-item-title">' + esc(v.title) + "</div>" +
        '<div class="admin-item-meta">' + meta + (v.date ? " · " + new Date(v.date).toLocaleDateString("ar-LY") : "") + "</div>" +
        "</div>" +
        '<div class="admin-item-actions">' +
        '<button class="admin-del" data-del-video="' + esc(v.id) + '" title="حذف">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
        "</button></div></div>"
      );
    }).join("");
  }

  videoListEl.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-del-video]");
    if (!btn) return;
    var id = btn.getAttribute("data-del-video");
    var v = S.getVideos().find(function (x) { return x.id === id; });
    S.removeVideo(id);
    if (v && v.type === "idb") S.deleteFile(id).then(renderVideos).catch(renderVideos);
    renderVideos();
    toast("تم حذف المحاضرة");
  });

  /* ===== إضافة فيديو ===== */
  document.getElementById("videoForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var title = document.getElementById("vTitle").value.trim();
    var desc = document.getElementById("vDesc").value.trim();
    var source = document.querySelector('input[name="vSource"]:checked').value;

    if (!title) { toast("أدخل عنوان المحاضرة", true); return; }

    if (source === "youtube") {
      var url = document.getElementById("vYoutube").value.trim();
      var yid = S.youtubeId(url);
      if (!yid) { toast("رابط يوتيوب غير صالح", true); return; }
      S.addVideo({ title: title, desc: desc, type: "youtube", url: url });
      document.getElementById("vYoutube").value = "";
      toast("تمت إضافة المحاضرة");
      renderVideos();
      return;
    }

    if (source === "url") {
      var fileUrl = document.getElementById("vUrl").value.trim();
      if (!/^https?:\/\//i.test(fileUrl)) { toast("أدخل رابط فيديو صالحًا يبدأ بـ https", true); return; }
      S.addVideo({ title: title, desc: desc, type: "url", url: fileUrl });
      document.getElementById("vUrl").value = "";
      toast("تمت إضافة المحاضرة");
      renderVideos();
      return;
    }

    if (source === "file") {
      var input = document.getElementById("vFile");
      var file = input.files[0];
      if (!file) { toast("اختر ملف الفيديو أولًا", true); return; }
      var id = S.uid();
      S.saveFile(id, file).then(function () {
        S.addVideo({ id: id, title: title, desc: desc, type: "idb", url: id });
        input.value = "";
        toast("تم رفع المحاضرة وحفظها");
        renderVideos();
      }).catch(function () {
        toast("فشل حفظ الملف — الملف كبير جدًا", true);
      });
    }
  });

  /* ===== قائمة الصور ===== */
  var galleryListEl = document.getElementById("galleryList");
  var galleryCountEl = document.getElementById("galleryCount");
  var thumbURLs = {};

  function renderGallery() {
    var items = S.getGallery();
    galleryCountEl.textContent = items.length;
    if (!items.length) {
      galleryListEl.innerHTML = '<div class="admin-empty">لا توجد صور مضافة بعد.</div>';
      return;
    }
    galleryListEl.innerHTML = items.map(function (g) {
      var src = g.type === "idb" ? (thumbURLs[g.id] || "") : g.src;
      var catNames = { field: "من الميدان", academic: "أكاديمي", media: "إعلامي" };
      return (
        '<div class="admin-item">' +
        '<span class="admin-item-thumb">' +
        (src ? '<img src="' + esc(src) + '" alt="">' : "") +
        "</span>" +
        '<div class="admin-item-info">' +
        '<div class="admin-item-title">' + esc(g.label || "صورة") + "</div>" +
        '<div class="admin-item-meta">' + (catNames[g.cat] || "إعلامي") + "</div>" +
        "</div>" +
        '<div class="admin-item-actions">' +
        '<button class="admin-del" data-del-gallery="' + esc(g.id) + '" title="حذف">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
        "</button></div></div>"
      );
    }).join("");
  }

  function loadThumbs() {
    S.getGallery().forEach(function (g) {
      if (g.type === "idb" && g.id && !thumbURLs[g.id]) {
        S.getFile(g.id).then(function (blob) {
          if (!blob) return;
          thumbURLs[g.id] = URL.createObjectURL(blob);
          renderGallery();
        });
      }
    });
  }

  galleryListEl.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-del-gallery]");
    if (!btn) return;
    var id = btn.getAttribute("data-del-gallery");
    S.removeGalleryItem(id);
    S.deleteFile(id).then(function () {
      delete thumbURLs[id];
      renderGallery();
    }).catch(function () {
      renderGallery();
    });
    toast("تم حذف الصورة");
  });

  /* ===== إضافة صور ===== */
  document.getElementById("galleryForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var label = document.getElementById("gLabel").value.trim();
    var cat = document.getElementById("gCat").value;
    var files = document.getElementById("gFiles").files;
    if (!files.length) { toast("اختر صورًا أولًا", true); return; }

    var promises = [];
    Array.from(files).forEach(function (file) {
      var id = S.uid();
      promises.push(
        S.saveFile(id, file).then(function () {
          S.addGalleryItem({ id: id, label: label || file.name, cat: cat, type: "idb", src: id });
        })
      );
    });

    Promise.all(promises).then(function () {
      document.getElementById("gLabel").value = "";
      document.getElementById("gFiles").value = "";
      toast("تمت إضافة " + files.length + " صورة");
      loadThumbs();
      renderGallery();
    }).catch(function () {
      toast("فشل حفظ بعض الصور — تأكد من حجم الملفات", true);
      renderGallery();
    });
  });

  /* ===== نسخ احتياطي ===== */
  document.getElementById("exportBtn").addEventListener("click", function () {
    var data = S.exportData();
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "hossam-aburima-backup.json";
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 3000);
    toast("تم تنزيل النسخة الاحتياطية");
  });

  document.getElementById("importBtn").addEventListener("click", function () {
    var input = document.getElementById("importInput");
    if (!input.files.length) { toast("اختر ملف النسخة الاحتياطية أولًا", true); return; }
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        S.importData(data);
        toast("تم استيراد البيانات بنجاح");
        renderVideos();
        renderGallery();
      } catch (err) {
        toast("ملف غير صالح", true);
      }
    };
    reader.readAsText(input.files[0]);
  });

  renderVideos();
  renderGallery();
  loadThumbs();
})();
