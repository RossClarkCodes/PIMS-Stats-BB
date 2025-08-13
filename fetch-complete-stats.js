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

function makeRequest(url, timeout = 15000) {
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
  console.log(`Fetching team stats for ${team.name}...`);
  
  try {
    const data = await makeRequest(url);
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
    console.error(`Error fetching team stats for ${team.name}:`, error.message);
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

async function fetchTeamRoster(team) {
  const url = `https://echo.pims.cfl.ca/api/teams/${team.id}/roster`;
  console.log(`Fetching roster for ${team.name}...`);
  
  try {
    const data = await makeRequest(url);
    let rosterData = [];
    
    // Handle different response structures
    if (Array.isArray(data)) {
      rosterData = data;
    } else if (data && Array.isArray(data.rosterplayers)) {
      rosterData = data.rosterplayers;
    } else if (data && Array.isArray(data.players)) {
      rosterData = data.players;
    }
    
    return rosterData.map(player => ({
      ...player,
      team_name: team.name,
      team_id: team.id,
      team_abbr: team.abbr
    }));
  } catch (error) {
    console.error(`Error fetching roster for ${team.name}:`, error.message);
    return [];
  }
}

async function fetchPlayerStats(playerId, playerName) {
  const url = `https://echo.pims.cfl.ca/api/stats/players/pims_player/${playerId}`;
  
  try {
    const data = await makeRequest(url);
    
    // Find 2025 season stats
    const seasonStats = (data.seasons || []).find(s => s.season === 2025);
    
    return {
      player_id: playerId,
      player_name: playerName,
      season: 2025,
      stats: seasonStats || {},
      has_stats: !!seasonStats
    };
  } catch (error) {
    console.error(`Error fetching stats for player ${playerName} (ID: ${playerId}):`, error.message);
    return {
      player_id: playerId,
      player_name: playerName,
      season: 2025,
      stats: {},
      has_stats: false,
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
    'team_wpg_2025_stats.xml',
    'all_players_2025_stats.json',
    'wpg_players_2025_stats.json',
    'all_players_2025_stats.xml',
    'wpg_players_2025_stats.xml'
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
    'team_wpg_2025_stats.xml',
    'all_players_2025_stats.json',
    'wpg_players_2025_stats.json'
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
  console.log('Starting comprehensive stats fetch...');
  
  // Ensure public directory exists
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
    console.log('Created public directory');
  }
  
  // Fetch team stats
  console.log('\n=== FETCHING TEAM STATS ===');
  const allTeamStats = [];
  let wpgTeamStats = null;
  let teamSuccessCount = 0;
  
  for (const team of TEAMS) {
    try {
      const stats = await fetchTeamStats(team);
      allTeamStats.push(stats);
      if (team.id === 20) wpgTeamStats = stats;
      
      if (!stats.error) {
        teamSuccessCount++;
        console.log(`✓ Team stats for ${team.name}`);
      } else {
        console.log(`⚠ Team stats for ${team.name} with error: ${stats.error}`);
      }
    } catch (e) {
      console.error(`✗ Failed to fetch team stats for ${team.name}:`, e.message);
      allTeamStats.push({
        team: team.name,
        team_id: team.id,
        abbr: team.abbr,
        season: 2025,
        stats: {},
        error: e.message
      });
    }
  }
  
  // Fetch player data
  console.log('\n=== FETCHING PLAYER DATA ===');
  const allPlayers = [];
  const wpgPlayers = [];
  let playerSuccessCount = 0;
  let totalPlayers = 0;
  
  for (const team of TEAMS) {
    try {
      const roster = await fetchTeamRoster(team);
      console.log(`Found ${roster.length} players in ${team.name} roster`);
      totalPlayers += roster.length;
      
      // Fetch individual player stats
      for (const player of roster) {
        try {
          const playerStats = await fetchPlayerStats(player.player_id, player.player_name || 'Unknown Player');
          const playerData = {
            ...player,
            ...playerStats
          };
          
          allPlayers.push(playerData);
          
          if (team.id === 20) {
            wpgPlayers.push(playerData);
          }
          
          if (playerStats.has_stats) {
            playerSuccessCount++;
          }
          
          // Add small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (e) {
          console.error(`✗ Failed to fetch stats for player ${player.player_name || 'Unknown'} (${player.player_id}):`, e.message);
          allPlayers.push({
            ...player,
            player_id: player.player_id,
            player_name: player.player_name || 'Unknown Player',
            season: 2025,
            stats: {},
            has_stats: false,
            error: e.message
          });
        }
      }
    } catch (e) {
      console.error(`✗ Failed to fetch roster for ${team.name}:`, e.message);
    }
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Team stats: ${teamSuccessCount}/${TEAMS.length} teams successful`);
  console.log(`Player stats: ${playerSuccessCount}/${totalPlayers} players with stats`);
  
  try {
    // Write team stats files
    console.log('\n=== WRITING FILES ===');
    
    // All teams JSON
    fs.writeFileSync('public/all_teams_2025_stats.json', JSON.stringify(allTeamStats, null, 2));
    console.log('✓ Written all_teams_2025_stats.json');
    
    // WPG team JSON
    if (wpgTeamStats) {
      fs.writeFileSync('public/team_wpg_2025_stats.json', JSON.stringify(wpgTeamStats, null, 2));
      console.log('✓ Written team_wpg_2025_stats.json');
    } else {
      const fallbackWpg = {
        team: 'Winnipeg Blue Bombers',
        team_id: 20,
        abbr: 'WPG',
        season: 2025,
        stats: {},
        error: 'Failed to fetch Winnipeg team stats'
      };
      fs.writeFileSync('public/team_wpg_2025_stats.json', JSON.stringify(fallbackWpg, null, 2));
      console.log('⚠ Created fallback team_wpg_2025_stats.json');
    }
    
    // Write all players JSON (keyed by jersey_no, only has_stats: true)
    const allPlayersFiltered = allPlayers.filter(p => p.has_stats && p.jersey_no != null);
    const allPlayersByJersey = {};
    for (const player of allPlayersFiltered) {
      // Flatten the player data structure - merge stats directly into player object
      const flattenedPlayer = { ...player };
      if (player.stats && typeof player.stats === 'object') {
        Object.assign(flattenedPlayer, player.stats);
        delete flattenedPlayer.stats; // Remove the nested stats object
      }
      allPlayersByJersey[String(player.jersey_no)] = flattenedPlayer;
    }
    fs.writeFileSync('public/all_players_2025_stats.json', JSON.stringify(allPlayersByJersey, null, 2));
    console.log('✓ Written all_players_2025_stats.json (keyed by jersey_no, flattened structure)');

    // Write WPG players JSON (keyed by jersey_no, only has_stats: true)
    const wpgPlayersFiltered = wpgPlayers.filter(p => p.has_stats && p.jersey_no != null);
    const wpgPlayersByJersey = {};
    for (const player of wpgPlayersFiltered) {
      // Flatten the player data structure - merge stats directly into player object
      const flattenedPlayer = { ...player };
      if (player.stats && typeof player.stats === 'object') {
        Object.assign(flattenedPlayer, player.stats);
        delete flattenedPlayer.stats; // Remove the nested stats object
      }
      wpgPlayersByJersey[String(player.jersey_no)] = flattenedPlayer;
    }
    fs.writeFileSync('public/wpg_players_2025_stats.json', JSON.stringify(wpgPlayersByJersey, null, 2));
    console.log('✓ Written wpg_players_2025_stats.json (keyed by jersey_no, flattened structure)');
    
    // Team stats XML
    const allTeamsXML = '<?xml version="1.0" encoding="UTF-8"?>\n<Teams2025Stats>\n' +
      allTeamStats.map(team => {
        const statsXml = Object.entries(team.stats).map(([k,v]) => `      <${k}>${v}</${k}>`).join('\n');
        const errorXml = team.error ? `      <Error>${team.error}</Error>` : '';
        return `  <Team>\n    <Name>${team.team}</Name>\n    <ID>${team.team_id}</ID>\n    <Abbr>${team.abbr}</Abbr>\n    <Season>${team.season}</Season>\n    <Stats>\n${statsXml}${errorXml ? '\n' + errorXml : ''}\n    </Stats>\n  </Team>`;
      }).join('\n') + '\n</Teams2025Stats>';
    fs.writeFileSync('public/all_teams_2025_stats.xml', allTeamsXML);
    console.log('✓ Written all_teams_2025_stats.xml');
    
    // WPG team XML
    if (wpgTeamStats) {
      const wpgXML = '<?xml version="1.0" encoding="UTF-8"?>\n<Team2025Stats>\n' +
        `  <Name>${wpgTeamStats.team}</Name>\n  <ID>${wpgTeamStats.team_id}</ID>\n  <Abbr>${wpgTeamStats.abbr}</Abbr>\n  <Season>${wpgTeamStats.season}</Season>\n  <Stats>\n` +
        Object.entries(wpgTeamStats.stats).map(([k,v]) => `    <${k}>${v}</${k}>`).join('\n') +
        '\n  </Stats>\n</Team2025Stats>';
      fs.writeFileSync('public/team_wpg_2025_stats.xml', wpgXML);
      console.log('✓ Written team_wpg_2025_stats.xml');
    } else {
      const fallbackWpgXml = `<?xml version="1.0" encoding="UTF-8"?>\n<Team2025Stats>\n  <Name>Winnipeg Blue Bombers</Name>\n  <ID>20</ID>\n  <Abbr>WPG</Abbr>\n  <Season>2025</Season>\n  <Error>Failed to fetch Winnipeg team stats</Error>\n</Team2025Stats>`;
      fs.writeFileSync('public/team_wpg_2025_stats.xml', fallbackWpgXml);
      console.log('⚠ Created fallback team_wpg_2025_stats.xml');
    }
    
    // Validate all files were created
    if (!validateFiles()) {
      console.error('❌ File validation failed - creating fallback files');
      createFallbackFiles();
      process.exit(1);
    }
    
    console.log('\n🎉 All files written successfully!');
    console.log(`📊 Generated ${allTeamStats.length} team records and ${allPlayers.length} player records`);
    
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