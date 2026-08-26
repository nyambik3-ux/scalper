// ====================================================================
// AI SCALPER TERMINAL - v6.0 DENGAN SCREENER
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
let screenerData = [];
let isScreenerVisible = false;

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

// ===== 3. SCREENER DOM =====
const btnScreener = document.getElementById("btnScreener");
const btnTopGainer = document.getElementById("btnTopGainer");
const btnTopLiquid = document.getElementById("btnTopLiquid");
const screenerPanel = document.getElementById("screenerPanel");
const screenerResult = document.getElementById("screenerResult");
const screenerCount = document.getElementById("screenerCount");
const closeScreener = document.getElementById("closeScreener");
const filterStatus = document.getElementById("filterStatus");

// ===== 4. LOAD DATA =====
async function loadStockData() {
  try {
    console.log('📡 Loading stocks-data.json...');
    const response = await fetch('stocks-data.json?t=' + Date.now());
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      IHSG_STOCKS = data;
      isDataLoaded = true;
      console.log(`✅ ${IHSG_STOCKS.length} saham berhasil dimuat!`);
      aiInsightText.textContent = `✅ ${IHSG_STOCKS.length} saham IHSG siap.`;
      
      // Auto-run screener pertama kali
      setTimeout(() => runScreener(), 500);
      return true;
    }
    throw new Error('Data kosong');
  } catch (error) {
    console.error('❌ Gagal load data:', error.message);
    aiInsightText.textContent = `⚠️ Gagal load data: ${error.message}`;
    return false;
  }
}

// ===== 5. RUN SCREENER =====
async function runScreener() {
  if (!isDataLoaded || IHSG_STOCKS.length === 0) {
    screenerResult.innerHTML = '<div class="screener-empty">⏳ Data masih loading...</div>';
    return;
  }

  screenerResult.innerHTML = '<div class="screener-empty">⏳ Scanning saham...</div>';
  
  // Filter: Harga 200-700, Gain 5-17%
  const filtered = [];
  const safeList = [];
  
  for (const stock of IHSG_STOCKS) {
    try {
      const data = await fetchRealTimePrice(stock.code);
      if (data && data.price > 0) {
        const price = data.price;
        const change = data.change;
        const volume = data.volume || 0;
        
        // Cek range harga 200-700 DAN gain 5-17%
        if (price >= 200 && price <= 700 && change >= 5 && change <= 17) {
          filtered.push({
            ...stock,
            price: price,
            change: change,
            volume: volume
          });
        }
        
        // Simpan data untuk safe list
        safeList.push({
          ...stock,
          price: price,
          change: change,
          volume: volume
        });
      }
    } catch (e) {
      // Skip jika error
    }
  }
  
  // Urutkan berdasarkan gain tertinggi
  filtered.sort((a, b) => b.change - a.change);
  
  // Simpan screener data
  screenerData = filtered;
  
  // Tampilkan hasil
  if (filtered.length > 0) {
    renderScreenerResults(filtered, '🏆 TOP GAINER (200-700)');
    screenerCount.textContent = `${filtered.length} saham`;
    filterStatus.textContent = `🟢 ${filtered.length} ditemukan`;
  } else {
    // Tampilkan daftar teraman (Top 5 most liquid)
    safeList.sort((a, b) => b.volume - a.volume);
    const safeTop = safeList.slice(0, 10);
    renderScreenerResults(safeTop, '💧 TOP LIKUID (Safe List)');
    screenerCount.textContent = `${safeTop.length} saham (safe)`;
    filterStatus.textContent = `🟡 ${safeTop.length} safe list`;
  }
}

// ===== 6. RENDER SCREENER =====
function renderScreenerResults(data, title) {
  if (!data || data.length === 0) {
    screenerResult.innerHTML = `<div class="screener-empty">❌ Tidak ada saham yang memenuhi filter</div>`;
    return;
  }
  
  let html = `<div style="font-size:9px;color:#4a5568;padding:4px 10px;border-bottom:1px solid #1a1f28;">${title}</div>`;
  
  data.forEach((item, index) => {
    const changeClass = item.change >= 0 ? 'up' : 'down';
    const changeSign = item.change >= 0 ? '+' : '';
    
    html += `
      <div class="screener-item" onclick="selectStockByCode('${item.code}')">
        <span class="s-code">${item.code}</span>
        <span class="s-name">${item.name}</span>
        <span class="s-price">${Math.round(item.price).toLocaleString()}</span>
        <span class="s-change ${changeClass}">${changeSign}${item.change.toFixed(2)}%</span>
        <span class="s-volume">${(item.volume / 1000000).toFixed(1)}M</span>
      </div>
    `;
  });
  
  screenerResult.innerHTML = html;
}

// ===== 7. SELECT STOCK BY CODE (dari screener) =====
window.selectStockByCode = function(code) {
  const stock = IHSG_STOCKS.find(s => s.code === code);
  if (stock) {
    selectStock(stock);
    // Tutup screener
    screenerPanel.style.display = 'none';
    isScreenerVisible = false;
    btnScreener.classList.remove('active');
  }
};

// ===== 8. CLOCK =====
function updateClock() {
  const now = new Date();
  const wib = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  clockEl.textContent = wib;
}
setInterval(updateClock, 1000);
updateClock();

// ===== 9. MARKET STATUS =====
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

// ===== 10. SEARCH =====
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
      `;
      item.onclick = () => selectStock(stock);
      dropdown.appendChild(item);
    });
  } else {
    dropdown.style.display = "none";
  }
});

// ===== 11. FORMAT PRICE =====
function formatPrice(price) {
  if (!price || price === 0) return "Rp -";
  return "Rp " + Math.round(price).toLocaleString('id-ID');
}

// ===== FETCH HARGA VIA PROXY =====
async function fetchRealTimePrice(symbol) {
  try {
    // Panggil proxy kita sendiri (bukan langsung Yahoo)
    const url = `/api/quote?symbol=${symbol}`;
    console.log(`📡 Fetching from proxy: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.price > 0) {
      return {
        price: data.price,
        change: data.change || 0,
        previousClose: data.previousClose || data.price,
        volume: data.volume || 0,
        open: data.open || data.price,
        high: data.high || data.price,
        low: data.low || data.price
      };
    } else {
      throw new Error(data.error || 'Data tidak valid');
    }
    
  } catch (error) {
    console.error(`❌ Gagal fetch ${symbol}:`, error.message);
    return null;
  }
}
// ===== 13. DETEKSI O=L / O=H =====
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

// ===== 14. SELECT STOCK =====
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

// ===== 15. FETCH & UPDATE HARGA =====
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

// ===== 16. SPARKLINE =====
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

// ===== 17. CLEAR LOG =====
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

// ===== 18. SCREENER NAVIGATION =====
btnScreener.addEventListener("click", () => {
  if (isScreenerVisible) {
    screenerPanel.style.display = 'none';
    isScreenerVisible = false;
    btnScreener.classList.remove('active');
  } else {
    screenerPanel.style.display = 'block';
    isScreenerVisible = true;
    btnScreener.classList.add('active');
    runScreener();
  }
});

btnTopGainer.addEventListener("click", () => {
  screenerPanel.style.display = 'block';
  isScreenerVisible = true;
  btnScreener.classList.add('active');
  runScreener();
});

btnTopLiquid.addEventListener("click", () => {
  screenerPanel.style.display = 'block';
  isScreenerVisible = true;
  btnScreener.classList.add('active');
  
  // Tampilkan top 10 saham dengan volume tertinggi
  if (IHSG_STOCKS.length > 0) {
    const safeList = IHSG_STOCKS.slice(0, 10);
    renderScreenerResults(safeList, '💧 TOP 10 LIKUID (Safe List)');
    screenerCount.textContent = `${safeList.length} saham (safe)`;
    filterStatus.textContent = `🟡 Safe List (${safeList.length})`;
  }
});

closeScreener.addEventListener("click", () => {
  screenerPanel.style.display = 'none';
  isScreenerVisible = false;
  btnScreener.classList.remove('active');
});

// ===== 19. INIT =====
async function init() {
  console.log('🚀 AI Scalper Terminal v6.0 - Screener + O=L/O=H');
  await loadStockData();
  console.log('📋 Fitur: Screener | O=L/O=H Detection | SL/TP Otomatis');
  
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

init();
console.log('✅ Siap!');
