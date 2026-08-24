// ====================================================================
// DATABASE IHSG EMITEN & SYSTEM ENGINE
// ====================================================================

// Sample Database Emiten IHSG (Bisa diperluas ke 800+ emiten)
const IHSG_STOCKS = [
  { code: "CASH", name: "PT Cashlez Worldwide Indonesia Tbk", health: "FAIR", per: "12.4x", risk: "MEDIUM", summary: "Transaksi digital meningkat. Aman scalping dengan lot terkontrol." },
  { code: "PADI", name: "PT Minna Padi Investama Sekuritas Tbk", health: "SPECULATIVE", per: "N/A", risk: "HIGH", summary: "Saham volitilitas tinggi/gorengan. Murni trading momentum HAKA kilat." },
  { code: "BBRI", name: "PT Bank Rakyat Indonesia (Persero) Tbk", health: "VERY STRONG", per: "11.2x", risk: "LOW", summary: "Perbankan Tier-1, dividen solid. Sangat aman HAKA skala besar." },
  { code: "ANTM", name: "PT Aneka Tambang Tbk", health: "STRONG", per: "15.1x", risk: "LOW-MEDIUM", summary: "Sentimen komoditas nikel & emas positif. Katalis teknikal kuat." },
  { code: "TLKM", name: "PT Telkom Indonesia Tbk", health: "VERY STRONG", per: "14.0x", risk: "LOW", summary: "Defensif bluechip, cashflow stabil. Aman untuk rebound scalping." },
  { code: "GOTO", name: "PT GoTo Gojek Tokopedia Tbk", health: "TURNAROUND", per: "N/A", risk: "HIGH", summary: "Volatilitas tinggi, perhatikan aliran arus kas dana asing (foreign flow)." }
];

let selectedStock = null;

// 1. Cek Jam Buka Pasar (IHSG Open Market Status)
function checkMarketStatus() {
  const now = new Date();
  const day = now.getDay(); // 0: Mingu, 6: Sabtu
  const hour = now.getHours();
  
  const statusElem = document.getElementById("marketStatus");
  
  // Sederhana: Senin-Jumat jam 09:00 - 16:00 WIB
  if (day >= 1 && day <= 5 && hour >= 9 && hour < 16) {
    statusElem.innerHTML = `<span class="dot open"></span> MARKET STATUS: 🟢 OPEN (ACTIVE)`;
  } else {
    statusElem.innerHTML = `<span class="dot"></span> MARKET STATUS: 🔴 CLOSED / OFF-HOURS`;
  }
}

// 2. Logic Autocomplete Search Engine
const searchInput = document.getElementById("stockSearch");
const dropdown = document.getElementById("searchResults");

searchInput.addEventListener("input", (e) => {
  const query = e.target.value.toUpperCase().trim();
  dropdown.innerHTML = "";

  if (query.length === 0) {
    dropdown.style.display = "none";
    return;
  }

  const filtered = IHSG_STOCKS.filter(s => s.code.includes(query) || s.name.toUpperCase().includes(query));

  if (filtered.length > 0) {
    dropdown.style.display = "block";
    filtered.forEach(stock => {
      const item = document.createElement("div");
      item.className = "search-item";
      item.innerHTML = `<span class="s-code">${stock.code}</span><span class="s-name">${stock.name}</span>`;
      item.onclick = () => selectStock(stock);
      dropdown.appendChild(item);
    });
  } else {
    dropdown.style.display = "none";
  }
});

// 3. Select Stock & Activate Deep Focus Analysis
function selectStock(stock) {
  selectedStock = stock;
  searchInput.value = `${stock.code} - ${stock.name}`;
  dropdown.style.display = "none";

  // Update Fundamental Module
  document.getElementById("activeCode").innerText = stock.code;
  document.getElementById("activeName").innerText = stock.name;
  document.getElementById("fHealth").innerText = stock.health;
  document.getElementById("fValuation").innerText = stock.per;
  document.getElementById("fRisk").innerText = stock.risk;
  document.getElementById("aiInsightText").innerText = stock.summary;

  // Trigger Immediate Calculation
  processScalpingAI();
}

// 4. AI & Velocity Engine (Deep Focus Simulation)
function processScalpingAI() {
  if (!selectedStock) return;

  // Simulasi kalkulasi dinamika tick & volume ratio
  const isHaka = Math.random() > 0.45; // Predisposisi
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

// Loop Refresh Real-time tiap 1.5 detik jika saham dipilih
setInterval(() => {
  checkMarketStatus();
  if (selectedStock) {
    processScalpingAI();
  }
}, 1500);

// Init awal
checkMarketStatus();