// utils/printUtils.js

const ESC = "\x1b";
const GS = "\x1d";

function b(n) {
  return String.fromCharCode(n & 0xff);
}
function b2(n) {
  return b(n & 0xff) + b((n >> 8) & 0xff);
}

// ESC/POS Modes
const MODE_RESET = ESC + "!" + b(0);
const MODE_BOLD = ESC + "E" + b(1);
const MODE_NO_BOLD = ESC + "E" + b(0);
const MODE_DOUBLE = ESC + "!" + b(0x11);
const MODE_NORMAL = ESC + "!" + b(0);

// Alignment Commands
const ALIGN_LEFT = ESC + "a" + b(0);
const ALIGN_CENTER = ESC + "a" + b(1);
const ALIGN_RIGHT = ESC + "a" + b(2);

const SIZE_1X = GS + "!" + b(0x00);
const SIZE_2X = GS + "!" + b(0x11);
const FEED_CUT = "\r\n\r\n\r\n\r\n\r\n" + GS + "V" + b(0);

export function parseDate(raw) {
  if (!raw) return new Date();
  if (raw instanceof Date) return raw;
  let s = String(raw);
  // If it looks like an ISO string but lacks a timezone, assume it's UTC
  if (s.includes('T') && !s.includes('Z') && !s.includes('+') && !s.includes('-')) {
    s += 'Z';
  }
  const d = new Date(s);
  return isNaN(d) ? new Date() : d;
}

export function toDisplayItems(order) {
  if (Array.isArray(order?.lines)) {
    return order.lines.map(l => ({
      name: l.productName || l.item_name || "Item",
      variant_name: l.variantName || l.variant_name,
      quantity: Number(l.quantity || 1),
      price: Number(l.unitPrice || l.unit_price || 0),
      discount_amount: Number(l.discountAmount || l.discount_amount || 0),
      line_total: Number(l.lineTotal || l.line_total || 0)
    }));
  }
  if (Array.isArray(order?.order_items)) {
    return order.order_items.map((oi) => ({
      name: oi.menu_items?.name || oi.item_name || "Item",
      variant_name: oi.variant_name,
      quantity: Number(oi.quantity || 1),
      price: Number(oi.unit_price || oi.price || 0),
      discount_amount: Number(oi.discount_amount || 0),
      line_total: Number(oi.line_total || 0)
    }));
  }
  return [];
}

function wrapText(text, width) {
  if (!text) return [];
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (t.length <= width) line = t;
    else {
      if (line) lines.push(line);
      line = w.length > width ? w.slice(0, width) : w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function clip(s, w) {
  const x = String(s ?? "");
  return x.length > w ? x.slice(0, w) : x;
}
function rightAlignEnd(s, w) {
  const x = String(s ?? "");
  const y = x.length > w ? x.slice(-w) : x;
  return " ".repeat(Math.max(0, w - y.length)) + y;
}
function leftAlign(s, w) {
  const x = clip(s, w);
  return x + " ".repeat(Math.max(0, w - x.length));
}
function center(s, w) {
  const x = clip(s, w);
  const padL = Math.max(0, Math.floor((w - x.length) / 2));
  return " ".repeat(padL) + x;
}
function rightAlign(s, w) {
  const x = clip(s, w);
  return " ".repeat(Math.max(0, w - x.length)) + x;
}

function kvLine(label, value, W) {
  const l = String(label);
  const v = String(value);
  if (l.length + v.length + 1 > W) return `${l} ${v}`;
  return l + " ".repeat(W - l.length - v.length) + v;
}

function fmtRate(n) {
  const x = Number(n || 0);
  if (!Number.isFinite(x)) return "0";
  return Number.isInteger(x) ? String(x) : x.toFixed(2);
}

function getLayout(restaurantProfile) {
  const cols = Number(window?.localStorage?.getItem("PRINT_WIDTH_COLS")) || 32;
  const paperMm = Number(window?.localStorage?.getItem("PRINT_PAPER_MM")) || 58;
  const innerCols = cols;
  return { innerCols, paperMm };
}

function withMargins(line, layout) {
  return line;
}

function escposPageSetup(layout) {
  return ESC + "@" + ALIGN_LEFT;
}

function buildLogoEscPos(restaurantProfile) { return ""; }

function getBillCols(innerW) {
  let qty = 4, rate = 7, total = 8;
  let name = innerW - (qty + rate + total + 3);
  return { name, qty, rate, total };
}

export function buildReceiptText(order, bill, restaurantProfile) {
  try {
    const items = toDisplayItems(order);
    const layout = getLayout(restaurantProfile);
    const W = layout.innerCols;
    const dashes = () => "-".repeat(W);

    const restaurantName = String(restaurantProfile?.restaurant_name || order?.restaurant_name || "RESTAURANT").toUpperCase();
    const address = [restaurantProfile?.shipping_address_line1, restaurantProfile?.shipping_city].filter(Boolean).join(", ");
    const phone = restaurantProfile?.shipping_phone || restaurantProfile?.phone || "";

    const orderDate = parseDate(order?.orderDate || order?.createdAt || order?.created_at || order?.order_date);
    const dateStr = orderDate.toLocaleDateString("en-IN");
    const timeStr = orderDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

    const oGrandTotal = Number(order?.grandTotal ?? order?.totalAmount ?? order?.total_amount ?? bill?.total_amount ?? 0);
    const oTotalTax = Number(order?.totalTaxAmount || order?.total_tax || 0);
    const oDiscount = Number(order?.totalDiscountAmount || order?.discount_amount || 0);
    
    const cols = getBillCols(W);
    const { name, qty, rate, total } = cols;

    let lines = [];
    lines.push(ALIGN_CENTER);
    lines.push(MODE_BOLD + restaurantName + MODE_NO_BOLD);
    if (address) lines.push(SIZE_1X + address);
    if (phone) lines.push("Contact: " + phone);
    lines.push(ALIGN_LEFT);
    lines.push(dashes());
    lines.push(`${dateStr} ${timeStr}`);
    if (order?.orderNo) lines.push(`Invoice: ${order.orderNo}`);
    lines.push(dashes());

    // Header
    lines.push(leftAlign("ITEM", name) + " " + rightAlign("QTY", qty) + " " + rightAlign("RATE", rate) + " " + rightAlign("TOTAL", total));
    lines.push(dashes());

    // Items
    items.forEach(it => {
      let diffPrefix = "";
      let diffSuffix = "";
      
      // Differential logic if editing an order
      if (order?.originalLines) {
        const orig = order.originalLines.find(ol => ol.pid === it.productId || ol.name === it.name);
        if (!orig) {
          diffPrefix = "[+] ";
        } else if (it.quantity > orig.quantity) {
          diffSuffix = ` (+${it.quantity - orig.quantity})`;
        } else if (it.quantity < orig.quantity) {
          diffSuffix = ` (-${orig.quantity - it.quantity})`;
        }
      }

      const displayName = diffPrefix + (it.variant_name ? `${it.name} (${it.variant_name})` : it.name) + diffSuffix;
      const nameLines = wrapText(displayName, name);
      const firstRow = leftAlign(nameLines[0], name) + " " + rightAlignEnd(it.quantity, qty) + " " + rightAlignEnd(fmtRate(it.price), rate) + " " + rightAlignEnd(fmtRate(it.line_total), total);
      lines.push(firstRow);
      for (let i = 1; i < nameLines.length; i++) lines.push(leftAlign(nameLines[i], name));
    });

    // Show Removed Items if any
    if (order?.originalLines) {
      order.originalLines.forEach(orig => {
        const curr = items.find(it => it.productId === orig.pid || it.name === orig.name);
        if (!curr) {
          const nameLines = wrapText("[-] " + (orig.variant_name ? `${orig.name} (${orig.variant_name})` : orig.name), name);
          lines.push(leftAlign(nameLines[0], name) + " " + rightAlignEnd(0, qty) + " " + rightAlignEnd(fmtRate(orig.price), rate) + " " + rightAlignEnd(0, total));
          for (let i = 1; i < nameLines.length; i++) lines.push(leftAlign(nameLines[i], name));
        }
      });
    }

    lines.push(dashes());
    
    // Totals
    const gross = items.reduce((s, i) => s + (i.price * i.quantity), 0);
    lines.push(kvLine("Gross Total:", fmtRate(gross), W));
    if (oDiscount > 0) lines.push(kvLine("Discount:", "-" + fmtRate(oDiscount), W));
    
    if (oTotalTax > 0) {
      const isIncl = order?.pricesIncludeTax || order?.prices_include_tax;
      const tag = isIncl ? "(incl)" : "(+)";
      lines.push(kvLine(`CGST ${tag}:`, fmtRate(oTotalTax / 2), W));
      lines.push(kvLine(`SGST ${tag}:`, fmtRate(oTotalTax / 2), W));
    }

    lines.push(dashes());
    lines.push(MODE_BOLD + kvLine("TOTAL:", fmtRate(oGrandTotal), W) + MODE_NO_BOLD);
    lines.push(dashes());

    // Footer
    const footer = restaurantProfile?.receipt_footer || restaurantProfile?.receiptFooter || "";
    if (footer) {
      footer.split('\n').forEach(f => wrapText(f, W).forEach(fl => lines.push(center(fl, W))));
    } else {
      lines.push(center("** THANK YOU **", W));
    }
    lines.push(center("Powered by Cafe QR", W));
    lines.push(FEED_CUT);

    return escposPageSetup(layout) + lines.join("\n");
  } catch (e) {
    console.error(e);
    return "PRINT ERROR: " + e.message;
  }
}

export function buildKotText(order, restaurantProfile) {
    try {
      const items = toDisplayItems(order);
      const layout = getLayout(restaurantProfile);
      const W = layout.innerCols;
      const dashes = () => "-".repeat(W);
      const qtyW = 6;
      const nameW = W - qtyW - 1;
  
      let lines = [];
      lines.push(ALIGN_CENTER + MODE_BOLD + "*** KOT ***" + MODE_NO_BOLD + ALIGN_LEFT);
      lines.push(dashes());
      if (order?.orderNo) lines.push(`Order: ${order.orderNo}`);
      lines.push(dashes());
      lines.push(leftAlign("ITEM", nameW) + " " + rightAlign("QTY", qtyW));
      lines.push(dashes());
      items.forEach(it => {
        const displayName = it.variant_name ? `${it.name} (${it.variant_name})` : it.name;
        const nameLines = wrapText(displayName, nameW);
        lines.push(leftAlign(nameLines[0], nameW) + " " + rightAlignEnd(it.quantity, qtyW));
        for (let i = 1; i < nameLines.length; i++) lines.push(leftAlign(nameLines[i], nameW));
      });
      lines.push(dashes());
      lines.push(FEED_CUT);
      return escposPageSetup(layout) + lines.join("\n");
    } catch (e) { return "KOT ERROR"; }
}

export async function downloadTextAndShare(order, bill, restaurantProfile) {
    try {
      const text = buildReceiptText(order, bill, restaurantProfile).replace(/[\x00-\x1f\x7f]/g, (c) => (c === "\n" || c === "\r" || c === "\t" ? c : "")).trim();
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BILL-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return { success: true };
    } catch (e) { return { success: false }; }
}

export async function downloadPdfAndShare(order, bill, restaurantProfile) { return downloadTextAndShare(order, bill, restaurantProfile); }
