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

function makeRequest(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Request timeout after ${timeout}ms`));
    }, timeout);

    https.get(url, (res) => {
      clearTimeout(timer);
      
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    }).on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

async function fetchTeamStats(team) {
  const url = `https://echo.pims.cfl.ca/api/stats/teams/pims/${team.id}`;
  console.log(`Fetching stats for ${team.name} from ${url}`);
  
  try {
    const data = await makeRequest(url);
    // Find 2025 season
    const season = (data.seasons || []).find(s => s.season === 2025);
    
    if (!season) {
      console.warn(`No 2025 season data found for ${team.name}`);
      return {
        team: team.name,
        team_id: team.id,
        abbr: team.abbr,
        season: 2025,
        stats: {},
        error: 'No 2025 season data available'
      };
    }
    
    return {
      team: team.name,
      team_id: team.id,
      abbr: team.abbr,
      season: 2025,
      stats: season
    };
  } catch (error) {
    console.error(`Error fetching stats for ${team.name}:`, error.message);
    return {
      team: team.name,
      team_id: team.id,
      abbr: team.abbr,
      season: 2025,
      stats: {},
      error: error.message
    };
  }
}

function createFallbackFiles() {
  console.log('Creating fallback files...');
  const fallbackData = {
    message: 'Data temporarily unavailable - please try again later',
    timestamp: new Date().toISOString(),
    status: 'fallback'
  };
  
  const files = [
    'all_teams_2025_stats.json',
    'team_wpg_2025_stats.json',
    'all_teams_2025_stats.xml',
    'team_wpg_2025_stats.xml'
  ];
  
  files.forEach(file => {
    const content = file.endsWith('.json') ? 
      JSON.stringify(fallbackData, null, 2) :
      `<?xml version="1.0" encoding="UTF-8"?>\n<Error>\n  <Message>${fallbackData.message}</Message>\n  <Timestamp>${fallbackData.timestamp}</Timestamp>\n</Error>`;
    
    fs.writeFileSync(`public/${file}`, content);
    console.log(`Created fallback file: ${file}`);
  });
}

function validateFiles() {
  const requiredFiles = [
    'all_teams_2025_stats.json',
    'team_wpg_2025_stats.json',
    'all_teams_2025_stats.xml',
    'team_wpg_2025_stats.xml'
  ];
  
  const missingFiles = [];
  requiredFiles.forEach(file => {
    if (!fs.existsSync(`public/${file}`)) {
      missingFiles.push(file);
    }
  });
  
  if (missingFiles.length > 0) {
    console.error('Missing required files:', missingFiles);
    return false;
  }
  
  console.log('All required files validated successfully');
  return true;
}

async function main() {
  console.log('Starting team stats fetch...');
  
  // Ensure public directory exists
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
    console.log('Created public directory');
  }
  
  const allStats = [];
  let wpgStats = null;
  let successCount = 0;
  
  for (const team of TEAMS) {
    try {
      const stats = await fetchTeamStats(team);
      allStats.push(stats);
      if (team.id === 20) wpgStats = stats;
      
      if (!stats.error) {
        successCount++;
        console.log(`✓ Successfully fetched stats for ${team.name}`);
      } else {
        console.log(`⚠ Fetched stats for ${team.name} with error: ${stats.error}`);
      }
    } catch (e) {
      console.error(`✗ Failed to fetch stats for ${team.name}:`, e.message);
      // Add empty stats to maintain structure
      allStats.push({
        team: team.name,
        team_id: team.id,
        abbr: team.abbr,
        season: 2025,
        stats: {},
        error: e.message
      });
    }
  }
  
  console.log(`\nFetch summary: ${successCount}/${TEAMS.length} teams fetched successfully`);
  
  try {
    // Write all teams JSON
    fs.writeFileSync('public/all_teams_2025_stats.json', JSON.stringify(allStats, null, 2));
    console.log('✓ Written all_teams_2025_stats.json');
    
    // Write WPG JSON
    if (wpgStats) {
      fs.writeFileSync('public/team_wpg_2025_stats.json', JSON.stringify(wpgStats, null, 2));
      console.log('✓ Written team_wpg_2025_stats.json');
    } else {
      // Create fallback WPG file
      const fallbackWpg = {
        team: 'Winnipeg Blue Bombers',
        team_id: 20,
        abbr: 'WPG',
        season: 2025,
        stats: {},
        error: 'Failed to fetch Winnipeg stats'
      };
      fs.writeFileSync('public/team_wpg_2025_stats.json', JSON.stringify(fallbackWpg, null, 2));
      console.log('⚠ Created fallback team_wpg_2025_stats.json');
    }
    
    // Write all teams XML
    const allTeamsXML = '<?xml version="1.0" encoding="UTF-8"?>\n<Teams2025Stats>\n' +
      allStats.map(team => {
        const statsXml = Object.entries(team.stats).map(([k,v]) => `      <${k}>${v}</${k}>`).join('\n');
        const errorXml = team.error ? `      <Error>${team.error}</Error>` : '';
        return `  <Team>\n    <Name>${team.team}</Name>\n    <ID>${team.team_id}</ID>\n    <Abbr>${team.abbr}</Abbr>\n    <Season>${team.season}</Season>\n    <Stats>\n${statsXml}${errorXml ? '\n' + errorXml : ''}\n    </Stats>\n  </Team>`;
      }).join('\n') + '\n</Teams2025Stats>';
    fs.writeFileSync('public/all_teams_2025_stats.xml', allTeamsXML);
    console.log('✓ Written all_teams_2025_stats.xml');
    
    // Write WPG XML
    if (wpgStats) {
      const wpgXML = '<?xml version="1.0" encoding="UTF-8"?>\n<Team2025Stats>\n' +
        `  <Name>${wpgStats.team}</Name>\n  <ID>${wpgStats.team_id}</ID>\n  <Abbr>${wpgStats.abbr}</Abbr>\n  <Season>${wpgStats.season}</Season>\n  <Stats>\n` +
        Object.entries(wpgStats.stats).map(([k,v]) => `    <${k}>${v}</${k}>`).join('\n') +
        '\n  </Stats>\n</Team2025Stats>';
      fs.writeFileSync('public/team_wpg_2025_stats.xml', wpgXML);
      console.log('✓ Written team_wpg_2025_stats.xml');
    } else {
      // Create fallback WPG XML
      const fallbackWpgXml = `<?xml version="1.0" encoding="UTF-8"?>\n<Team2025Stats>\n  <Name>Winnipeg Blue Bombers</Name>\n  <ID>20</ID>\n  <Abbr>WPG</Abbr>\n  <Season>2025</Season>\n  <Error>Failed to fetch Winnipeg stats</Error>\n</Team2025Stats>`;
      fs.writeFileSync('public/team_wpg_2025_stats.xml', fallbackWpgXml);
      console.log('⚠ Created fallback team_wpg_2025_stats.xml');
    }
    
    // Validate all files were created
    if (!validateFiles()) {
      console.error('❌ File validation failed - creating fallback files');
      createFallbackFiles();
      process.exit(1);
    }
    
    console.log('\n🎉 All team stats files written successfully!');
    
  } catch (error) {
    console.error('❌ Error writing files:', error.message);
    console.log('Creating fallback files...');
    createFallbackFiles();
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  createFallbackFiles();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  createFallbackFiles();
  process.exit(1);
});

main().catch(e => { 
  console.error('❌ Main function error:', e.message);
  createFallbackFiles();
  process.exit(1); 
}); 