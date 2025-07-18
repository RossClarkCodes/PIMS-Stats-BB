const fs = require('fs');
const https = require('https');

const TEAMS = [
  { id: 20, name: 'Winnipeg Blue Bombers', abbr: 'WPG' },
  { id: 1, name: 'BC Lions', abbr: 'BC' },
  { id: 6, name: 'Calgary Stampeders', abbr: 'CGY' },
  { id: 7, name: 'Edmonton Elks', abbr: 'EDM' },
  { id: 8, name: 'Hamilton Tiger Cats', abbr: 'HAM' },
  { id: 11, name: 'Montreal Alouettes', abbr: 'MTL' },
  { id: 13, name: 'Ottawa Redblacks', abbr: 'OTT' },
  { id: 17, name: 'Saskatchewan Roughriders', abbr: 'SSK' },
  { id: 19, name: 'Toronto Argonauts', abbr: 'TOR' }
];

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function fetchTeamStats(team) {
  const url = `https://echo.pims.cfl.ca/api/stats/teams/pims/${team.id}`;
  const data = await makeRequest(url);
  // Find 2025 season
  const season = (data.seasons || []).find(s => s.season === 2025);
  return {
    team: team.name,
    team_id: team.id,
    abbr: team.abbr,
    season: 2025,
    stats: season || {}
  };
}

async function main() {
  const allStats = [];
  let wpgStats = null;
  for (const team of TEAMS) {
    try {
      const stats = await fetchTeamStats(team);
      allStats.push(stats);
      if (team.id === 20) wpgStats = stats;
      console.log(`Fetched stats for ${team.name}`);
    } catch (e) {
      console.error(`Error fetching stats for ${team.name}:`, e.message);
    }
  }
  // Write all teams JSON
  if (!fs.existsSync('public')) fs.mkdirSync('public');
  fs.writeFileSync('public/all_teams_2025_stats.json', JSON.stringify(allStats, null, 2));
  // Write WPG JSON
  if (wpgStats) fs.writeFileSync('public/team_wpg_2025_stats.json', JSON.stringify(wpgStats, null, 2));
  // Write all teams XML
  const allTeamsXML = '<?xml version="1.0" encoding="UTF-8"?>\n<Teams2025Stats>\n' +
    allStats.map(team => {
      return `  <Team>\n    <Name>${team.team}</Name>\n    <ID>${team.team_id}</ID>\n    <Abbr>${team.abbr}</Abbr>\n    <Season>${team.season}</Season>\n    <Stats>\n` +
        Object.entries(team.stats).map(([k,v]) => `      <${k}>${v}</${k}>`).join('\n') +
        '\n    </Stats>\n  </Team>';
    }).join('\n') + '\n</Teams2025Stats>';
  fs.writeFileSync('public/all_teams_2025_stats.xml', allTeamsXML);
  // Write WPG XML
  if (wpgStats) {
    const wpgXML = '<?xml version="1.0" encoding="UTF-8"?>\n<Team2025Stats>\n' +
      `  <Name>${wpgStats.team}</Name>\n  <ID>${wpgStats.team_id}</ID>\n  <Abbr>${wpgStats.abbr}</Abbr>\n  <Season>${wpgStats.season}</Season>\n  <Stats>\n` +
      Object.entries(wpgStats.stats).map(([k,v]) => `    <${k}>${v}</${k}>`).join('\n') +
      '\n  </Stats>\n</Team2025Stats>';
    fs.writeFileSync('public/team_wpg_2025_stats.xml', wpgXML);
  }
  console.log('All team stats files written.');
}

main().catch(e => { console.error(e); process.exit(1); }); 