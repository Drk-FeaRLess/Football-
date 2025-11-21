import fetch from 'node-fetch';

function poissonPmf(k, lambda) {
  let res = Math.exp(-lambda);
  let numer = 1;
  for (let i=1;i<=k;i++) numer *= lambda / i;
  return res * numer;
}

function computeAverages(fixtures, teamId) {
  if (!fixtures || fixtures.length === 0) return { avgFor:0, avgAgainst:0 };
  let sumFor=0, sumAgainst=0, cnt=0;
  for (const f of fixtures) {
    if (!f.teams || !f.goals) continue;
    const isHome = (f.teams.home && String(f.teams.home.id) === String(teamId));
    const goalsFor = isHome ? f.goals.home : f.goals.away;
    const goalsAgainst = isHome ? f.goals.away : f.goals.home;
    if (goalsFor === null || goalsAgainst === null) continue;
    sumFor += goalsFor;
    sumAgainst += goalsAgainst;
    cnt++;
  }
  if (cnt===0) return { avgFor:0, avgAgainst:0 };
  return { avgFor: sumFor/cnt, avgAgainst: sumAgainst/cnt };
}

export default async function handler(req, res) {
  try {
    const { homeId, awayId, maxGoals = 6 } = req.query;
    if (!homeId || !awayId) return res.status(400).json({ error:'homeId and awayId required' });

    const API_BASE = process.env.API_BASE || 'https://v3.football.api-sports.io';
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) return res.status(500).json({ error:'API_KEY not set in environment' });

    const h2hUrl = `${API_BASE}/fixtures/headtohead?h2h=${homeId}-${awayId}`;
    const resp = await fetch(h2hUrl, { headers: { 'x-apisports-key': API_KEY } });
    const j = await resp.json();
    const fixtures = (j && j.response) ? j.response : [];

    const homeMatches = fixtures.filter(f => f.teams && (String(f.teams.home.id)===String(homeId) || String(f.teams.away.id)===String(homeId)));
    const awayMatches = fixtures.filter(f => f.teams && (String(f.teams.home.id)===String(awayId) || String(f.teams.away.id)===String(awayId)));

    const homeAvg = computeAverages(homeMatches, homeId);
    const awayAvg = computeAverages(awayMatches, awayId);

    const HOME_ADV = 1.08;
    const lambdaHome = Math.max(0.12, ((homeAvg.avgFor || 0) + (awayAvg.avgAgainst || 0)) / 2 * HOME_ADV);
    const lambdaAway = Math.max(0.08, ((awayAvg.avgFor || 0) + (homeAvg.avgAgainst || 0)) / 2);

    const maxG = parseInt(maxGoals);
    const matrix = [];
    for (let i=0;i<=maxG;i++){
      matrix[i]=[];
      const pH = poissonPmf(i, lambdaHome);
      for (let jg=0;jg<=maxG;jg++){
        const pA = poissonPmf(jg, lambdaAway);
        matrix[i][jg] = pH * pA;
      }
    }

    const flat = [];
    for (let i=0;i<=maxG;i++) for (let jg=0;jg<=maxG;jg++) flat.push({score:`${i}-${jg}`, p: matrix[i][jg], home:i, away:jg});
    flat.sort((a,b)=>b.p-a.p);
    const top10 = flat.slice(0,10);

    // small Monte Carlo sample
    function samplePoisson(lambda) {
      let L = Math.exp(-lambda), p=1, k=0;
      while (p > L) { k++; p *= Math.random(); if (k>30) break; }
      return k-1;
    }
    const simFreq = {};
    const sims = 5000;
    for (let s=0;s<sims;s++){
      const gh = samplePoisson(lambdaHome);
      const ga = samplePoisson(lambdaAway);
      const key = `${gh}-${ga}`;
      simFreq[key] = (simFreq[key] || 0) + 1;
    }

    return res.json({ lambdaHome, lambdaAway, top10, probabilitiesMatrix: matrix, simFrequencies: simFreq, rawAverages:{homeAvg,awayAvg} });

  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
