const fs = require('fs');

// Team IDs
const SSK_TEAM_ID = 17;
const MTL_TEAM_ID = 11;

// Read all players
console.log('Reading all_players_2025_stats.json...');
const allPlayers = JSON.parse(fs.readFileSync('public/all_players_2025_stats.json', 'utf8'));

// Filter Saskatchewan players
const sskPlayers = {};
let sskCount = 0;
for (const [jersey, player] of Object.entries(allPlayers)) {
  if (player.team_id === SSK_TEAM_ID || (Array.isArray(player.teams) && player.teams.includes('SSK'))) {
    sskPlayers[jersey] = player;
    sskCount++;
  }
}

// Filter Montreal players
const mtlPlayers = {};
let mtlCount = 0;
for (const [jersey, player] of Object.entries(allPlayers)) {
  if (player.team_id === MTL_TEAM_ID || (Array.isArray(player.teams) && player.teams.includes('MTL'))) {
    mtlPlayers[jersey] = player;
    mtlCount++;
  }
}

// Write Saskatchewan file
fs.writeFileSync('public/ssk_players_2025_stats.json', JSON.stringify(sskPlayers, null, 2));
console.log(`✓ Created ssk_players_2025_stats.json with ${sskCount} players`);

// Write Montreal file
fs.writeFileSync('public/mtl_players_2025_stats.json', JSON.stringify(mtlPlayers, null, 2));
console.log(`✓ Created mtl_players_2025_stats.json with ${mtlCount} players`);

console.log('\nDone!');

