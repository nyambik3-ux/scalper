// api/quote.js - Proxy untuk Yahoo Finance
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { symbol } = req.query;
  
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol required' });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.JK`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.chart?.result?.length > 0) {
      const meta = data.chart.result[0].meta;
      const price = meta.regularMarketPrice || 0;
      const previousClose = meta.previousClose || price;
      
      return res.status(200).json({
        success: true,
        price: price,
        change: previousClose > 0 ? ((price - previousClose) / previousClose) * 100 : 0,
        volume: meta.regularMarketVolume || 0
      });
    }
    throw new Error('Data not found');
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
