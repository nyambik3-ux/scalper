// ====================================================================
// AI SCALPER TERMINAL - REAL-TIME DENGAN STOCKTV API
// ====================================================================

// ===== 1. KONFIGURASI =====
const API_KEY = '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'; // 🔑 GANTI DENGAN API KEY KAMU!
const BASE_URL = 'https://api.stocktv.top';
const COUNTRY_ID = 48; // Indonesia

// ===== 2. STATE =====
let selectedStock = null;
let selectedPid = null; // Product ID dari API
let priceHistory = [];
let currentPrice = 0;
let isFetching = false;
let stockList = []; // Menyimpan semua saham
let updateInterval = null;

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

// ===== 4. AMBIL DAFTAR SAHAM DARI API =====
async function fetchStockList() {
  try {
    const url = `${BASE_URL}/stock/stocks?countryId=${COUNTRY_ID}&pageSize=100&page=1&key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === 200 && data.data) {
      // Simpan ke stockList
      stockList = data.data.map(item => ({
        code: item.symbol,
        name: item.name,
        pid: item.id, // ← INI PID YANG DIPERLUKAN!
        price: item.last || 0,
        change: item.chgPct || 0,
        volume: item.volume || 0,
        open: item.open || false,
        // Data fundamental (jika ada)
        health: item.health || "N/A",
        per: item.per ? `${item.per}x` : "N/A",
        risk: item.risk || "MEDIUM",
        summary: item.summary || "Data fundamental tidak tersedia"
      }));
      
      console.log(`✅ ${stockList.length} saham berhasil dimuat dari API`);
      return stockList;
    } else {
      console.error('❌ Gagal ambil daftar saham:', data.message);
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetch stock list:', error);
    return [];
  }
}

// ===== 5. AMBIL HARGA REAL-TIME PER SAHAM =====
async function fetchRealTimePrice(pid) {
  if (!pid) return null;
  
  try {
    const url = `${BASE_URL}/stock/queryStocks?id=${pid}&key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === 200 && data.data && data.data.length > 0) {
      const stock = data.data[0];
      return {
        pid: stock.pid,
        symbol: stock.symbol,
        price: stock.last || 0,
        change: stock.chgPct || 0,
        changeAmount: stock.chg || 0,
        volume: stock.volume || 0,
        high: stock.high || 0,
        low: stock.low || 0,
        open: stock.open || 0,
        previousClose: stock.preClose || 0,
        technical: stock.technicalDay || 'neutral',
        // Data tambahan
        pe: stock.pe || null,
        pb: stock.pb || null,
        marketCap: stock.fundamentalMarketCap || 0
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetch real-time price:', error);
    return null;
  }
}

// ===== 6. AMBIL STATUS INDEKS (IHSG) =====
async function fetchMarketStatus() {
  try {
    const url = `${BASE_URL}/stock/indices?countryId=${COUNTRY_ID}&key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === 200 && data.data) {
      const ihsg = data.data.find(i => i.symbol === 'JKSE');
      if (ihsg) {
        const isOpen = ihsg.isOpen || false;
        updateMarketStatus(isOpen);
        return isOpen;
      }
    }
    return false;
  } catch (error) {
    console.error('❌ Error fetch market status:', error);
    return false;
  }
}

// ===== 7. UPDATE UI MARKET STATUS =====
function updateMarketStatus(isOpen) {
  if (isOpen) {
    statusDot.className = "dot open";
    statusText.textContent = "🟢 MARKET OPEN";
  } else {
    statusDot.className = "dot";
    statusText.textContent = "🔴 MARKET CLOSED";
  }
}

// ===== 8. CLOCK =====
function updateClock() {
  const now = new Date();
  const wib = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  clockEl.textContent = wib;
}
setInterval(updateClock, 1000);
updateClock();

// ===== 9. SEARCH ENGINE =====
searchInput.addEventListener("input", (e) => {
  const query = e.target.value.toUpperCase().trim();
  dropdown.innerHTML = "";
  
  if (query.length === 0 || stockList.length === 0) {
    dropdown.style.display = "none";
    return;
  }
  
  const filtered = stockList.filter(s => 
    s.code.includes(query) || s.name.toUpperCase().includes(query)
  );
  
  if (filtered.length > 0) {
    dropdown.style.display = "block";
    filtered.slice(0, 15).forEach(stock => {
      const item = document.createElement("div");
      item.className = "search-item";
      item.innerHTML = `
        <span class="code">${stock.code}</span>
        <span class="name">${stock.name}</span>
        <span style="color:#7a8494;font-size:10px;">${stock.price ? formatPrice(stock.price) : '-'}</span>
      `;
      item.onclick = () => selectStock(stock);
      dropdown.appendChild(item);
    });
  } else {
    dropdown.style.display = "none";
  }
});

// ===== 10. SELECT STOCK =====
async function selectStock(stock) {
  // Stop interval sebelumnya
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
  
  selectedStock = stock;
  selectedPid = stock.pid;
  searchInput.value = `${stock.code} - ${stock.name}`;
  dropdown.style.display = "none";
  priceHistory = [];
  
  // Update UI fundamental
  activeCode.textContent = stock.code;
  activeName.textContent = stock.name;
  fHealth.textContent = stock.health || "N/A";
  fValuation.textContent = stock.per || "N/A";
  fRisk.textContent = stock.risk || "MEDIUM";
  aiInsightText.textContent = stock.summary || "Analisis AI siap...";
  
  // Ambil data real-time pertama
  await fetchAndUpdatePrice();
  
  // Set interval update tiap 3 detik
  updateInterval = setInterval(fetchAndUpdatePrice, 3000);
}

// ===== 11. FETCH & UPDATE HARGA =====
async function fetchAndUpdatePrice() {
  if (!selectedPid || isFetching) return;
  
  isFetching = true;
  
  try {
    const data = await fetchRealTimePrice(selectedPid);
    
    if (data && data.price > 0) {
      currentPrice = data.price;
      
      // Update price history untuk sparkline
      priceHistory.push(currentPrice);
      if (priceHistory.length > 30) priceHistory.shift();
      
      // ===== UPDATE UI =====
      
      // Harga
      mPrice.textContent = formatPrice(currentPrice);
      mPrice.style.color = data.change >= 0 ? "#00c897" : "#ff5470";
      setTimeout(() => mPrice.style.color = "", 600);
      
      // Sinyal berdasarkan perubahan REAL
      const isHaka = data.change >= 0;
      const pressure = Math.min(Math.abs(data.change) * 2 + 30, 90);
      
      if (isHaka) {
        signalBadge.textContent = `🔥 HAKA (BUY)`;
        signalBadge.className = "badge haka";
        percentValue.textContent = `+${data.change.toFixed(2)}%`;
        percentValue.className = "percent-number";
        mImpulse.textContent = "🟢 BIG BUY INFLOW";
      } else {
        signalBadge.textContent = `💥 HAKI (SELL)`;
        signalBadge.className = "badge haki";
        percentValue.textContent = `${data.change.toFixed(2)}%`;
        percentValue.className = "percent-number negative";
        mImpulse.textContent = "🔴 DISTRIBUTION DETECTED";
      }
      
      // Velocity (estimasi dari perubahan)
      const velocity = Math.min(Math.abs(data.change) * 1.5 + 0.3, 8);
      mVelocity.textContent = `${velocity.toFixed(1)} Ticks/sec`;
      
      // Volume
      if (data.volume > 0) {
        mVolume.textContent = `${(data.volume / 1000).toFixed(1)}K lot`;
      } else {
        mVolume.textContent = "-";
      }
      
      // ===== RISK MANAGEMENT =====
      const sl = currentPrice * 0.97;
      const tp = currentPrice * 1.025;
      slValue.textContent = formatPrice(sl);
      tpValue.textContent = formatPrice(tp);
      
      const riskMap = { 
        "LOW": "≤ 15%", 
        "LOW-MEDIUM": "≤ 10%", 
        "MEDIUM": "≤ 7%", 
        "MEDIUM-HIGH": "≤ 5%", 
        "HIGH": "≤ 3%", 
        "VERY HIGH": "≤ 1.5%" 
      };
      lotValue.textContent = riskMap[selectedStock.risk] || "≤ 5%";
      
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
        <span>@ ${formatPrice(currentPrice)}</span>
        <span style="color:#4a5568;font-size:9px;">${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}%</span>
      `;
      
      const emptyLog = signalLog.querySelector(".log-empty");
      if (emptyLog) emptyLog.remove();
      signalLog.prepend(logEntry);
      
      while (signalLog.children.length > 20) {
        signalLog.removeChild(signalLog.lastChild);
      }
      
      // ===== SPARKLINE =====
      drawSparkline(priceHistory);
      
    } else {
      console.warn('⚠️ Data tidak valid untuk', selectedStock.code);
    }
  } catch (error) {
    console.error('❌ Error update price:', error);
  } finally {
    isFetching = false;
  }
}

// ===== 12. FORMAT PRICE =====
function formatPrice(price) {
  if (!price || price === 0) return "Rp -";
  return "Rp " + Math.round(price).toLocaleString('id-ID');
}

// ===== 13. SPARKLINE =====
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
  
  // Grid line
  ctx.strokeStyle = '#1a1f28';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, h/2);
  ctx.lineTo(w, h/2);
  ctx.stroke();
  
  // Line
  ctx.beginPath();
  ctx.strokeStyle = data[data.length-1] > data[0] ? '#00c897' : '#ff5470';
  ctx.lineWidth = 2;
  
  data.forEach((val, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - padding - ((val - min) / range) * (h - padding * 2);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  
  // Area fill
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

// ===== 14. CLEAR LOG =====
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

// ===== 15. INIT =====
async function init() {
  console.log('🚀 AI Scalper Terminal Starting...');
  
  // Ambil daftar saham
  const stocks = await fetchStockList();
  
  if (stocks.length === 0) {
    console.error('❌ Gagal memuat data saham. Cek API Key!');
    activeName.textContent = '⚠️ Gagal konek ke API. Cek API Key!';
    return;
  }
  
  // Cek status pasar
  await fetchMarketStatus();
  
  // Update market status tiap 30 detik
  setInterval(fetchMarketStatus, 30000);
  
  console.log(`✅ Siap! ${stocks.length} saham tersedia.`);
}

// ===== 16. JALANKAN =====
init();

// Fallback: jika API gagal, tampilkan pesan
console.log('📌 Pastikan API Key benar dan koneksi internet aktif.');
