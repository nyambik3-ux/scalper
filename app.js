// ====================================================================
// AI SCALPER ENGINE - DYNAMIC EMITEN LOADER
// ====================================================================

let IHSG_STOCKS = [];
let selectedStock = null;

// 1. Fetch Database Saham dari File JSON
async function loadStockDatabase() {
  try {
    const response = await fetch('stocks-data.json');
    IHSG_STOCKS = await response.json();
    console.log(`[SYSTEM] Loaded ${IHSG_STOCKS.length} emiten IHSG successfully.`);
  } catch (error) {
    console.error("[ERROR] Failed to load stock database:", error);
  }
}

// 2. Cek Jam Buka Pasar (IHSG Open Market Status)
function checkMarketStatus() {
  const now = new Date();
  const day = now.getDay(); // 0: Minggu, 6: Sabtu
  const hour = now.getHours();
  
  const statusElem = document.getElementById("marketStatus");
  
  if (day >= 1 && day <= 5 && hour >= 9 && hour < 16) {
    statusElem.innerHTML = `<span class="dot open"></span> MARKET STATUS: 🟢 OPEN (ACTIVE)`;
  } else {
    statusElem.innerHTML = `<span class="dot"></span> MARKET STATUS: 🔴 CLOSED / OFF-HOURS`;
  }
}

// 3. Autocomplete Search Engine
const searchInput = document.getElementById("stockSearch");
const dropdown = document.getElementById("searchResults");

searchInput.addEventListener("input", (e) => {
  const query = e.target.value.toUpperCase().trim();
  dropdown.innerHTML = "";

  if (query.length === 0) {
    dropdown.style.display = "none";
    return;
  }

  // Pencarian dinamis ke seluruh database
  const filtered = IHSG_STOCKS.filter(s => s.code.includes(query) || s.name.toUpperCase().includes(query));

  if (filtered.length > 0) {
    dropdown.style.display = "block";
    filtered.forEach(stock => {
      const item = document.createElement("div");
      item.className = "search-item";
      item.innerHTML = `
        <div>
          <span class="s-code">${stock.code}</span>
          <span class="s-name"> - ${stock.name}</span>
        </div>
        <span style="font-size: 9px; color: #58a6ff;">${stock.sector || ''}</span>
      `;
      item.onclick = () => selectStock(stock);
      dropdown.appendChild(item);
    });
  } else {
    dropdown.style.display = "none";
  }
});

// 4. Pilih Saham & Aktifkan Deep Focus Module
function selectStock(stock) {
  selectedStock = stock;
  searchInput.value = `${stock.code} - ${stock.name}`;
  dropdown.style.display = "none";

  // Update Tampilan Fundamental
  document.getElementById("activeCode").innerText = stock.code;
  document.getElementById("activeName").innerText = stock.name;
  document.getElementById("fHealth").innerText = stock.health;
  document.getElementById("fValuation").innerText = stock.per;
  document.getElementById("fRisk").innerText = stock.risk;
  document.getElementById("aiInsightText").innerText = stock.summary;

  processScalpingAI();
}

// 5. AI Scalping Engine (Simulation Logic)
function processScalpingAI() {
  if (!selectedStock) return;

  const isHaka = Math.random() > 0.45;
  const ratio = (Math.random() * (92 - 58) + 58).toFixed(1);
  const velocity = (Math.random() * (4.5 - 1.2) + 1.2).toFixed(1);
  
  const badge = document.getElementById("signalBadge");
  const percentVal = document.getElementById("percentValue");
  const percentLbl = document.getElementById("percentLabel");

  if (isHaka) {
    badge.innerText = "🔥 HAKA (BUY)";
    badge.className = "signal-badge haka";
    percentVal.innerText = "+" + ratio + "%";
    percentVal.style.color = "#3fb950";
    percentLbl.innerText = "BUY PRESSURE (DOMINASI)";
    document.getElementById("mImpulse").innerText = "BIG BUY INFLOW";
  } else {
    badge.innerText = "💥 HAKI (SELL)";
    badge.className = "signal-badge haki";
    percentVal.innerText = "-" + ratio + "%";
    percentVal.style.color = "#f85149";
    percentLbl.innerText = "SELL PRESSURE (DOMINASI)";
    document.getElementById("mImpulse").innerText = "DISTRIBUTION DETECTED";
  }

  document.getElementById("mPrice").innerText = (Math.floor(Math.random() * 500) * 10 + 100).toLocaleString();
  document.getElementById("mVelocity").innerText = `${velocity} Ticks/sec`;
}

// Inisialisasi & Loop Sync
document.addEventListener("DOMContentLoaded", async () => {
  await loadStockDatabase();
  checkMarketStatus();
  
  setInterval(() => {
    checkMarketStatus();
    if (selectedStock) {
      processScalpingAI();
    }
  }, 1500);
});
