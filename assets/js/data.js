/* ============================================================
   طبقة التخزين — الفيديوهات والمعرض
   الفيديوهات وبيانات المعرض تُخزَّن في localStorage
   الملفات المرفوعة (صور/فيديو) تُخزَّن في IndexedDB كـ Blob
   ============================================================ */
(function (global) {
  var VIDEOS_KEY = "ha_videos_v1";
  var GALLERY_KEY = "ha_gallery_v1";

  function uid() {
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function readList(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
      return [];
    }
  }

  function writeList(key, list) {
    localStorage.setItem(key, JSON.stringify(list));
  }

  /* ---- IndexedDB ---- */
  var _dbPromise = null;
  function openDB() {
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise(function (resolve, reject) {
      var req = indexedDB.open("ha_media", 1);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains("files")) {
          db.createObjectStore("files");
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
    return _dbPromise;
  }

  function saveFile(id, blob) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction("files", "readwrite");
        tx.objectStore("files").put(blob, id);
        tx.oncomplete = function () { resolve(id); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  function getFile(id) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction("files", "readonly");
        var req = tx.objectStore("files").get(id);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  function deleteFile(id) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction("files", "readwrite");
        tx.objectStore("files").delete(id);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  /* ---- الفيديوهات ---- */
  function getVideos() {
    return readList(VIDEOS_KEY);
  }

  function addVideo(video) {
    var list = getVideos();
    video.id = video.id || uid();
    video.date = video.date || new Date().toISOString();
    list.unshift(video);
    writeList(VIDEOS_KEY, list);
    return video;
  }

  function removeVideo(id) {
    var list = getVideos().filter(function (v) { return v.id !== id; });
    writeList(VIDEOS_KEY, list);
    var removed = getVideos();
    var _unused = removed;
  }

  /* ---- المعرض ---- */
  function getGallery() {
    return readList(GALLERY_KEY);
  }

  function addGalleryItem(item) {
    var list = getGallery();
    item.id = item.id || uid();
    item.date = item.date || new Date().toISOString();
    list.unshift(item);
    writeList(GALLERY_KEY, list);
    return item;
  }

  function removeGalleryItem(id) {
    var list = getGallery().filter(function (g) { return g.id !== id; });
    writeList(GALLERY_KEY, list);
  }

  /* ---- تصدير / استيراد ---- */
  function exportData() {
    return {
      videos: getVideos(),
      gallery: getGallery()
    };
  }

  function importData(data) {
    if (data && Array.isArray(data.videos)) {
      localStorage.setItem(VIDEOS_KEY, JSON.stringify(data.videos));
    }
    if (data && Array.isArray(data.gallery)) {
      localStorage.setItem(GALLERY_KEY, JSON.stringify(data.gallery));
    }
  }

  /* ---- أدوات عامة ---- */
  function youtubeId(url) {
    var m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
    return m ? m[1] : null;
  }

  global.HAStorage = {
    uid: uid,
    getVideos: getVideos,
    addVideo: addVideo,
    removeVideo: removeVideo,
    getGallery: getGallery,
    addGalleryItem: addGalleryItem,
    removeGalleryItem: removeGalleryItem,
    saveFile: saveFile,
    getFile: getFile,
    deleteFile: deleteFile,
    exportData: exportData,
    importData: importData,
    youtubeId: youtubeId
  };
})(window);
