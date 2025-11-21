import React, { useState } from 'react';

export default function App() {
  const [homeId, setHomeId] = useState('');
  const [awayId, setAwayId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function simulate() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/simulate?homeId=${encodeURIComponent(homeId)}&awayId=${encodeURIComponent(awayId)}&maxGoals=6`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setResult(data);
    } catch (e) {
      alert('Error: ' + (e.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>Football Match Simulator</h1>
      <div className="controls">
        <input placeholder="Home Team ID" value={homeId} onChange={e=>setHomeId(e.target.value)} />
        <input placeholder="Away Team ID" value={awayId} onChange={e=>setAwayId(e.target.value)} />
        <button onClick={simulate} disabled={loading || !homeId || !awayId}>{loading ? 'Simulating...' : 'Simulate'}</button>
      </div>

      {result && (
        <div className="results">
          <div className="lambda">Home λ: <strong>{result.lambdaHome.toFixed(2)}</strong>  — Away λ: <strong>{result.lambdaAway.toFixed(2)}</strong></div>

          <h2>Top Predictions</h2>
          <div className="toplist">
            {result.top10.map((t,i)=>(
              <div key={i} className="row">
                <div className="score">{t.score}</div>
                <div className="bar" style={{width: `${Math.max(1, (t.p*100))}%`}} />
                <div className="pct">{(t.p*100).toFixed(2)}%</div>
              </div>
            ))}
          </div>

          <h3>Simulation sample frequencies (preview)</h3>
          <pre className="pre">{JSON.stringify(result.simFrequencies, null, 2)}</pre>
        </div>
      )}
      <footer>Note: Set <code>API_KEY</code> environment variable in Vercel for live H2H data.</footer>
    </div>
  );
}
