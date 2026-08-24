// ====================================================================
// AI SCALPER TERMINAL - FULL ENGINE v2.0
// ====================================================================

// ===== 1. DATABASE EMITEN IHSG (20 saham) =====
const IHSG_STOCKS = [
  { code: "BBRI", name: "Bank Rakyat Indonesia Tbk", price: 4850, sector: "Finance", health: "VERY STRONG", per: "11.2x", risk: "LOW", summary: "Perbankan Tier-1, dividen solid. Sangat aman untuk scalping skala besar." },
  { code: "BBCA", name: "Bank Central Asia Tbk", price: 10250, sector: "Finance", health: "VERY STRONG", per: "22.5x", risk: "LOW", summary: "Kualitas aset terbaik di IHSG. Likuiditas melimpah." },
  { code: "BMRI", name: "Bank Mandiri Tbk", price: 6900, sector: "Finance", health: "VERY STRONG", per: "10.8x", risk: "LOW", summary: "Pertumbuhan kredit kuat. Penopang utama indeks." },
  { code: "BBNI", name: "Bank Negara Indonesia Tbk", price: 4950, sector: "Finance", health: "STRONG", per: "9.5x", risk: "LOW", summary: "Valuasi atraktif, pertumbuhan konsisten." },
  { code: "TLKM", name: "Telkom Indonesia Tbk", price: 3890, sector: "Infrastruktur", health: "VERY STRONG", per: "14.0x", risk: "LOW", summary: "Defensif bluechip, cashflow stabil. Aman untuk rebound scalping." },
  { code: "ASII", name: "Astra International Tbk", price: 5125, sector: "Industri", health: "STRONG", per: "7.8x", risk: "LOW-MEDIUM", summary: "Diversifikasi bisnis luas. Valuasi terdiskon memikat." },
  { code: "ANTM", name: "Aneka Tambang Tbk", price: 2150, sector: "Basic Materials", health: "STRONG", per: "15.1x", risk: "MEDIUM", summary: "Sentimen komoditas nikel & emas positif. Katalis teknikal kuat." },
  { code: "INCO", name: "Vale Indonesia Tbk", price: 4280, sector: "Basic Materials", health: "STRONG", per: "13.2x", risk: "MEDIUM", summary: "Kinerja terkait harga nikel global." },
  { code: "MDKA", name: "Merdeka Copper Gold Tbk", price: 2640, sector: "Basic Materials", health: "GROWTH", per: "N/A", risk: "MEDIUM-HIGH", summary: "Prospek ekspansi tambang emas & tembaga tinggi." },
  { code: "PGAS", name: "Perusahaan Gas Negara Tbk", price: 1520, sector: "Energy", health: "FAIR", per: "7.5x", risk: "MEDIUM", summary: "Arus kas dividen tinggi, perhatikan regulasi harga gas." },
  { code: "PTBA", name: "Bukit Asam Tbk", price: 2870, sector: "Energy", health: "STRONG", per: "5.4x", risk: "MEDIUM", summary: "Raja dividen energi. Menarik untuk scalping momentum." },
  { code: "ADRO", name: "Adaro Energy Indonesia Tbk", price: 2650, sector: "Energy", health: "STRONG", per: "4.8x", risk: "MEDIUM", summary: "Balance sheet tebal, aliran kas operasional solid." },
  { code: "ITMG", name: "Indo Tambangraya Megah Tbk", price: 25400, sector: "Energy", health: "STRONG", per: "6.1x", risk: "MEDIUM", summary: "Cash cow dengan yield dividen jumbo." },
  { code: "GOTO", name: "GoTo Gojek Tokopedia Tbk", price: 98, sector: "Technology", health: "TURNAROUND", per: "N/A", risk: "HIGH", summary: "Volatilitas tinggi, perhatikan aliran dana asing." },
  { code: "EMTK", name: "Elang Mahkota Teknologi Tbk", price: 870, sector: "Technology", health: "FAIR", per: "18.2x", risk: "MEDIUM-HIGH", summary: "Ekosistem media & teknologi. Penggerak momentum cepat." },
  { code: "CASH", name: "Cashlez Worldwide Indonesia Tbk", price: 3670, sector: "Technology", health: "SPECULATIVE", per: "N/A", risk: "HIGH", summary: "Volatilitas tinggi, fase turnaround. Scalping hanya untuk pro trader." },
  { code: "PADI", name: "Minna Padi Investama Sekuritas Tbk", price: 480, sector: "Finance", health: "SPECULATIVE", per: "N/A", risk: "HIGH", summary: "Saham volatilitas tinggi/gorengan. Murni trading momentum kilat." },
  { code: "AMMN", name: "Amman Mineral Internasional Tbk", price: 9850, sector: "Basic Materials", health: "STRONG", per: "32.0x", risk: "MEDIUM", summary: "Kapitalisasi pasar besar, penggerak utama IHSG." },
  { code: "BREN", name: "Barito Renewables Energy Tbk", price: 7300, sector: "Infrastructure", health: "GROWTH", per: "75.0x", risk: "HIGH", summary: "Energi terbarukan. Volatilitas super tinggi untuk scalper berpengalaman." },
  { code: "CUAN", name: "Petrindo Jaya Kreasi Tbk", price: 9750, sector: "Energy", health: "SPECULATIVE", per: "N/A", risk: "VERY HIGH", summary: "Pergerakan harga ekstrem, murni permainan impuls & running trade." }
];

// ===== 2. STATE =====
let selectedStock = null;
let priceHistory = [];
const MAX_HISTORY = 30;
let signalCount = 0;

// ===== 3. DOM REFS =====
const searchInput = document.getElementById("stockSearch");
const dropdown = document.getElementById("searchResults");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const clockEl = document.getElementById("clock");
const signalBadge = document.getElementById("signalBadge");
const percentValue = document.getElementById("percentValue");
const mPrice = document.getElementById("mPrice");
const mVelocity = document.getElementById("mVelocity");
const mImpulse = document.getElementById("mImpulse");
const mVolume = document.getElementById("mVolume");
const activeCode = document.getElementById("activeCode");
const activeName = document.getElementById("activeName");
const fHealth = document.getElementById("fHealth");
const fValuation = document.getElementById("fValuation");
const fRisk = document.getElementById("fRisk");
const slValue = document.getElementById("slValue");
const tpValue = document.getElementById("tpValue");
const lotValue = document.getElementById("lotValue");
const aiInsightText = document.getElementById("aiInsightText");
const signalLog = document.getElementById("signalLog");
const clearLogBtn = document.getElementById("clearLog");
const sparklineCanvas = document.getElementById("sparkline");

// ===== 4. CLOCK & MARKET STATUS =====
function updateClock() {
  const now = new Date();
  const wib = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  clockEl.textContent = wib;
}
setInterval(updateClock, 1000);
updateClock();

function checkMarketStatus() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const isOpen = (day >= 1 && day <= 5 && hour >= 9 && hour < 16);
  
  if (isOpen) {
    statusDot.className = "dot open";
    statusText.textContent = "🟢 MARKET OPEN";
  } else {
    statusDot.className = "dot";
    statusText.textContent = "🔴 MARKET CLOSED";
  }
}
setInterval(checkMarketStatus, 5000);
checkMarketStatus();

// ===== 5. SEARCH ENGINE =====
searchInput.addEventListener("input", (e) => {
  const query = e.target.value.toUpperCase().trim();
  dropdown.innerHTML = "";
  
  if (query.length === 0) {
    dropdown.style.display = "none";
    return;
  }
  
  const filtered = IHSG_STOCKS.filter(s => 
    s.code.includes(query) || s.name.toUpperCase().includes(query)
  );
  
  if (filtered.length > 0) {
    dropdown.style.display = "block";
    filtered.forEach(stock => {
      const item = document.createElement("div");
      item.className = "search-item";
      item.innerHTML = `<span class="code">${stock.code}</span><span class="name">${stock.name}</span>`;
      item.onclick = () => selectStock(stock);
      dropdown.appendChild(item);
    });
  } else {
    dropdown.style.display = "none";
  }
});

// ===== 6. SELECT STOCK =====
function selectStock(stock) {
  selectedStock = stock;
  searchInput.value = `${stock.code} - ${stock.name}`;
  dropdown.style.display = "none";
  priceHistory = [];
  
  // Update UI fundamental
  activeCode.textContent = stock.code;
  activeName.textContent = stock.name;
  fHealth.textContent = stock.health;
  fValuation.textContent = stock.per;
  fRisk.textContent = stock.risk;
  aiInsightText.textContent = stock.summary;
  
  // Set price awal
  mPrice.textContent = formatPrice(stock.price);
  
  // Reset log
  signalCount = 0;
  document.getElementById("signalLog").innerHTML = '<div class="log-empty">Belum ada sinyal...</div>';
  
  // Generate sinyal pertama
  processScalpingAI();
}

// ===== 7. PRICE FORMATTER =====
function formatPrice(price) {
  return "Rp " + Math.round(price).toLocaleString('id-ID');
}

// ===== 8. SCALPING ENGINE =====
function processScalpingAI() {
  if (!selectedStock) return;
  
  const stock = selectedStock;
  const basePrice = stock.price;
  
  // Simulasi pergerakan harga realistis (±2.5%)
  const changePercent = (Math.random() - 0.47) * 5;
  const newPrice = basePrice * (1 + changePercent / 100);
  const isHaka = changePercent > 0;
  const pressure = Math.min(Math.abs(changePercent) * 7 + 25, 85);
  
  // Velocity berdasarkan likuiditas (saham bank lebih cepat)
  let velocityBase = 0.8;
  if (["BBRI","BBCA","BMRI","BBNI","TLKM","ASII"].includes(stock.code)) {
    velocityBase = 2.5;
  }
  const velocity = (Math.random() * 2.5 + velocityBase).toFixed(1);
  
  // Volume simulasi
  const volume = Math.floor(Math.random() * 8000 + 2000);
  
  // Update price history untuk sparkline
  priceHistory.push(newPrice);
  if (priceHistory.length > MAX_HISTORY) priceHistory.shift();
  
  // ===== UPDATE UI =====
  
  // Badge & sinyal
  if (isHaka) {
    signalBadge.textContent = "🔥 HAKA (BUY)";
    signalBadge.className = "badge haka";
    percentValue.textContent = `+${pressure.toFixed(1)}%`;
    percentValue.className = "percent-number";
    mImpulse.textContent = "🟢 BIG BUY INFLOW";
  } else {
    signalBadge.textContent = "💥 HAKI (SELL)";
    signalBadge.className = "badge haki";
    percentValue.textContent = `-${pressure.toFixed(1)}%`;
    percentValue.className = "percent-number negative";
    mImpulse.textContent = "🔴 DISTRIBUTION DETECTED";
  }
  
  // Harga dengan animasi perubahan warna
  const oldPrice = parseInt(mPrice.textContent.replace(/[^0-9]/g, '')) || stock.price;
  mPrice.textContent = formatPrice(newPrice);
  if (newPrice > oldPrice) {
    mPrice.style.color = "#00c897";
    setTimeout(() => mPrice.style.color = "", 600);
  } else if (newPrice < oldPrice) {
    mPrice.style.color = "#ff5470";
    setTimeout(() => mPrice.style.color = "", 600);
  }
  
  // Velocity & Volume
  mVelocity.textContent = `${velocity} Ticks/sec`;
  mVolume.textContent = `${(volume / 1000).toFixed(1)}K lot`;
  
  // ===== RISK MANAGEMENT =====
  const sl = newPrice * 0.97;
  const tp = newPrice * 1.025;
  slValue.textContent = formatPrice(sl);
  tpValue.textContent = formatPrice(tp);
  
  // Rekomendasi lot berdasarkan risk level
  const riskMap = { 
    "LOW": "≤ 15%", 
    "LOW-MEDIUM": "≤ 10%", 
    "MEDIUM": "≤ 7%", 
    "MEDIUM-HIGH": "≤ 5%", 
    "HIGH": "≤ 3%", 
    "VERY HIGH": "≤ 1.5%" 
  };
  lotValue.textContent = riskMap[stock.risk] || "≤ 5%";
  
  // ===== SIGNAL LOG =====
  const now = new Date();
  const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const action = isHaka ? "BUY" : "SELL";
  const actionClass = isHaka ? "buy" : "sell";
  const logEntry = document.createElement("div");
  logEntry.className = "log-entry";
  logEntry.innerHTML = `
    <span class="log-time">[${time}]</span>
    <span class="log-action ${actionClass}">${action}</span>
    <span>@ ${formatPrice(newPrice)}</span>
    <span style="color:#4a5568;font-size:9px;">${(pressure).toFixed(1)}%</span>
  `;
  
  // Hapus placeholder jika ada
  const emptyLog = signalLog.querySelector(".log-empty");
  if (emptyLog) emptyLog.remove();
  
  signalLog.prepend(logEntry);
  
  // Batasi log (max 20)
  while (signalLog.children.length > 20) {
    signalLog.removeChild(signalLog.lastChild);
  }
  
  // ===== SPARKLINE =====
  drawSparkline(priceHistory);
  
  // Update harga dasar untuk iterasi berikutnya
  selectedStock.price = newPrice;
}

// ===== 9. SPARKLINE =====
function drawSparkline(data) {
  if (!sparklineCanvas) return;
  const ctx = sparklineCanvas.getContext('2d');
  const w = sparklineCanvas.width;
  const h = sparklineCanvas.height;
  
  ctx.clearRect(0, 0, w, h);
  
  if (data.length < 2) {
    ctx.fillStyle = '#4a5568';
    ctx.font = '9px monospace';
    ctx.fillText('Loading data...', 10, h/2 + 4);
    return;
  }
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  
  // Draw grid line
  ctx.strokeStyle = '#1a1f28';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, h/2);
  ctx.lineTo(w, h/2);
  ctx.stroke();
  
  // Draw line
  ctx.beginPath();
  ctx.strokeStyle = data[data.length-1] > data[0] ? '#00c897' : '#ff5470';
  ctx.lineWidth = 2;
  
  data.forEach((val, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - padding - ((val - min) / range) * (h - padding * 2);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  
  // Draw area fill (gradient)
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, data[data.length-1] > data[0] ? 'rgba(0,200,151,0.15)' : 'rgba(255,84,112,0.15)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  data.forEach((val, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - padding - ((val - min) / range) * (h - padding * 2);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  
  // Last price dot
  const lastX = w;
  const lastY = h - padding - ((data[data.length-1] - min) / range) * (h - padding * 2);
  ctx.beginPath();
  ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
  ctx.fillStyle = data[data.length-1] > data[0] ? '#00c897' : '#ff5470';
  ctx.fill();
}

// ===== 10. CLEAR LOG =====
if (clearLogBtn) {
  clearLogBtn.addEventListener("click", () => {
    signalLog.innerHTML = '<div class="log-empty">Log dibersihkan</div>';
    setTimeout(() => {
      if (signalLog.children.length === 1 && signalLog.children[0].classList.contains('log-empty')) {
        signalLog.innerHTML = '<div class="log-empty">Belum ada sinyal...</div>';
      }
    }, 1500);
  });
}

// ===== 11. INTERVAL LOOP =====
setInterval(() => {
  if (selectedStock) {
    processScalpingAI();
  }
}, 2000);

// ===== 12. INISIALISASI =====
// Tampilkan default (tidak ada saham dipilih)
activeCode.textContent = "SELECT";
activeName.textContent = "Pilih emiten untuk memulai";
fHealth.textContent = "-";
fValuation.textContent = "-";
fRisk.textContent = "-";
slValue.textContent = "-";
tpValue.textContent = "-";
lotValue.textContent = "-";
aiInsightText.textContent = "Sistem siap. Silakan pilih salah satu emiten IHSG.";

// Sparkline default (kosong)
drawSparkline([]);

console.log("🚀 AI Scalper Terminal v2.0 siap!");
console.log(`📊 ${IHSG_STOCKS.length} emiten IHSG terload.`);
