(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  var els = {
    wechat: $('wechat'), alipay: $('alipay'),
    wechatFile: $('wechatFile'), alipayFile: $('alipayFile'),
    siteBase: $('siteBase'), nickname: $('nickname'),
    wechatImg: $('wechatImg'), alipayImg: $('alipayImg'),
    build: $('buildBtn'), reset: $('resetBtn'),
    status: $('status'), result: $('resultPanel'),
    canvas: $('qrCanvas'), link: $('resultLink'),
    copy: $('copyBtn'), download: $('downloadBtn'),
    testWx: $('testWx'), testAli: $('testAli'), testOther: $('testOther')
  };

  var currentUrl = '';

  function setStatus(msg, kind) {
    els.status.textContent = msg || '';
    els.status.className = 'status' + (kind ? ' ' + kind : '');
  }

  function initBase() {
    if (/^https?:$/.test(location.protocol)) {
      var dir = location.pathname.replace(/\/[^/]*$/, '');
      els.siteBase.value = location.origin + (dir === '/' ? '' : dir);
    }
  }

  function base64urlEncode(str) {
    var bytes = unescape(encodeURIComponent(str));
    return btoa(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function normalizeUrl(raw) {
    var v = String(raw || '').trim();
    if (!v) return '';
    // 用户粘贴二维码内容时可能带空白和换行
    return v.replace(/\s+/g, '');
  }

  function decodeImageFile(file, inputEl) {
    if (!file) return;
    setStatus('正在识别图片里的收款码…');
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        try {
          var scale = Math.min(1, 2400 / Math.max(img.width, img.height));
          var w = Math.round(img.width * scale);
          var h = Math.round(img.height * scale);
          var c = document.createElement('canvas');
          c.width = w; c.height = h;
          var ctx = c.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, w, h);
          var data = ctx.getImageData(0, 0, w, h);
          var code = window.jsQR(data.data, w, h, { inversionAttempts: 'dontInvert' }) ||
                     window.jsQR(data.data, w, h, { inversionAttempts: 'attemptBoth' });
          if (!code || !code.data) {
            setStatus('没识别出来，请换一张清晰的收款码截图，或手动粘贴链接。', 'err');
            return;
          }
          inputEl.value = code.data.trim();
          setStatus('识别成功，已填入输入框。', 'ok');
        } catch (err) {
          setStatus('识别失败：' + err.message, 'err');
        }
      };
      img.onerror = function () { setStatus('图片读取失败。', 'err'); };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function drawQr(text) {
    var qr;
    try {
      qr = window.qrcode(0, 'M');
      qr.addData(text);
      qr.make();
    } catch (e) {
      throw new Error('链接太长，二维码装不下。试试去掉图片地址、缩短链接或备注。');
    }
    var count = qr.getModuleCount();
    var quiet = 4;
    var total = count + quiet * 2;
    var size = 320;
    var cell = size / total;
    var ctx = els.canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#111111';
    for (var r = 0; r < count; r++) {
      for (var c = 0; c < count; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect(Math.floor((c + quiet) * cell), Math.floor((r + quiet) * cell),
            Math.ceil(cell), Math.ceil(cell));
        }
      }
    }
  }

  function build() {
    var w = normalizeUrl(els.wechat.value);
    var a = normalizeUrl(els.alipay.value);
    var base = normalizeUrl(els.siteBase.value).replace(/\/+$/, '');

    if (!/^https?:\/\//i.test(base)) {
      setStatus('请填写站点地址，必须以 http:// 或 https:// 开头。', 'err');
      return;
    }
    if (!w && !a) {
      setStatus('至少填写一个收款码链接。', 'err');
      return;
    }

    var cfg = {};
    if (w) cfg.w = w;
    if (a) cfg.a = a;
    if (els.nickname.value.trim()) cfg.n = els.nickname.value.trim();
    if (normalizeUrl(els.wechatImg.value)) cfg.wi = normalizeUrl(els.wechatImg.value);
    if (normalizeUrl(els.alipayImg.value)) cfg.ai = normalizeUrl(els.alipayImg.value);

    var payload = base64urlEncode(JSON.stringify(cfg));
    var url = base + '/go.html?d=' + payload;

    try {
      drawQr(url);
    } catch (e) {
      setStatus(e.message, 'err');
      return;
    }

    currentUrl = url;
    els.link.value = url;
    var sep = url.indexOf('?') !== -1 ? '&' : '?';
    els.testWx.href = url + sep + 'force=wechat&noauto=1';
    els.testAli.href = url + sep + 'force=alipay&noauto=1';
    els.testOther.href = url + sep + 'force=other&noauto=1';
    els.result.hidden = false;
    setStatus('生成完成。', 'ok');
    els.result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function copyLink() {
    if (!currentUrl) return;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(currentUrl).then(function () {
        setStatus('链接已复制。', 'ok');
      }, fallback);
    } else {
      fallback();
    }
    function fallback() {
      els.link.select();
      document.execCommand('copy');
      setStatus('链接已复制。', 'ok');
    }
  }

  function download() {
    if (!currentUrl) return;
    var a = document.createElement('a');
    a.download = '一码通-收款码.png';
    a.href = els.canvas.toDataURL('image/png');
    a.click();
  }

  els.build.addEventListener('click', build);
  els.copy.addEventListener('click', copyLink);
  els.download.addEventListener('click', download);
  els.wechatFile.addEventListener('change', function (e) { decodeImageFile(e.target.files[0], els.wechat); });
  els.alipayFile.addEventListener('change', function (e) { decodeImageFile(e.target.files[0], els.alipay); });
  els.reset.addEventListener('click', function () {
    ['wechat', 'alipay', 'nickname', 'wechatImg', 'alipayImg'].forEach(function (id) { els[id].value = ''; });
    els.result.hidden = true;
    currentUrl = '';
    setStatus('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  initBase();
})();
