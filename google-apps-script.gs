const SHEETS = {
  products: 'Products',
  orders: 'Orders',
  transactions: 'Transactions'
};

const HEADERS = {
  Products: ['nama', 'harga', 'updatedAt'],
  Orders: [
    'id',
    'createdAt',
    'customerName',
    'source',
    'note',
    'status',
    'paymentStatus',
    'total',
    'itemsJson',
    'nomorTransaksi',
    'updatedAt'
  ],
  Transactions: [
    'nomor',
    'waktu',
    'pelanggan',
    'kasir',
    'sumberTransaksi',
    'orderId',
    'metodeBayar',
    'totalItem',
    'subtotal',
    'diskon',
    'pajak',
    'grandTotal',
    'itemsJson'
  ]
};

function setupDatabase() {
  Object.keys(HEADERS).forEach((name) => getSheet(name));
}

function doGet(e) {
  setupDatabase();

  const action = String(e.parameter.action || '');
  let result;

  if (action === 'getProducts') {
    result = { ok: true, products: getProducts() };
  } else if (action === 'getOrders') {
    result = { ok: true, orders: getOpenOrders() };
  } else {
    result = { ok: true, message: 'Google Sheets POS API aktif.' };
  }

  return output(result, e.parameter.callback);
}

function doPost(e) {
  setupDatabase();

  const body = parseBody(e);
  const action = String(body.action || '');
  const payload = body.payload || {};

  if (action === 'upsertProducts') {
    upsertProducts(payload.products || []);
    return output({ ok: true, message: 'Produk tersimpan.' });
  }

  if (action === 'addOrder') {
    addOrder(payload.order);
    return output({ ok: true, message: 'Pesanan tersimpan.' });
  }

  if (action === 'addTransaction') {
    addTransaction(payload.transaction);
    return output({ ok: true, message: 'Transaksi tersimpan.' });
  }

  if (action === 'markOrderDone') {
    markOrderDone(payload.orderId, payload.nomorTransaksi);
    return output({ ok: true, message: 'Pesanan selesai.' });
  }

  return output({ ok: false, message: 'Action tidak dikenal.' });
}

function parseBody(e) {
  try {
    return JSON.parse(e.postData.contents || '{}');
  } catch (error) {
    return {};
  }
}

function output(data, callback) {
  const json = JSON.stringify(data);
  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${json});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  const headers = HEADERS[name];
  const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const needsHeader = headers.some((header, index) => currentHeaders[index] !== header);

  if (needsHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function readObjects(sheetName) {
  const sheet = getSheet(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0];
  return values.slice(1)
    .filter((row) => row.some((cell) => cell !== ''))
    .map((row) => headers.reduce((obj, header, index) => {
      obj[header] = row[index];
      return obj;
    }, {}));
}

function getProducts() {
  return readObjects(SHEETS.products)
    .map((row) => ({
      nama: String(row.nama || '').trim(),
      harga: Number(row.harga || 0)
    }))
    .filter((item) => item.nama && item.harga > 0);
}

function getOpenOrders() {
  return readObjects(SHEETS.orders)
    .filter((row) => String(row.status || '').toLowerCase() !== 'selesai')
    .map((row) => ({
      id: String(row.id || '').trim(),
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
      customerName: String(row.customerName || 'Pelanggan Online').trim(),
      source: String(row.source || 'Website').trim(),
      note: String(row.note || '-').trim(),
      status: String(row.status || 'baru').trim(),
      paymentStatus: String(row.paymentStatus || 'belum dibayar').trim(),
      items: parseItems(row.itemsJson)
    }))
    .filter((order) => order.id && order.items.length > 0);
}

function parseItems(itemsJson) {
  try {
    const items = JSON.parse(itemsJson || '[]');
    if (!Array.isArray(items)) return [];
    return items
      .map((item) => ({
        nama: String(item.nama || '').trim(),
        harga: Number(item.harga || 0),
        qty: Number(item.qty || 0)
      }))
      .filter((item) => item.nama && item.harga > 0 && item.qty > 0);
  } catch (error) {
    return [];
  }
}

function upsertProducts(products) {
  const sheet = getSheet(SHEETS.products);
  const cleanProducts = (Array.isArray(products) ? products : [])
    .map((item) => ({
      nama: String(item.nama || '').trim(),
      harga: Number(item.harga || 0)
    }))
    .filter((item) => item.nama && item.harga > 0);

  sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), HEADERS.Products.length).clearContent();
  if (cleanProducts.length === 0) return;

  const now = new Date();
  sheet.getRange(2, 1, cleanProducts.length, HEADERS.Products.length).setValues(
    cleanProducts.map((item) => [item.nama, item.harga, now])
  );
}

function addOrder(order) {
  if (!order || !order.id) throw new Error('Order tidak valid.');

  const items = Array.isArray(order.items) ? order.items : [];
  const total = items.reduce((sum, item) => sum + Number(item.harga || 0) * Number(item.qty || 0), 0);
  const sheet = getSheet(SHEETS.orders);
  const existingRow = findRowByValue(sheet, 'id', order.id);
  const row = [
    order.id,
    order.createdAt ? new Date(order.createdAt) : new Date(),
    order.customerName || 'Pelanggan Online',
    order.source || 'Website',
    order.note || '-',
    order.status || 'baru',
    order.paymentStatus || 'belum dibayar',
    total,
    JSON.stringify(items),
    '',
    new Date()
  ];

  if (existingRow > 1) {
    sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

function addTransaction(transaction) {
  if (!transaction || !transaction.nomor) throw new Error('Transaksi tidak valid.');

  getSheet(SHEETS.transactions).appendRow([
    transaction.nomor,
    transaction.waktu ? new Date(transaction.waktu) : new Date(),
    transaction.pelanggan || 'Pelanggan Umum',
    transaction.kasir || 'Kasir Utama',
    transaction.sumberTransaksi || 'kasir',
    transaction.orderId || '',
    transaction.metodeBayar || 'Tunai',
    Number(transaction.totalItem || 0),
    Number(transaction.subtotal || 0),
    Number(transaction.diskon || 0),
    Number(transaction.pajak || 0),
    Number(transaction.grandTotal || 0),
    JSON.stringify(transaction.items || [])
  ]);
}

function markOrderDone(orderId, nomorTransaksi) {
  if (!orderId) return;

  const sheet = getSheet(SHEETS.orders);
  const row = findRowByValue(sheet, 'id', orderId);
  if (row <= 1) return;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const statusCol = headers.indexOf('status') + 1;
  const trxCol = headers.indexOf('nomorTransaksi') + 1;
  const updatedCol = headers.indexOf('updatedAt') + 1;

  sheet.getRange(row, statusCol).setValue('selesai');
  sheet.getRange(row, trxCol).setValue(nomorTransaksi || '');
  sheet.getRange(row, updatedCol).setValue(new Date());
}

function findRowByValue(sheet, headerName, value) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0] || [];
  const colIndex = headers.indexOf(headerName);
  if (colIndex < 0) return -1;

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][colIndex]) === String(value)) {
      return i + 1;
    }
  }

  return -1;
}
