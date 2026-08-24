// ====================================================================
// AI SCALPER TERMINAL - INDEPENDENT v5.0
// LOAD DATA DARI stocks-data.json
// ====================================================================

// ===== 1. STATE =====
let IHSG_STOCKS = [];
let selectedStock = null;
let selectedCode = null;
let priceHistory = [];
let openPrice = 0;
let highPrice = 0;
let lowPrice = 0;
let currentPrice = 0;
let isFetching = false;
let updateInterval = null;
let entryTime = null;
let strategyStatus = 'standby';
let isDataLoaded = false;

// ===== 2. DOM REFS =====
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
const loadingIndicator = document.getElementById("loadingIndicator");

// ===== 3. LOAD DATA DARI JSON =====
async function loadStockData() {
  try {
    console.log('📡 Loading stocks-data.json...');
    const response = await fetch('stocks-data.json');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      IHSG_STOCKS = data;
      isDataLoaded = true;
      console.log(`✅ ${IHSG_STOCKS.length} saham berhasil dimuat!`);
      console.log(`📊 Contoh: ${IHSG_STOCKS[0].code} - ${IHSG_STOCKS[0].name}`);
      
      // Update UI
      aiInsightText.textContent = `✅ ${IHSG_STOCKS.length} saham IHSG siap digunakan. Silakan cari emiten.`;
      return true;
    } else {
      throw new Error('Data kosong atau format tidak valid');
    }
  } catch (error) {
    console.error('❌ Gagal load data:', error.message);
    aiInsightText.textContent = `⚠️ Gagal load data: ${error.message}. Pastikan file stocks-data.json ada.`;
    return false;
  }
}

// ===== 4. CLOCK =====
function updateClock() {
  const now = new Date();
  const wib = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  clockEl.textContent = wib;
}
setInterval(updateClock, 1000);
updateClock();

// ===== 5. MARKET STATUS =====
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

// ===== 6. SEARCH ENGINE =====
searchInput.addEventListener("input", (e) => {
  const query = e.target.value.toUpperCase().trim();
  dropdown.innerHTML = "";
  
  if (!isDataLoaded || query.length === 0) {
    dropdown.style.display = "none";
    return;
  }
  
  const filtered = IHSG_STOCKS.filter(s => 
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
        <span style="color:#4a5568;font-size:9px;">${stock.sector || ''}</span>
      `;
      item.onclick = () => selectStock(stock);
      dropdown.appendChild(item);
    });
  } else {
    dropdown.style.display = "none";
  }
});

// ===== 7. FORMAT PRICE =====
function formatPrice(price) {
  if (!price || price === 0) return "Rp -";
  return "Rp " + Math.round(price).toLocaleString('id-ID');
}

// ===== 8. AMBIL HARGA DARI YAHOO FINANCE =====
async function fetchRealTimePrice(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.JK`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.chart && data.chart.result && data.chart.result.length > 0) {
      const meta = data.chart.result[0].meta;
      const price = meta.regularMarketPrice || 0;
      const previousClose = meta.previousClose || price;
      const changePercent = ((price - previousClose) / previousClose) * 100;
      
      const indicators = data.chart.result[0].indicators;
      let ohlc = null;
      if (indicators && indicators.quote && indicators.quote.length > 0) {
        const quote = indicators.quote[0];
        if (quote.open && quote.open.length > 0) {
          ohlc = {
            open: quote.open[quote.open.length - 1] || 0,
            high: quote.high ? quote.high[quote.high.length - 1] : 0,
            low: quote.low ? quote.low[quote.low.length - 1] : 0
          };
        }
      }
      
      return {
        price: price,
        change: changePercent,
        previousClose: previousClose,
        volume: meta.regularMarketVolume || 0,
        open: ohlc?.open || price,
        high: ohlc?.high || price,
        low: ohlc?.low || price
      };
    } else {
      throw new Error('Data tidak ditemukan');
    }
  } catch (error) {
    console.error(`❌ Gagal fetch ${symbol}:`, error.message);
    return null;
  }
}

// ===== 9. DETEKSI O=L / O=H =====
function detectStrategy(open, high, low, current) {
  const isOpenLow = open === low;
  const isOpenHigh = open === high;
  const timeSinceOpen = entryTime ? (Date.now() - entryTime) / 1000 : 0;
  
  let status = 'standby';
  let message = '';
  let signal = '';
  
  if (isOpenLow) {
    if (timeSinceOpen < 15) {
      status = 'detected';
      message = `⏳ O=L DETECTED - Tunggu ${Math.round(15 - timeSinceOpen)} detik...`;
      signal = 'WAITING';
    } else if (timeSinceOpen >= 15 && current > open) {
      status = 'valid';
      message = `✅ O=L VALID - Harga di atas open (${formatPrice(current)})`;
      signal = 'HAKA (BUY)';
    } else if (timeSinceOpen >= 15 && current <= open) {
      status = 'failed';
      message = `❌ O=L FAILED - Harga jebol di bawah open!`;
      signal = 'CANCEL';
    }
  } else if (isOpenHigh) {
    if (timeSinceOpen < 15) {
      status = 'detected';
      message = `⏳ O=H DETECTED - Tunggu ${Math.round(15 - timeSinceOpen)} detik...`;
      signal = 'WAITING';
    } else if (timeSinceOpen >= 15 && current < open) {
      status = 'valid';
      message = `✅ O=H VALID - Harga di bawah open (${formatPrice(current)})`;
      signal = 'HAKI (SELL)';
    } else if (timeSinceOpen >= 15 && current >= open) {
      status = 'failed';
      message = `❌ O=H FAILED - Harga naik di atas open!`;
      signal = 'CANCEL';
    }
  } else {
    status = 'standby';
    message = `⏸️ Tidak ada pola O=L / O=H`;
    signal = 'STAND BY';
  }
  
  return { status, message, signal, isOpenLow, isOpenHigh };
}

// ===== 10. SELECT STOCK =====
async function selectStock(stock) {
  if (!isDataLoaded) {
    aiInsightText.textContent = '⚠️ Data masih loading, tunggu sebentar...';
    return;
  }
  
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
  
  selectedStock = stock;
  selectedCode = stock.code;
  searchInput.value = `${stock.code} - ${stock.name}`;
  dropdown.style.display = "none";
  priceHistory = [];
  strategyStatus = 'standby';
  entryTime = Date.now();
  isFetching = true;
  
  mPrice.textContent = "⏳ Loading...";
  activeCode.textContent = stock.code;
  activeName.textContent = stock.name;
  fHealth.textContent = stock.health || "N/A";
  fValuation.textContent = stock.per || "N/A";
  fRisk.textContent = stock.risk || "MEDIUM";
  aiInsightText.textContent = "Mengambil data dari Yahoo Finance...";
  
  await fetchAndUpdatePrice();
  isFetching = false;
  
  updateInterval = setInterval(fetchAndUpdatePrice, 3000);
}

// ===== 11. FETCH & UPDATE HARGA =====
async function fetchAndUpdatePrice() {
  if (!selectedCode || isFetching) return;
  
  isFetching = true;
  
  try {
    const data = await fetchRealTimePrice(selectedCode);
    
    if (data && data.price > 0) {
      currentPrice = data.price;
      openPrice = data.open || currentPrice;
      highPrice = data.high || currentPrice;
      lowPrice = data.low || currentPrice;
      
      priceHistory.push(currentPrice);
      if (priceHistory.length > 30) priceHistory.shift();
      
      const strategy = detectStrategy(openPrice, highPrice, lowPrice, currentPrice);
      strategyStatus = strategy.status;
      
      // ===== UPDATE UI =====
      mPrice.textContent = formatPrice(currentPrice);
      mPrice.style.color = data.change >= 0 ? "#00c897" : "#ff5470";
      setTimeout(() => mPrice.style.color = "", 600);
      
      const isHaka = data.change >= 0 && strategy.signal !== 'HAKI (SELL)';
      const pressure = Math.min(Math.abs(data.change) * 2 + 30, 90);
      
      if (strategy.signal === 'HAKA (BUY)') {
        signalBadge.textContent = `🔥 HAKA (BUY) - O=L`;
        signalBadge.className = "badge haka";
        percentValue.textContent = `+${pressure.toFixed(1)}%`;
        percentValue.className = "percent-number";
        mImpulse.textContent = "🟢 BIG BUY INFLOW";
      } else if (strategy.signal === 'HAKI (SELL)') {
        signalBadge.textContent = `💥 HAKI (SELL) - O=H`;
        signalBadge.className = "badge haki";
        percentValue.textContent = `-${pressure.toFixed(1)}%`;
        percentValue.className = "percent-number negative";
        mImpulse.textContent = "🔴 DISTRIBUTION DETECTED";
      } else if (strategy.signal === 'WAITING') {
        signalBadge.textContent = `⏳ WAITING CONFIRMATION`;
        signalBadge.className = "badge standby";
        percentValue.textContent = `--`;
        percentValue.className = "percent-number";
        mImpulse.textContent = "⏳ DETECTING...";
      } else if (strategy.signal === 'CANCEL') {
        signalBadge.textContent = `🚫 STRATEGY FAILED`;
        signalBadge.className = "badge standby";
        percentValue.textContent = `❌`;
        percentValue.className = "percent-number negative";
        mImpulse.textContent = "⚠️ CANCEL ORDER";
      } else {
        signalBadge.textContent = `⏸️ STAND BY`;
        signalBadge.className = "badge standby";
        percentValue.textContent = `--`;
        percentValue.className = "percent-number";
        mImpulse.textContent = "⏳ NO PATTERN";
      }
      
      const velocity = Math.min(Math.abs(data.change) * 1.5 + 0.3, 8);
      mVelocity.textContent = `${velocity.toFixed(1)} Ticks/sec`;
      
      if (data.volume > 0) {
        mVolume.textContent = `${(data.volume / 1000).toFixed(1)}K lot`;
      } else {
        mVolume.textContent = "-";
      }
      
      // ===== AI INSIGHT =====
      let insightText = `📊 ${selectedStock.name}\n`;
      insightText += `Open: ${formatPrice(openPrice)} | High: ${formatPrice(highPrice)} | Low: ${formatPrice(lowPrice)}\n`;
      insightText += `\n${strategy.message}`;
      
      if (strategy.status === 'valid') {
        const sl = currentPrice * 0.98;
        const tp = currentPrice * 1.025;
        insightText += `\n\n🎯 Entry: ${formatPrice(currentPrice)}`;
        insightText += `\n🛑 SL: ${formatPrice(sl)} (-2%)`;
        insightText += `\n🎯 TP: ${formatPrice(tp)} (+2.5%)`;
      }
      
      aiInsightText.textContent = insightText;
      
      // ===== RISK MANAGEMENT =====
      if (strategy.status === 'valid') {
        const sl = currentPrice * 0.98;
        const tp = currentPrice * 1.025;
        slValue.textContent = formatPrice(sl);
        tpValue.textContent = formatPrice(tp);
      } else {
        slValue.textContent = "-";
        tpValue.textContent = "-";
      }
      
      const riskMap = { 
        "LOW": "≤ 15%", 
        "LOW-MEDIUM": "≤ 10%", 
        "MEDIUM": "≤ 7%", 
        "MEDIUM-HIGH": "≤ 5%", 
        "HIGH": "≤ 3%", 
        "VERY HIGH": "≤ 1.5%" 
      };
      lotValue.textContent = riskMap[selectedStock?.risk] || "≤ 5%";
      
      // ===== SIGNAL LOG =====
      const now = new Date();
      const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const logEntry = document.createElement("div");
      logEntry.className = "log-entry";
      
      let logStatus = '';
      if (strategy.status === 'valid') {
        logStatus = `✅ ${strategy.isOpenLow ? 'O=L' : 'O=H'} VALID`;
      } else if (strategy.status === 'detected') {
        logStatus = `⏳ ${strategy.isOpenLow ? 'O=L' : 'O=H'} DETECTED`;
      } else if (strategy.status === 'failed') {
        logStatus = `❌ ${strategy.isOpenLow ? 'O=L' : 'O=H'} FAILED`;
      } else {
        logStatus = `⏸️ NO PATTERN`;
      }
      
      logEntry.innerHTML = `
        <span class="log-time">[${time}]</span>
        <span class="log-action ${data.change >= 0 ? 'buy' : 'sell'}">${strategy.signal}</span>
        <span>@ ${formatPrice(currentPrice)}</span>
        <span style="color:#4a5568;font-size:9px;">${logStatus}</span>
      `;
      
      const emptyLog = signalLog.querySelector(".log-empty");
      if (emptyLog) emptyLog.remove();
      signalLog.prepend(logEntry);
      
      while (signalLog.children.length > 20) {
        signalLog.removeChild(signalLog.lastChild);
      }
      
      drawSparkline(priceHistory);
      
    } else {
      console.warn('⚠️ Data tidak valid untuk', selectedCode);
    }
  } catch (error) {
    console.error('❌ Error update price:', error);
  } finally {
    isFetching = false;
  }
}

// ===== 12. SPARKLINE =====
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
  
  ctx.strokeStyle = '#1a1f28';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, h/2);
  ctx.lineTo(w, h/2);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.strokeStyle = data[data.length-1] > data[0] ? '#00c897' : '#ff5470';
  ctx.lineWidth = 2;
  
  data.forEach((val, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - padding - ((val - min) / range) * (h - padding * 2);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  
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
  
  const lastX = w;
  const lastY = h - padding - ((data[data.length-1] - min) / range) * (h - padding * 2);
  ctx.beginPath();
  ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
  ctx.fillStyle = data[data.length-1] > data[0] ? '#00c897' : '#ff5470';
  ctx.fill();
}

// ===== 13. CLEAR LOG =====
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

// ===== 14. INIT =====
async function init() {
  console.log('🚀 AI Scalper Terminal v5.0 - Independent JSON Loader');
  console.log('📌 Loading data dari stocks-data.json...');
  
  const loaded = await loadStockData();
  
  if (loaded) {
    console.log(`✅ ${IHSG_STOCKS.length} saham siap digunakan!`);
    console.log('📋 Fitur: O=L / O=H Detection + SL/TP Otomatis');
    aiInsightText.textContent = `✅ ${IHSG_STOCKS.length} saham IHSG siap. Silakan cari emiten.`;
  } else {
    console.warn('⚠️ Data tidak bisa dimuat, coba refresh halaman.');
    aiInsightText.textContent = `⚠️ Gagal load data saham. Cek file stocks-data.json.`;
  }
  
  // Default state
  activeCode.textContent = "SELECT";
  activeName.textContent = "Pilih emiten untuk memulai";
  fHealth.textContent = "-";
  fValuation.textContent = "-";
  fRisk.textContent = "-";
  slValue.textContent = "-";
  tpValue.textContent = "-";
  lotValue.textContent = "-";
  drawSparkline([]);
}

// ===== 15. JALANKAN =====
init();

console.log('✅ Siap!');
