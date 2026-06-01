document.addEventListener('DOMContentLoaded', function () {
  const STORAGE_KEYS = {
    profile: 'pos.profile',
    history: 'pos.history',
    quickProducts: 'pos.quickProducts',
    store: 'pos.store',
    activeTransaction: 'pos.activeTransaction',
    onlineOrders: 'pos.onlineOrders',
    sheetEndpoint: 'pos.googleSheetEndpoint'
  };

  const DEFAULT_STORE = {
    nama: 'TOKO MODERN EGA',
    alamat: 'Jl. Raya Utama No. 123, Kelurahan Pusat, Kec. Kota',
    telp: '0812-3456-7890',
    npwp: '12.345.678.9-123.000'
  };

  const DEFAULT_PRODUK_CEPAT = [
    { nama: 'Kopi Susu', harga: 18000 },
    { nama: 'Cappuccino', harga: 22000 },
    { nama: 'Roti Bakar', harga: 16000 },
    { nama: 'Nasi Goreng', harga: 28000 },
    { nama: 'Es Teh Manis', harga: 8000 },
    { nama: 'Air Mineral', harga: 6000 }
  ];

  const DEFAULT_PAJAK_PERSEN = 11;

  const namaProduk = document.getElementById('namaProduk');
  const hargaProduk = document.getElementById('hargaProduk');
  const qtyProduk = document.getElementById('qtyProduk');
  const namaKasirEl = document.getElementById('namaKasir');
  const namaPelangganEl = document.getElementById('namaPelanggan');
  const namaTokoEl = document.getElementById('namaToko');
  const alamatTokoEl = document.getElementById('alamatToko');
  const telpTokoEl = document.getElementById('telpToko');
  const npwpTokoEl = document.getElementById('npwpToko');
  const diskonPersenEl = document.getElementById('diskonPersen');
  const pajakPersenEl = document.getElementById('pajakPersen');
  const metodeBayarEl = document.getElementById('metodeBayar');
  const quickProductsEl = document.getElementById('quickProducts');
  const tbodyKeranjang = document.getElementById('tbodyKeranjang');
  const totalItemEl = document.getElementById('totalItem');
  const totalBayarEl = document.getElementById('totalBayar');
  const totalTransaksiHariIniEl = document.getElementById('totalTransaksiHariIni');
  const omzetHariIniEl = document.getElementById('omzetHariIni');
  const uangBayarEl = document.getElementById('uangBayar');
  const kembalianEl = document.getElementById('kembalian');
  const subtotalViewEl = document.getElementById('subtotalView');
  const diskonViewEl = document.getElementById('diskonView');
  const pajakViewEl = document.getElementById('pajakView');
  const grandTotalViewEl = document.getElementById('grandTotalView');
  const statusTransaksiEl = document.getElementById('statusTransaksi');
  const infoTransaksiEl = document.getElementById('infoTransaksi');
  const tanggalHariEl = document.getElementById('tanggalHari');
  const riwayatTransaksiEl = document.getElementById('riwayatTransaksi');
  const btnHapusSemuaRiwayat = document.getElementById('btnHapusSemuaRiwayat');
  const btnDummyOnlineOrder = document.getElementById('btnDummyOnlineOrder');
  const onlineOrdersListEl = document.getElementById('onlineOrdersList');
  const onlineOrderCountEl = document.getElementById('onlineOrderCount');
  const onlineOrderStatusEl = document.getElementById('onlineOrderStatus');
  const googleSheetEndpointEl = document.getElementById('googleSheetEndpoint');
  const sheetSyncStatusEl = document.getElementById('sheetSyncStatus');
  const toastEl = document.getElementById('toast');
  const cashPaymentFieldsEl = document.getElementById('cashPaymentFields');
  const uangBayarFieldEl = document.getElementById('uangBayarField');
  const kembalianFieldEl = document.getElementById('kembalianField');
  const detailStrukRows = document.getElementById('detailStrukRows');
  const strukTotalItem = document.getElementById('strukTotalItem');
  const strukSubtotal = document.getElementById('strukSubtotal');
  const strukDiskon = document.getElementById('strukDiskon');
  const strukPajak = document.getElementById('strukPajak');
  const strukTotal = document.getElementById('strukTotal');
  const strukBayarRow = document.getElementById('strukBayarRow');
  const strukBayar = document.getElementById('strukBayar');
  const strukKembaliRow = document.getElementById('strukKembaliRow');
  const strukKembali = document.getElementById('strukKembali');
  const nomorTransaksi = document.getElementById('nomorTransaksi');
  const tanggalTransaksi = document.getElementById('tanggalTransaksi');
  const strukKasir = document.getElementById('strukKasir');
  const strukPelanggan = document.getElementById('strukPelanggan');
  const strukMetodeBayar = document.getElementById('strukMetodeBayar');
  const diskonPersenStruk = document.getElementById('diskonPersenStruk');
  const strukPajakLabel = document.getElementById('strukPajakLabel');

  const btnTambah = document.getElementById('btnTambah');
  const btnSimpanProduk = document.getElementById('btnSimpanProduk');
  const btnReset = document.getElementById('btnReset');
  const btnCetak = document.getElementById('btnCetak');
  const btnSimpanEndpoint = document.getElementById('btnSimpanEndpoint');
  const btnTarikPesananSheets = document.getElementById('btnTarikPesananSheets');
  const btnKirimProdukSheets = document.getElementById('btnKirimProdukSheets');

  let keranjang = [];
  let riwayatTransaksi = normalisasiRiwayat(loadJSON(STORAGE_KEYS.history, []));
  let produkCepat = normalisasiProdukCepat(loadJSON(STORAGE_KEYS.quickProducts, DEFAULT_PRODUK_CEPAT));
  let onlineOrders = normalisasiOnlineOrders(loadJSON(STORAGE_KEYS.onlineOrders, []));
  let storeConfig = { ...DEFAULT_STORE };
  let sumberTransaksi = 'kasir';
  let activeOnlineOrderId = null;
  let googleSheetEndpoint = String(localStorage.getItem(STORAGE_KEYS.sheetEndpoint) || '').trim();
  let toastTimer;

  let editingIndex = null;

  const formatRupiah = (angka) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(angka || 0);

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function simpanJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalisasiProdukCepat(items) {
    if (!Array.isArray(items)) return [...DEFAULT_PRODUK_CEPAT];

    return items
      .map((item) => ({
        nama: String(item?.nama || '').trim(),
        harga: Number(item?.harga)
      }))
      .filter((item) => item.nama && Number.isFinite(item.harga) && item.harga > 0);
  }

  function normalisasiRiwayat(items) {
    if (!Array.isArray(items)) return [];

    return items
      .map((item) => ({
        nomor: String(item?.nomor || '').trim(),
        waktu: String(item?.waktu || ''),
        pelanggan: String(item?.pelanggan || 'Pelanggan Umum').trim(),
        kasir: String(item?.kasir || 'Kasir Utama').trim(),
        sumberTransaksi: String(item?.sumberTransaksi || 'kasir').trim(),
        orderId: item?.orderId ? String(item.orderId).trim() : null,
        metodeBayar: String(item?.metodeBayar || 'Tunai').trim(),
        totalItem: Number(item?.totalItem || 0),
        subtotal: Number(item?.subtotal || 0),
        diskon: Number(item?.diskon || 0),
        pajak: Number(item?.pajak || 0),
        grandTotal: Number(item?.grandTotal || 0),
        items: Array.isArray(item?.items) ? item.items : []
      }))
      .filter(
        (item) =>
          item.nomor &&
          item.waktu &&
          Number.isFinite(item.totalItem) &&
          Number.isFinite(item.grandTotal)
      );
  }

  function normalisasiOnlineOrders(items) {
    if (!Array.isArray(items)) return [];

    return items
      .map((item) => ({
        id: String(item?.id || '').trim(),
        customerName: String(item?.customerName || 'Pelanggan Online').trim(),
        source: String(item?.source || 'Website').trim(),
        note: String(item?.note || '-').trim(),
        createdAt: String(item?.createdAt || new Date().toISOString()),
        status: String(item?.status || 'baru').trim(),
        paymentStatus: String(item?.paymentStatus || item?.payment_status || 'belum dibayar').trim(),
        items: Array.isArray(item?.items)
          ? item.items
              .map((orderItem) => ({
                nama: String(orderItem?.nama || '').trim(),
                harga: Number(orderItem?.harga),
                qty: Number(orderItem?.qty)
              }))
              .filter(
                (orderItem) =>
                  orderItem.nama &&
                  Number.isFinite(orderItem.harga) &&
                  orderItem.harga > 0 &&
                  Number.isFinite(orderItem.qty) &&
                  orderItem.qty > 0
              )
          : []
      }))
      .filter((item) => item.id && item.customerName && item.items.length > 0);
  }

  function simpanProdukCepat() {
    simpanJSON(STORAGE_KEYS.quickProducts, produkCepat);
  }

  function simpanOnlineOrders() {
    simpanJSON(STORAGE_KEYS.onlineOrders, onlineOrders);
  }

  function getGoogleSheetEndpoint() {
    return String(googleSheetEndpointEl?.value || googleSheetEndpoint || '').trim();
  }

  function setSheetSyncStatus(message, isError = false) {
    if (!sheetSyncStatusEl) return;
    sheetSyncStatusEl.textContent = message;
    sheetSyncStatusEl.style.color = isError ? '#b42318' : '';
  }

  function simpanGoogleSheetEndpoint() {
    googleSheetEndpoint = getGoogleSheetEndpoint();
    if (!googleSheetEndpoint) {
      localStorage.removeItem(STORAGE_KEYS.sheetEndpoint);
      setSheetSyncStatus('URL Google Apps Script belum diisi.', true);
      tampilkanToast('Isi URL Google Apps Script dulu.');
      return false;
    }

    localStorage.setItem(STORAGE_KEYS.sheetEndpoint, googleSheetEndpoint);
    if (googleSheetEndpointEl) {
      googleSheetEndpointEl.value = googleSheetEndpoint;
    }
    setSheetSyncStatus('URL tersimpan. POS siap sinkron dengan Google Sheets.');
    tampilkanToast('URL Google Sheets tersimpan.');
    return true;
  }

  function pastikanEndpointSheets() {
    googleSheetEndpoint = getGoogleSheetEndpoint();
    if (!googleSheetEndpoint) {
      setSheetSyncStatus('Isi URL Google Apps Script Web App dulu.', true);
      tampilkanToast('Isi URL Google Apps Script dulu.');
      return false;
    }
    return true;
  }

  function requestSheets(action, data = {}) {
    if (!pastikanEndpointSheets()) return Promise.resolve(false);

    return fetch(googleSheetEndpoint, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        action,
        source: 'pos',
        payload: data
      })
    }).then(() => true);
  }

  function readSheets(action) {
    if (!pastikanEndpointSheets()) return Promise.resolve(null);

    return new Promise((resolve, reject) => {
      const callbackName = `posSheetsCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const script = document.createElement('script');
      let url;
      try {
        url = new URL(googleSheetEndpoint);
      } catch (error) {
        reject(new Error('URL Google Apps Script tidak valid.'));
        return;
      }
      url.searchParams.set('action', action);
      url.searchParams.set('callback', callbackName);
      url.searchParams.set('_', Date.now().toString());

      const cleanup = () => {
        delete window[callbackName];
        script.remove();
      };

      const timer = window.setTimeout(() => {
        cleanup();
        reject(new Error('Timeout saat membaca Google Sheets.'));
      }, 12000);

      window[callbackName] = (response) => {
        window.clearTimeout(timer);
        cleanup();
        resolve(response);
      };

      script.onerror = () => {
        window.clearTimeout(timer);
        cleanup();
        reject(new Error('Gagal memuat data Google Sheets.'));
      };

      script.src = url.toString();
      document.body.appendChild(script);
    });
  }

  function gabungkanPesananOnline(pesananSheets) {
    const incoming = normalisasiOnlineOrders(pesananSheets);
    const orderMap = new Map();

    [...incoming, ...onlineOrders].forEach((order) => {
      if (!orderMap.has(order.id)) {
        orderMap.set(order.id, order);
      }
    });

    onlineOrders = Array.from(orderMap.values()).slice(0, 50);
    simpanOnlineOrders();
    renderOnlineOrders();
    return incoming.length;
  }

  function tarikPesananDariSheets() {
    setSheetSyncStatus('Mengambil pesanan dari Google Sheets...');
    return readSheets('getOrders')
      .then((response) => {
        if (!response || response.ok === false) {
          throw new Error(response?.message || 'Google Sheets tidak mengirim data pesanan.');
        }
        const count = gabungkanPesananOnline(response.orders || []);
        setSheetSyncStatus(`${count} pesanan dibaca dari Google Sheets.`);
        tampilkanToast('Pesanan dari Google Sheets sudah dimuat.');
      })
      .catch((error) => {
        setSheetSyncStatus(error.message, true);
        tampilkanToast('Gagal membaca Google Sheets.');
      });
  }

  function kirimProdukKeSheets() {
    setSheetSyncStatus('Mengirim produk favorit ke Google Sheets...');
    return requestSheets('upsertProducts', { products: produkCepat })
      .then((ok) => {
        if (!ok) return;
        setSheetSyncStatus(`${produkCepat.length} produk dikirim ke Google Sheets.`);
        tampilkanToast('Produk favorit dikirim ke Google Sheets.');
      })
      .catch(() => {
        setSheetSyncStatus('Gagal mengirim produk ke Google Sheets.', true);
        tampilkanToast('Gagal mengirim produk.');
      });
  }

  function kirimTransaksiKeSheets(transaksi) {
    if (!getGoogleSheetEndpoint()) return Promise.resolve(false);
    if (!pastikanEndpointSheets()) return Promise.resolve(false);
    setSheetSyncStatus('Mengirim transaksi ke Google Sheets...');
    return requestSheets('addTransaction', { transaction: transaksi })
      .then((ok) => {
        if (ok) {
          setSheetSyncStatus(`Transaksi ${transaksi.nomor} dikirim ke Google Sheets.`);
        }
        return ok;
      })
      .catch(() => {
        setSheetSyncStatus('Transaksi tersimpan lokal, tetapi gagal dikirim ke Google Sheets.', true);
        return false;
      });
  }

  function tandaiPesananSelesaiDiSheets(orderId, nomorTransaksi) {
    if (!googleSheetEndpoint || !orderId) return;
    requestSheets('markOrderDone', { orderId, nomorTransaksi }).catch(() => {});
  }

  function muatOnlineOrders() {
    onlineOrders = normalisasiOnlineOrders(loadJSON(STORAGE_KEYS.onlineOrders, []));
    renderOnlineOrders();
  }

  function simpanTransaksiAktif() {
    if (
      keranjang.length === 0 &&
      sumberTransaksi === 'kasir' &&
      getPersentase(diskonPersenEl) === 0 &&
      getPersentase(pajakPersenEl) === DEFAULT_PAJAK_PERSEN &&
      !uangBayarEl.value
    ) {
      hapusTransaksiAktif();
      return;
    }

    simpanJSON(STORAGE_KEYS.activeTransaction, {
      keranjang,
      sumberTransaksi,
      activeOnlineOrderId,
      diskonPersen: getPersentase(diskonPersenEl),
      pajakPersen: getPersentase(pajakPersenEl),
      uangBayar: Number(uangBayarEl.value || 0)
    });
  }

  function hapusTransaksiAktif() {
    localStorage.removeItem(STORAGE_KEYS.activeTransaction);
  }

  function muatTransaksiAktif() {
    const transaksiAktif = loadJSON(STORAGE_KEYS.activeTransaction, null);
    if (!transaksiAktif || typeof transaksiAktif !== 'object') return;

    if (Array.isArray(transaksiAktif.keranjang)) {
      keranjang = transaksiAktif.keranjang
        .map((item) => ({
          nama: String(item?.nama || '').trim(),
          harga: Number(item?.harga),
          qty: Number(item?.qty)
        }))
        .filter(
          (item) =>
            item.nama &&
            Number.isFinite(item.harga) &&
            item.harga > 0 &&
            Number.isFinite(item.qty) &&
            item.qty > 0
        );
    }

    sumberTransaksi = transaksiAktif.sumberTransaksi === 'web' ? 'web' : 'kasir';
    activeOnlineOrderId = transaksiAktif.activeOnlineOrderId || null;
    diskonPersenEl.value = String(
      Math.min(Math.max(Number(transaksiAktif.diskonPersen || 0), 0), 100)
    );
    pajakPersenEl.value = String(
      Math.min(Math.max(Number(transaksiAktif.pajakPersen || DEFAULT_PAJAK_PERSEN), 0), 100)
    );
    uangBayarEl.value = transaksiAktif.uangBayar ? String(Number(transaksiAktif.uangBayar)) : '';
    sinkronkanModePembayaran();
  }

  function escapeHTML(text) {
    return String(text).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function getPersentase(el, max = 100) {
    const value = Number(el.value || 0);
    if (!Number.isFinite(value)) return 0;
    return Math.min(Math.max(value, 0), max);
  }

  function getRingkasanBelanja() {
    const subtotal = keranjang.reduce((sum, item) => sum + item.harga * item.qty, 0);
    const diskonPersen = getPersentase(diskonPersenEl);
    const pajakPersen = getPersentase(pajakPersenEl);
    const diskon = Math.round(subtotal * (diskonPersen / 100));
    const dasarPajak = Math.max(subtotal - diskon, 0);
    const pajak = Math.round(dasarPajak * (pajakPersen / 100));
    const grandTotal = dasarPajak + pajak;
    const totalItem = keranjang.reduce((sum, item) => sum + item.qty, 0);

    return {
      subtotal,
      diskon,
      pajak,
      grandTotal,
      totalItem,
      diskonPersen,
      pajakPersen
    };
  }

  function tampilkanToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2400);
  }

  function simpanStore() {
    simpanJSON(STORAGE_KEYS.store, storeConfig);
  }

  function muatStore() {
    storeConfig = { ...DEFAULT_STORE, ...loadJSON(STORAGE_KEYS.store, {}) };
  }

  function simpanProfil() {
    simpanJSON(STORAGE_KEYS.profile, {
      namaKasir: namaKasirEl.value.trim(),
      namaPelanggan: namaPelangganEl.value.trim(),
      metodeBayar: metodeBayarEl.value
    });

    storeConfig.nama = namaTokoEl.value.trim() || DEFAULT_STORE.nama;
    storeConfig.alamat = alamatTokoEl.value.trim() || DEFAULT_STORE.alamat;
    storeConfig.telp = telpTokoEl.value.trim() || DEFAULT_STORE.telp;
    storeConfig.npwp = npwpTokoEl.value.trim() || DEFAULT_STORE.npwp;
    simpanStore();
  }

  function muatProfil() {
    const profile = loadJSON(STORAGE_KEYS.profile, {});
    muatStore();

    namaKasirEl.value = profile.namaKasir || 'Kasir Utama';
    namaPelangganEl.value = profile.namaPelanggan || 'Pelanggan Umum';
    metodeBayarEl.value = profile.metodeBayar || 'Tunai';
    namaTokoEl.value = storeConfig.nama;
    alamatTokoEl.value = storeConfig.alamat;
    telpTokoEl.value = storeConfig.telp;
    npwpTokoEl.value = storeConfig.npwp;
  }

  function renderQuickProducts() {
    if (produkCepat.length === 0) {
      quickProductsEl.innerHTML = '<div class="history-empty">Belum ada produk favorit. Isi nama dan harga, lalu klik "Simpan ke Produk Favorit".</div>';
      return;
    }

    quickProductsEl.innerHTML = produkCepat
      .map(
        (item) => `
          <div class="quick-item" data-nama="${escapeHTML(item.nama)}" data-harga="${item.harga}" role="button" tabindex="0">
            <div class="quick-meta">
              <span>${escapeHTML(item.nama)}</span>
              <button type="button" class="quick-remove" data-hapus-quick="${escapeHTML(item.nama)}" title="Hapus produk">Hapus</button>
            </div>
            <strong>${formatRupiah(item.harga)}</strong>
          </div>
        `
      )
      .join('');
  }

  function updateMetrics() {
    const summary = getRingkasanBelanja();
    totalItemEl.textContent = String(summary.totalItem);
    totalBayarEl.textContent = formatRupiah(summary.grandTotal);
    subtotalViewEl.textContent = formatRupiah(summary.subtotal);
    diskonViewEl.textContent = formatRupiah(summary.diskon);
    pajakViewEl.textContent = formatRupiah(summary.pajak);
    grandTotalViewEl.textContent = formatRupiah(summary.grandTotal);

    if (keranjang.length === 0) {
      statusTransaksiEl.textContent = 'Menunggu Item';
      infoTransaksiEl.textContent = 'Tambahkan produk untuk memulai transaksi baru';
      return;
    }

    statusTransaksiEl.textContent = 'Siap Checkout';
    infoTransaksiEl.textContent =
      sumberTransaksi === 'web'
        ? `${keranjang.length} produk aktif, pesanan web siap cetak struk QRIS`
        : `${keranjang.length} produk aktif, grand total ${formatRupiah(summary.grandTotal)}`;
  }

  function isTransaksiWeb() {
    return sumberTransaksi === 'web';
  }

  function sinkronkanModePembayaran() {
    const isQrisPayment = metodeBayarEl.value === 'QRIS';
    const summary = getRingkasanBelanja();

    if (cashPaymentFieldsEl) {
      cashPaymentFieldsEl.style.display = isQrisPayment ? 'none' : '';
    }

    if (uangBayarFieldEl) {
      uangBayarFieldEl.hidden = isQrisPayment;
    }

    if (kembalianFieldEl) {
      kembalianFieldEl.hidden = isQrisPayment;
    }

    if (isTransaksiWeb()) {
      metodeBayarEl.value = 'QRIS';
    }

    if (metodeBayarEl.value === 'QRIS') {
      uangBayarEl.value = String(summary.grandTotal);
      kembalianEl.value = formatRupiah(0);
    } else if (!uangBayarEl.value) {
      kembalianEl.value = formatRupiah(0);
    }

    updateMetrics();
  }

  function renderKeranjang() {
    tbodyKeranjang.innerHTML = '';

    if (keranjang.length === 0) {
      tbodyKeranjang.innerHTML =
        '<tr class="empty-state"><td colspan="5">Belum ada item di keranjang. Tambahkan produk untuk memulai transaksi.</td></tr>';
    } else {
      keranjang.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <strong>${escapeHTML(item.nama)}</strong>
            <div class="table-subtitle">${formatRupiah(item.harga)} per item</div>
          </td>
          <td class="qty-controls" style="text-align: center; white-space: nowrap;">
            <button type="button" class="ghost" data-qty-minus="${index}" aria-label="Kurangi Kuantitas" style="padding: 0.2em 0.6em;">−</button>
            <span style="display: inline-block; width: 2em; text-align: center;">${item.qty}</span>
            <button type="button" class="ghost" data-qty-plus="${index}" aria-label="Tambah Kuantitas" style="padding: 0.2em 0.6em;">+</button>
          </td>
          <td>${formatRupiah(item.harga)}</td>
          <td>${formatRupiah(item.harga * item.qty)}</td>
          <td class="table-actions">
            <button type="button" class="ghost btn-row" data-edit="${index}">Edit</button>
            <button type="button" class="secondary btn-row" data-hapus="${index}">Hapus</button>
          </td>
        `;
        tbodyKeranjang.appendChild(tr);
      });
    }

    sinkronkanModePembayaran();
    simpanTransaksiAktif();
  }

  function renderRiwayat() {
    const today = new Date().toLocaleDateString('id-ID');
    const transaksiHariIni = riwayatTransaksi.filter(
      (trx) => new Date(trx.waktu).toLocaleDateString('id-ID') === today
    );
    const omzetHariIni = transaksiHariIni.reduce((sum, trx) => sum + trx.grandTotal, 0);

    totalTransaksiHariIniEl.textContent = String(transaksiHariIni.length);
    omzetHariIniEl.textContent = `Omzet hari ini ${formatRupiah(omzetHariIni)}`;

    riwayatTransaksiEl.classList.remove('expanded');

    if (riwayatTransaksi.length === 0) {
      riwayatTransaksiEl.innerHTML =
        '<div class="history-empty">Belum ada transaksi tersimpan. Cetak struk pertama untuk mulai membangun histori penjualan.</div>';
      return;
    }

    const createHistoryItemHTML = (trx) => `
      <article class="history-item">
        <div>
          <strong>${escapeHTML(trx.nomor)}</strong>
          <p>${escapeHTML(trx.pelanggan)} &middot; ${escapeHTML(trx.metodeBayar)}</p>
        </div>
        <div class="history-meta">
          <strong>${formatRupiah(trx.grandTotal)}</strong>
          <p>${new Date(trx.waktu).toLocaleString('id-ID')}</p>
        </div>
      </article>
    `;

    const top3Transactions = riwayatTransaksi.slice(0, 3);
    const olderTransactions = riwayatTransaksi.slice(3);

    let html = top3Transactions.map(createHistoryItemHTML).join('');

    if (olderTransactions.length > 0) {
      html += `<div id="riwayatLama" class="riwayat-collapsible">`;
      html += olderTransactions.map(createHistoryItemHTML).join('');
      html += `</div>`;
      html += `<button type="button" id="btnToggleRiwayat" class="link-button">Tampilkan Semua (${olderTransactions.length} lainnya)</button>`;
    }

    riwayatTransaksiEl.innerHTML = html;
  }

  function getOnlineOrderTotal(order) {
    return order.items.reduce((sum, item) => sum + item.harga * item.qty, 0);
  }

  function renderOnlineOrders() {
    onlineOrderCountEl.textContent = String(onlineOrders.length);
    onlineOrderStatusEl.textContent =
      onlineOrders.length > 0 ? `${onlineOrders.length} pesanan menunggu` : 'Belum Ada Pesanan';

    if (onlineOrders.length === 0) {
      onlineOrdersListEl.innerHTML =
        '<div class="history-empty">Belum ada pesanan online. Klik "Tambah Dummy Pesanan" untuk simulasi menu ini.</div>';
      return;
    }

    onlineOrdersListEl.innerHTML = onlineOrders
      .map((order) => {
        const totalItem = order.items.reduce((sum, item) => sum + item.qty, 0);
        const lines = order.items
          .map((item) => `${escapeHTML(item.nama)} x${item.qty} - ${formatRupiah(item.harga * item.qty)}`)
          .join('<br>');

        return `
          <article class="history-item online-item">
            <div>
              <div class="online-item-header">
                <strong>${escapeHTML(order.customerName)}</strong>
                <span class="order-chip">${escapeHTML(order.source)}</span>
              </div>
              <p class="online-item-meta">
                ID: ${escapeHTML(order.id)} &middot; ${new Date(order.createdAt).toLocaleString('id-ID')}
              </p>
              <p class="online-item-meta">Status bayar: ${escapeHTML(order.paymentStatus || '-')} &middot; Catatan: ${escapeHTML(order.note || '-')}</p>
              <div class="online-item-lines">${lines}</div>
            </div>
            <div class="online-item-actions">
              <strong>${formatRupiah(getOnlineOrderTotal(order))}</strong>
              <span class="order-chip">${totalItem} item</span>
              <button type="button" class="ghost" data-ambil-online="${escapeHTML(order.id)}">Ambil ke Keranjang</button>
              <button type="button" class="secondary" data-hapus-online="${escapeHTML(order.id)}">Hapus</button>
            </div>
          </article>
        `;
      })
      .join('');
  }

  function buatDummyOnlineOrder() {
    const timestamp = Date.now();
    const samples = [
      {
        customerName: 'Order Web - Meja 2',
        source: 'Website',
        note: 'Tanpa sambal',
        items: [
          { nama: 'Nasi Goreng', harga: 28000, qty: 1 },
          { nama: 'Es Teh Manis', harga: 8000, qty: 2 }
        ]
      },
      {
        customerName: 'Order Online - Budi',
        source: 'WhatsApp',
        note: 'Ambil jam 19:00',
        items: [
          { nama: 'Kopi Susu', harga: 18000, qty: 2 },
          { nama: 'Roti Bakar', harga: 16000, qty: 1 }
        ]
      }
    ];

    const sample = samples[timestamp % samples.length];
    onlineOrders.unshift({
      id: `ONL-${timestamp.toString().slice(-6)}`,
      customerName: sample.customerName,
      source: sample.source,
      note: sample.note,
      createdAt: new Date().toISOString(),
      status: 'baru',
      paymentStatus: 'simulasi',
      items: sample.items
    });
    onlineOrders = onlineOrders.slice(0, 20);
    simpanOnlineOrders();
    renderOnlineOrders();
    tampilkanToast('Dummy pesanan online berhasil ditambahkan.');
  }

  function ambilOnlineOrderKeKeranjang(orderId) {
    const order = onlineOrders.find((item) => item.id === orderId);
    if (!order) return;

    order.items.forEach((orderItem) => {
      const existingItem = keranjang.find(
        (item) => item.nama.toLowerCase() === orderItem.nama.toLowerCase() && item.harga === orderItem.harga
      );

      if (existingItem) {
        existingItem.qty += orderItem.qty;
      } else {
        keranjang.push({
          nama: orderItem.nama,
          harga: orderItem.harga,
          qty: orderItem.qty
        });
      }
    });

    namaPelangganEl.value = order.customerName;
    sumberTransaksi = 'web';
    activeOnlineOrderId = order.id;
    metodeBayarEl.value = 'QRIS';
    onlineOrders = onlineOrders.filter((item) => item.id !== orderId);

    simpanOnlineOrders();
    simpanProfil();
    sinkronkanModePembayaran();
    renderOnlineOrders();
    renderKeranjang();
    tampilkanToast(`Pesanan online ${order.customerName} masuk ke keranjang.`);
  }

  function hapusOnlineOrder(orderId) {
    const totalSebelum = onlineOrders.length;
    onlineOrders = onlineOrders.filter((item) => item.id !== orderId);
    if (onlineOrders.length === totalSebelum) return;

    simpanOnlineOrders();
    renderOnlineOrders();
    tampilkanToast('Pesanan online dihapus.');
  }

  function hapusSemuaRiwayat() {
    if (riwayatTransaksi.length === 0) {
      tampilkanToast('Belum ada riwayat transaksi untuk dihapus.');
      return;
    }

    riwayatTransaksi = [];
    simpanJSON(STORAGE_KEYS.history, riwayatTransaksi);
    renderRiwayat();
    tampilkanToast('Semua riwayat transaksi berhasil dihapus.');
  }

  function resetInputProduk() {
    namaProduk.value = '';
    hargaProduk.value = '';
    qtyProduk.value = '1';
    namaProduk.focus();
  }

  function resetTransaksi() {
    if (editingIndex !== null) {
      batalEdit();
    }

    keranjang = [];
    sumberTransaksi = 'kasir';
    activeOnlineOrderId = null;
    uangBayarEl.value = '';
    kembalianEl.value = formatRupiah(0);
    diskonPersenEl.value = '0';
    pajakPersenEl.value = String(DEFAULT_PAJAK_PERSEN);
    metodeBayarEl.value = 'Tunai';
    hapusTransaksiAktif();
    sinkronkanModePembayaran();
    renderKeranjang();
    resetInputProduk();
  }

  function batalEdit() {
    editingIndex = null;
    btnTambah.textContent = 'Tambah ke Keranjang';
    const btnBatalEdit = document.getElementById('btnBatalEdit');
    if (btnBatalEdit) {
      btnBatalEdit.remove();
    }
    resetInputProduk();
  }

  function mulaiEditItem(index) {
    const item = keranjang[index];
    if (!item) return;

    if (editingIndex === null) {
      btnTambah.textContent = 'Update Item';
      const btnBatalEdit = document.createElement('button');
      btnBatalEdit.type = 'button';
      btnBatalEdit.id = 'btnBatalEdit';
      btnBatalEdit.className = 'secondary';
      btnBatalEdit.textContent = 'Batal';
      btnBatalEdit.addEventListener('click', batalEdit);
      btnTambah.insertAdjacentElement('afterend', btnBatalEdit);
    }

    editingIndex = index;
    namaProduk.value = item.nama;
    hargaProduk.value = item.harga;
    qtyProduk.value = item.qty;

    namaProduk.focus();
    namaProduk.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function tambahItem() {
    const nama = namaProduk.value.trim();
    const harga = Number(hargaProduk.value);
    const qty = Number(qtyProduk.value);

    if (!nama || !Number.isFinite(harga) || harga <= 0 || !Number.isFinite(qty) || qty < 1) {
      tampilkanToast('Isi nama produk, harga, dan qty dengan benar.');
      return;
    }

    if (editingIndex !== null) {
      keranjang[editingIndex] = { nama, harga, qty };
      renderKeranjang();
      tampilkanToast(`Item "${escapeHTML(nama)}" berhasil diupdate.`);
      batalEdit();
      return;
    }

    const itemExisting = keranjang.find(
      (item) => item.nama.toLowerCase() === nama.toLowerCase() && item.harga === harga
    );

    if (itemExisting) {
      itemExisting.qty += qty;
    } else {
      keranjang.push({ nama, harga, qty });
    }

    renderKeranjang();
    resetInputProduk();
    tampilkanToast(`${nama} masuk ke keranjang.`);
  }

  function simpanDariFormKeProdukCepat() {
    const nama = namaProduk.value.trim();
    const harga = Number(hargaProduk.value);

    if (!nama || !Number.isFinite(harga) || harga <= 0) {
      tampilkanToast('Isi nama produk dan harga yang valid untuk disimpan.');
      return;
    }

    const idx = produkCepat.findIndex((item) => item.nama.toLowerCase() === nama.toLowerCase());

    if (idx >= 0) {
      produkCepat[idx] = { nama, harga };
      tampilkanToast(`${nama} diperbarui di produk favorit.`);
    } else {
      produkCepat.unshift({ nama, harga });
      tampilkanToast(`${nama} disimpan ke produk favorit.`);
    }

    produkCepat = normalisasiProdukCepat(produkCepat).slice(0, 30);
    simpanProdukCepat();
    renderQuickProducts();
  }

  function hitungPembayaran() {
    const summary = getRingkasanBelanja();
    if (keranjang.length === 0) {
      statusTransaksiEl.textContent = 'Keranjang Kosong';
      infoTransaksiEl.textContent = 'Tambahkan minimal satu item sebelum pembayaran';
      tampilkanToast('Keranjang masih kosong.');
      return null;
    }

    if (metodeBayarEl.value === 'QRIS') {
      uangBayarEl.value = String(summary.grandTotal);
      kembalianEl.value = formatRupiah(0);
      statusTransaksiEl.textContent = 'Pembayaran QRIS Selesai';
      infoTransaksiEl.textContent = isTransaksiWeb()
        ? 'Pesanan web sudah dibayar pelanggan dan siap dicetak'
        : 'Pembayaran QRIS diterima, transaksi siap dicetak';
      return {
        ...summary,
        sumberTransaksi,
        uangBayar: summary.grandTotal,
        kembali: 0
      };
    }

    const uangBayar = Number(uangBayarEl.value || 0);
    const kembali = uangBayar - summary.grandTotal;

    if (kembali < 0) {
      kembalianEl.value = 'Uang kurang';
      statusTransaksiEl.textContent = 'Pembayaran Kurang';
      infoTransaksiEl.textContent = 'Nominal bayar belum mencukupi grand total transaksi';
      return null;
    }

    kembalianEl.value = formatRupiah(kembali);
    statusTransaksiEl.textContent = 'Pembayaran Valid';
    infoTransaksiEl.textContent = `Pembayaran ${metodeBayarEl.value} diterima, transaksi siap dicetak`;

    return {
      ...summary,
      sumberTransaksi,
      uangBayar,
      kembali
    };
  }

  function buatNomorTransaksi() {
    const now = new Date();
    const tanggal = now.toISOString().slice(0, 10).replace(/-/g, '');
    const waktu = now.getTime().toString().slice(-6);
    return `TRX-${tanggal}-${waktu}`;
  }

  function setText(element, text) {
    if (element) {
      element.textContent = text;
    }
  }

  function isiStruk(dataPembayaran, nomor) {
    const now = new Date();

    setText(document.getElementById('strukStoreNama'), storeConfig.nama);
    setText(document.getElementById('strukStoreAlamat'), storeConfig.alamat);
    setText(document.getElementById('strukStoreTelp'), storeConfig.telp);
    setText(document.getElementById('strukStoreNpwp'), `NPWP: ${storeConfig.npwp}`);
    setText(document.getElementById('strukStoreNamaFooter'), storeConfig.nama);
    setText(document.getElementById('strukStoreTelpFooter'), storeConfig.telp);

    setText(nomorTransaksi, `No. Transaksi: ${nomor}`);
    setText(tanggalTransaksi, `Tanggal: ${now.toLocaleString('id-ID')}`);
    setText(strukKasir, `Kasir: ${namaKasirEl.value.trim() || 'Kasir Utama'}`);
    setText(strukPelanggan, `Pelanggan: ${namaPelangganEl.value.trim() || 'Pelanggan Umum'}`);
    setText(strukMetodeBayar, `Metode Bayar: ${metodeBayarEl.value}`);
    setText(diskonPersenStruk, `${dataPembayaran.diskonPersen}%`);
    setText(strukPajakLabel, `Pajak/PPN (${dataPembayaran.pajakPersen}%)`);

    if (detailStrukRows) {
      detailStrukRows.innerHTML = keranjang
        .map(
          (item) => `
            <div class="item-line">
              <div class="item-line-row">
                <span class="item-name">${escapeHTML(item.nama)}</span>
                <span class="item-subtotal">${formatRupiah(item.harga * item.qty)}</span>
              </div>
              <small class="item-meta">${item.qty}x @${formatRupiah(item.harga)}</small>
            </div>
          `
        )
        .join('');
    }

    setText(strukTotalItem, String(dataPembayaran.totalItem));
    setText(strukSubtotal, formatRupiah(dataPembayaran.subtotal));
    setText(strukDiskon, formatRupiah(dataPembayaran.diskon));
    setText(strukPajak, formatRupiah(dataPembayaran.pajak));
    setText(strukTotal, formatRupiah(dataPembayaran.grandTotal));

    if (strukBayarRow) {
      strukBayarRow.style.display = dataPembayaran.sumberTransaksi === 'web' ? 'none' : '';
    }

    if (strukKembaliRow) {
      strukKembaliRow.style.display = dataPembayaran.sumberTransaksi === 'web' ? 'none' : '';
    }

    setText(strukBayar, formatRupiah(dataPembayaran.uangBayar));
    setText(strukKembali, formatRupiah(dataPembayaran.kembali));
  }

  function simpanRiwayat(dataPembayaran, nomor) {
    const transaksi = {
      nomor,
      waktu: new Date().toISOString(),
      pelanggan: namaPelangganEl.value.trim() || 'Pelanggan Umum',
      kasir: namaKasirEl.value.trim() || 'Kasir Utama',
      sumberTransaksi,
      orderId: activeOnlineOrderId,
      metodeBayar: metodeBayarEl.value,
      totalItem: dataPembayaran.totalItem,
      subtotal: dataPembayaran.subtotal,
      diskon: dataPembayaran.diskon,
      pajak: dataPembayaran.pajak,
      grandTotal: dataPembayaran.grandTotal,
      items: keranjang.map((item) => ({
        nama: item.nama,
        harga: item.harga,
        qty: item.qty,
        subtotal: item.harga * item.qty
      }))
    };

    riwayatTransaksi.unshift(transaksi);
    riwayatTransaksi = riwayatTransaksi.slice(0, 50);
    simpanJSON(STORAGE_KEYS.history, riwayatTransaksi);
    renderRiwayat();
    return transaksi;
  }

  function renderTanggalHari() {
    const now = new Date();
    tanggalHariEl.textContent = now.toLocaleString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function injectResponsiveStyles() {
    const style = document.createElement('style');
    style.textContent = `
      :root {
          --gap: 1rem;
          --card-padding: 1rem;
      }

      /* Asumsi struktur: <div class="app-container"> <main class="main-content">...</main> <aside class="sidebar">...</aside> </div> */
      /* Sesuaikan selector jika struktur HTML Anda berbeda. */

      .app-container {
          display: flex;
          flex-direction: column;
          padding: var(--gap);
          gap: var(--gap);
          max-width: 1400px;
          margin: 0 auto;
      }

      /* Untuk membuat beberapa kotak statistik berjajar */
      .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: var(--gap);
      }

      .main-content, .sidebar {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: var(--gap);
      }

      /* BARU: Untuk riwayat transaksi yang bisa ditoggle */
      .riwayat-collapsible {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease-out;
      }
      #riwayatTransaksi.expanded .riwayat-collapsible {
          max-height: 2000px; /* Cukup besar untuk menampung 47 item */
          transition: max-height 0.5s ease-in;
      }
      .link-button {
          background: none;
          border: none;
          color: var(--primary-color, #007bff);
          cursor: pointer;
          padding: 0.5rem 0;
          text-align: center;
          width: 100%;
          font-weight: 600;
          margin-top: 0.5rem;
      }
      
      .card {
          padding: var(--card-padding);
      }

      #productForm .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
      }

      #quickProducts {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 0.5rem;
      }

      .table-wrapper {
          overflow-x: auto;
      }

      @media (max-width: 767px) {
          /* Sembunyikan kolom harga satuan yang redundan di mobile */
          #transactionCart thead th:nth-child(3),
          #tbodyKeranjang td:nth-child(3) {
              display: none;
          }
      }

      @media (min-width: 768px) {
          #productForm .form-grid {
              grid-template-columns: 2fr 1fr 1fr auto;
              gap: 0.5rem;
              align-items: end;
          }
      }

      @media (min-width: 992px) {
          :root { --gap: 1.5rem; }
          .app-container {
              flex-direction: row;
              align-items: flex-start;
          }
          .main-content { flex: 2; min-width: 0; }
          .sidebar { flex: 1; position: sticky; top: var(--gap); }
      }

      @media print {
        body * { visibility: hidden; }
        #struk, #struk * { visibility: visible; }
        #struk { position: absolute; left: 0; top: 0; width: 100%; }
      }
    `;
    document.head.appendChild(style);
  }

  function groupMetricCards() {
    // Fungsi ini secara otomatis akan mengelompokkan beberapa kartu statistik
    // agar berjajar ke samping. Ini dilakukan dengan mencari kartu yang berisi
    // elemen-elemen tertentu dan membungkusnya dalam satu div.

    // Elemen 'jangkar' di dalam kartu yang ingin Anda kelompokkan
    const anchorElementIds = ['totalItem', 'statusTransaksi', 'totalTransaksiHariIni'];

    const cardsToGroup = anchorElementIds
      .map(id => document.getElementById(id)?.closest('.card'))
      .filter(card => card); // Filter null jika elemen/kartu tidak ditemukan

    // Hanya berjalan jika ada setidaknya 2 kartu untuk dikelompokkan
    if (cardsToGroup.length < 2) return;

    // Gunakan Set untuk memastikan setiap kartu unik
    const uniqueCards = [...new Set(cardsToGroup)];
    const parentContainer = uniqueCards[0].parentElement;

    if (!parentContainer) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'metrics-grid';

    parentContainer.insertBefore(wrapper, uniqueCards[0]);
    uniqueCards.forEach(card => wrapper.appendChild(card));
  }

  btnTambah.addEventListener('click', tambahItem);
  btnSimpanProduk.addEventListener('click', simpanDariFormKeProdukCepat);

  btnReset.addEventListener('click', () => {
    resetTransaksi();
    tampilkanToast('Transaksi aktif berhasil direset.');
  });
  btnHapusSemuaRiwayat.addEventListener('click', hapusSemuaRiwayat);
  btnDummyOnlineOrder.addEventListener('click', buatDummyOnlineOrder);
  btnSimpanEndpoint?.addEventListener('click', simpanGoogleSheetEndpoint);
  btnTarikPesananSheets?.addEventListener('click', tarikPesananDariSheets);
  btnKirimProdukSheets?.addEventListener('click', kirimProdukKeSheets);

  btnCetak.addEventListener('click', () => {
    const dataPembayaran = hitungPembayaran();
    if (!dataPembayaran) {
      tampilkanToast('Isi pembayaran lengkap dulu.');
      return;
    }

    const nomor = buatNomorTransaksi();
    isiStruk(dataPembayaran, nomor);
    simpanProfil();
    const transaksi = simpanRiwayat(dataPembayaran, nomor);
    kirimTransaksiKeSheets(transaksi);
    tandaiPesananSelesaiDiSheets(transaksi.orderId, nomor);
    hapusTransaksiAktif();
    tampilkanToast('Struk siap dicetak.');

    window.setTimeout(() => {
      window.print();
    }, 500);

    resetTransaksi();
  });

  tbodyKeranjang.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const plusIdx = target.getAttribute('data-qty-plus');
    if (plusIdx !== null) {
      const index = Number(plusIdx);
      if (keranjang[index]) {
        if (editingIndex === index) batalEdit();
        keranjang[index].qty++;
        renderKeranjang();
      }
      return;
    }

    const minusIdx = target.getAttribute('data-qty-minus');
    if (minusIdx !== null) {
      const index = Number(minusIdx);
      if (keranjang[index]) {
        if (editingIndex === index) batalEdit();
        keranjang[index].qty--;
        if (keranjang[index].qty <= 0) {
          const removedItem = keranjang.splice(index, 1)[0];
          tampilkanToast(`"${escapeHTML(removedItem.nama)}" dihapus dari keranjang.`);
        }
        renderKeranjang();
      }
      return;
    }

    const hapusIdx = target.getAttribute('data-hapus');
    if (hapusIdx !== null) {
      if (editingIndex !== null) {
        batalEdit();
      }
      const item = keranjang[Number(hapusIdx)];
      if (!item) return;

      keranjang.splice(Number(hapusIdx), 1);
      renderKeranjang();
      tampilkanToast(`"${escapeHTML(item.nama)}" dihapus dari keranjang.`);
      return;
    }

    const editIdx = target.getAttribute('data-edit');
    if (editIdx !== null) {
      mulaiEditItem(Number(editIdx));
    }
  });

  function pilihProdukCepat(card) {
    namaProduk.value = card.getAttribute('data-nama') || '';
    hargaProduk.value = card.getAttribute('data-harga') || '';
    qtyProduk.value = '1';
    namaProduk.focus();
  }

  quickProductsEl.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const removeTarget = target.closest('[data-hapus-quick]');
    if (removeTarget instanceof HTMLElement) {
      const nama = removeTarget.getAttribute('data-hapus-quick') || '';
      const panjangAwal = produkCepat.length;
      produkCepat = produkCepat.filter((item) => item.nama.toLowerCase() !== nama.toLowerCase());

      if (produkCepat.length !== panjangAwal) {
        simpanProdukCepat();
        renderQuickProducts();
        tampilkanToast(`${nama} dihapus dari produk favorit.`);
      }
      return;
    }

    const card = target.closest('.quick-item');
    if (!(card instanceof HTMLElement)) return;
    pilihProdukCepat(card);
  });

  quickProductsEl.addEventListener('keydown', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;

    const card = target.closest('.quick-item');
    if (!(card instanceof HTMLElement)) return;

    event.preventDefault();
    pilihProdukCepat(card);
  });

  riwayatTransaksiEl.addEventListener('click', (event) => {
    const target = event.target;
    if (target.id === 'btnToggleRiwayat') {
      const isExpanded = riwayatTransaksiEl.classList.toggle('expanded');
      const olderCount = riwayatTransaksi.length - 3;
      target.textContent = isExpanded
        ? 'Tampilkan Lebih Sedikit'
        : `Tampilkan Semua (${olderCount} lainnya)`;
    }
  });

  onlineOrdersListEl.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const ambilId = target.getAttribute('data-ambil-online');
    if (ambilId) {
      ambilOnlineOrderKeKeranjang(ambilId);
      return;
    }

    const hapusId = target.getAttribute('data-hapus-online');
    if (hapusId) {
      hapusOnlineOrder(hapusId);
    }
  });

  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEYS.onlineOrders) {
      muatOnlineOrders();
    }
  });

  [diskonPersenEl, pajakPersenEl].forEach((input) => {
    input.addEventListener('input', () => {
      sinkronkanModePembayaran();
      if (uangBayarEl.value || isTransaksiWeb()) {
        hitungPembayaran();
      }
      simpanTransaksiAktif();
    });
  });

  [namaKasirEl, namaPelangganEl, namaTokoEl, alamatTokoEl, telpTokoEl, npwpTokoEl].forEach((input) => {
    input.addEventListener('change', simpanProfil);
  });

  metodeBayarEl.addEventListener('change', () => {
    if (isTransaksiWeb()) {
      metodeBayarEl.value = 'QRIS';
    }
    sinkronkanModePembayaran();
    simpanProfil();
  });

  uangBayarEl.addEventListener('input', () => {
    hitungPembayaran();
    simpanTransaksiAktif();
  });

  [namaProduk, hargaProduk, qtyProduk].forEach((input) => {
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        tambahItem();
      }
    });
  });

  if (produkCepat.length === 0) {
    produkCepat = [...DEFAULT_PRODUK_CEPAT];
  }

  if (googleSheetEndpointEl) {
    googleSheetEndpointEl.value = googleSheetEndpoint;
    setSheetSyncStatus(
      googleSheetEndpoint
        ? 'URL Google Sheets tersimpan. Klik Tarik Pesanan untuk membaca pesanan web.'
        : 'Belum tersambung ke Google Sheets.'
    );
  }

  muatProfil();
  muatTransaksiAktif();
  sinkronkanModePembayaran();
  simpanProdukCepat();
  renderQuickProducts();
  renderKeranjang();
  renderRiwayat();
  muatOnlineOrders();
  injectResponsiveStyles();
  groupMetricCards();
  renderTanggalHari();
  if (uangBayarEl.value && keranjang.length > 0) {
    hitungPembayaran();
  } else {
    kembalianEl.value = formatRupiah(0);
  }
});
