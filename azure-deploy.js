import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// Azure-specific configuration
const CONFIG = {
    teamId: 20, // Winnipeg Blue Bombers
    season: 2025,
    outputDir: process.env.AZURE_OUTPUT_DIR || './output',
    rosterUrl: 'https://echo.pims.cfl.ca/api/teams/20/roster',
    delayBetweenRequests: 100,
    azureStorage: {
        connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
        containerName: process.env.AZURE_STORAGE_CONTAINER || 'blue-bombers-stats'
    }
};

// Utility function to make API calls
async function makeAPICall(url, description) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching ${description}:`, error);
        throw error;
    }
}

// Calculate season totals from individual games
function calculateSeasonTotals(games) {
    const totals = {
        games: games.length,
        // Participation
        hasParticipated: 0,
        wasStarter: 0,
        
        // Defense stats
        tackles: 0,
        tacklesSolo: 0,
        tacklesAssisted: 0,
        tacklesSpecialTeam: 0,
        tacklesAssistedSpecialTeam: 0,
        tacklesForLoss: 0,
        tacklesForLossYards: 0,
        passesDefended: 0,
        sacks: 0,
        sacksForLossYards: 0,
        safeties: 0,
        quarterbackHits: 0,
        
        // Fumbles
        fumbles: 0,
        fumblesForced: 0,
        fumblesLost: 0,
        fumblesOutOfBounds: 0,
        fumblesRecoveries: 0,
        fumblesRecoveriesFromOpponents: 0,
        fumblesRecoveriesOwn: 0,
        fumblesRecoveriesOwnYards: 0,
        fumblesReturnsYards: 0,
        fumblesReturnsYardsLongest: 0,
        
        // Interceptions
        interceptions: 0,
        interceptionsReturns: 0,
        interceptionsReturnsYards: 0,
        interceptionsReturnsYardsLongest: 0,
        
        // Passing
        passesAttempted: 0,
        passesAttemptedYardsAverage: 0,
        passesIntercepted: 0,
        passesRating: 0,
        passesSacked: 0,
        passesSackedFirstDown: 0,
        passesSackedSecondDown: 0,
        passesSackedThirdDown: 0,
        passesSucceededYardsLongest: 0,
        passesSucceededPercentage: 0,
        passesSucceededThirtyPlusYards: 0,
        
        // Rushing/Receiving
        carries: 0,
        rushingYards: 0,
        receptions: 0,
        receivingYards: 0,
        
        // Kicking
        fieldGoalsAttempted: 0,
        fieldGoalsAverageYards: 0,
        fieldGoalsBlocked: 0,
        defensiveFieldGoalsBlocked: 0,
        fieldGoalsYards: 0,
        fieldGoalsMissed: 0,
        fieldGoalsMissedReturns: 0,
        fieldGoalsMissedReturnsYards: 0,
        fieldGoalsMissedReturnsYardsAverage: 0,
        fieldGoalsMissedReturnsYardsLongest: 0,
        fieldGoalsSucceeded: 0,
        fieldGoalsSucceededYardsLongest: 0,
        fieldGoalsSucceededPercentage: 0,
        
        // Extra Points
        extraPointsAttempted: 0,
        extraPointsBlocked: 0,
        defensiveExtraPointsBlocked: 0,
        extraPointsSucceeded: 0,
        
        // Punting
        punts: 0,
        puntingYards: 0,
        puntingYardsNet: 0,
        puntingYardsLongest: 0,
        puntingTouchbacks: 0,
        puntingKickerReturnsYards: 0,
        puntingYardsGrossAverage: 0,
        puntingYardsNetAverage: 0,
        puntsBlocked: 0,
        defensivePuntsBlocked: 0,
        puntingInsideTwenty: 0,
        
        // Kickoffs
        kickoffs: 0,
        kickoffsFairCatches: 0,
        kickoffsYards: 0,
        kickoffsYardsAverage: 0,
        kickoffsYardsLongest: 0,
        kickoffsInsideEndZone: 0,
        kickoffsInsideTwenty: 0,
        kickoffsKickerReturnsYards: 0,
        kickoffsOutOfBounds: 0,
        kickoffsTouchbacks: 0,
        
        // Kickoff Returns
        kickoffsReturns: 0,
        kickoffsReturnsYards: 0,
        kickoffsReturnsYardsAverage: 0,
        kickoffsReturnsYardsLongest: 0,
        
        // Touchdowns
        touchdowns: 0,
        touchdownsFieldGoalsReturns: 0,
        touchdownsFumblesOwnRecovery: 0,
        touchdownsFumblesReturn: 0,
        touchdownsInterceptionsReturns: 0,
        touchdownsInterceptionsReturnsYardsLongest: 0,
        touchdownsKickoffsReturns: 0,
        touchdownsKickoffsReturnsYardsLongest: 0,
        touchdownsPasses: 0,
        touchdownsPassesYardsLongest: 0,
        touchdownsPuntingReturns: 0,
        touchdownsPuntingReturnsYardsLongest: 0,
        touchdownsReceptions: 0,
        touchdownsReceptionsYardsLongest: 0,
        touchdownsReturns: 0,
        touchdownsRushing: 0,
        touchdownsRushingYardsLongest: 0,
        
        // Two Point Conversions
        twoPointPassAttempted: 0,
        twoPointPassSucceeded: 0,
        twoPointReceptionAttempted: 0,
        twoPointReceptionSucceeded: 0,
        twoPointRushAttempted: 0,
        twoPointRushSucceeded: 0,
        twoPointDefensiveConversionsAttempted: 0,
        twoPointDefensiveConversionsSucceeded: 0,
        twoPointConversionsDefense: 0,
        
        // Penalties
        penaltiesChargedDefense: 0,
        penaltiesChargedOffense: 0,
        penaltiesDeclined: 0,
        penaltiesForLossYards: 0,
        firstDownsByPenalties: 0,
        
        // Losses
        kneels: 0,
        kneelsYards: 0,
        losses: 0,
        lossesYards: 0,
        
        // Returns
        returnsYards: 0,
        
        // Competitor stats
        turnovers: 0,
        turnoversOnDowns: 0,
        offenseYards: 0,
        plays: 0,
        timeOfPossessionSeconds: 0,
        playYardsAverage: 0
    };
    
    games.forEach(game => {
        if (game.stats) {
            Object.keys(totals).forEach(key => {
                if (key !== 'games' && game.stats[key] !== undefined) {
                    totals[key] += game.stats[key];
                }
            });
        }
    });
    
    return totals;
}

// Calculate team totals
function calculateTeamStats(allPlayers) {
    const totals = {
        totalPlayers: allPlayers.length,
        totalGames: 0,
        totalTackles: 0,
        totalSacks: 0,
        totalInterceptions: 0,
        totalFumblesForced: 0,
        totalPassesDefended: 0,
        totalFumbleRecoveries: 0,
        totalTouchdowns: 0,
        totalYards: 0
    };
    
    allPlayers.forEach(player => {
        const games2025 = player.fixtures ? player.fixtures.filter(f => f.season === 2025) : [];
        const seasonTotals = calculateSeasonTotals(games2025);
        
        if (seasonTotals.games > 0) {
            totals.totalGames += seasonTotals.games;
            totals.totalTackles += seasonTotals.tackles;
            totals.totalSacks += seasonTotals.sacks;
            totals.totalInterceptions += seasonTotals.interceptions;
            totals.totalFumblesForced += seasonTotals.fumblesForced;
            totals.totalPassesDefended += seasonTotals.passesDefended;
            totals.totalFumbleRecoveries += seasonTotals.fumblesRecoveries;
            totals.totalTouchdowns += seasonTotals.touchdowns;
            totals.totalYards += seasonTotals.offenseYards;
        }
    });
    
    return totals;
}

// Get player info from roster
function getPlayerInfo(playerId, rosterData) {
    const player = rosterData.find(p => p.player_id === playerId);
    if (player) {
        return {
            id: playerId,
            name: `${player.firstname || ''} ${player.lastname || ''}`.trim() || 'Unknown Player',
            position: player.position || 'N/A',
            jersey: player.jersey_no || 'N/A',
            birthdate: player.birthdate || 'N/A',
            height_ft: player.height_ft || 'N/A',
            height_in: player.height_in || 'N/A',
            weight_lbs: player.weight_lbs || 'N/A',
            college: player.college || 'N/A'
        };
    }
    return {
        id: playerId,
        name: 'Unknown Player',
        position: 'N/A',
        jersey: 'N/A',
        birthdate: 'N/A',
        height_ft: 'N/A',
        height_in: 'N/A',
        weight_lbs: 'N/A',
        college: 'N/A'
    };
}

// Generate XML content
function generateXML(teamStats, allPlayersData, rosterData) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<BlueBombers2025SeasonStats>\n';
    xml += '  <Team>Winnipeg Blue Bombers</Team>\n';
    xml += '  <Season>2025</Season>\n';
    xml += `  <GeneratedAt>${new Date().toISOString()}</GeneratedAt>\n`;
    
    // Team stats
    xml += '  <TeamStats>\n';
    Object.entries(teamStats).forEach(([key, value]) => {
        xml += `    <${key}>${value}</${key}>\n`;
    });
    xml += '  </TeamStats>\n';
    
    // Players with season stats
    xml += '  <Players>\n';
    allPlayersData.forEach(playerData => {
        const playerInfo = getPlayerInfo(playerData.player_id, rosterData);
        const games2025 = playerData.fixtures ? playerData.fixtures.filter(f => f.season === 2025) : [];
        const seasonTotals = calculateSeasonTotals(games2025);
        
        xml += '    <Player>\n';
        xml += `      <PlayerID>${playerData.player_id}</PlayerID>\n`;
        xml += `      <Name>${playerInfo.name}</Name>\n`;
        xml += `      <Position>${playerInfo.position}</Position>\n`;
        xml += `      <Jersey>${playerInfo.jersey}</Jersey>\n`;
        xml += `      <Birthdate>${playerInfo.birthdate}</Birthdate>\n`;
        xml += `      <HeightFt>${playerInfo.height_ft}</HeightFt>\n`;
        xml += `      <HeightIn>${playerInfo.height_in}</HeightIn>\n`;
        xml += `      <WeightLbs>${playerInfo.weight_lbs}</WeightLbs>\n`;
        xml += `      <College>${playerInfo.college}</College>\n`;
        xml += `      <GamesPlayed>${seasonTotals.games}</GamesPlayed>\n`;
        
        // Season totals
        xml += '      <SeasonTotals>\n';
        Object.entries(seasonTotals).forEach(([key, value]) => {
            if (key !== 'games') {
                xml += `        <${key}>${value}</${key}>\n`;
            }
        });
        xml += '      </SeasonTotals>\n';
        
        xml += '    </Player>\n';
    });
    xml += '  </Players>\n';
    xml += '</BlueBombers2025SeasonStats>';
    
    return xml;
}

// Generate JSON content
function generateJSON(teamStats, allPlayersData, rosterData) {
    return {
        team: 'Winnipeg Blue Bombers',
        season: 2025,
        generatedAt: new Date().toISOString(),
        teamStats: teamStats,
        players: allPlayersData.map(playerData => {
            const playerInfo = getPlayerInfo(playerData.player_id, rosterData);
            const games2025 = playerData.fixtures ? playerData.fixtures.filter(f => f.season === 2025) : [];
            const seasonTotals = calculateSeasonTotals(games2025);
            
            return {
                player_id: playerData.player_id,
                name: playerInfo.name,
                position: playerInfo.position,
                jersey: playerInfo.jersey,
                birthdate: playerInfo.birthdate,
                height_ft: playerInfo.height_ft,
                height_in: playerInfo.height_in,
                weight_lbs: playerInfo.weight_lbs,
                college: playerInfo.college,
                gamesPlayed: seasonTotals.games,
                seasonTotals: seasonTotals
            };
        })
    };
}

// Main function to fetch all stats
async function fetchAllStats() {
    console.log('Starting Azure Blue Bombers stats fetch...');
    console.log(`Time: ${new Date().toISOString()}`);
    
    try {
        // Create output directory if it doesn't exist
        if (!fs.existsSync(CONFIG.outputDir)) {
            fs.mkdirSync(CONFIG.outputDir, { recursive: true });
        }
        
        console.log('Fetching team roster...');
        const rosterResponse = await makeAPICall(CONFIG.rosterUrl, 'Team roster');
        const rosterData = rosterResponse.rosterplayers || [];
        
        console.log(`Found ${rosterData.length} players in roster`);
        
        // Extract player IDs from the roster
        const rosterPlayerIds = rosterData.map(player => player.player_id).filter(id => id);
        
        console.log(`Fetching individual stats for ${rosterPlayerIds.length} players...`);
        
        const allPlayersData = [];
        
        for (let i = 0; i < rosterPlayerIds.length; i++) {
            const playerId = rosterPlayerIds[i];
            console.log(`Fetching stats for player ${i + 1}/${rosterPlayerIds.length} (ID: ${playerId})`);
            
            try {
                const playerStatsUrl = `https://echo.pims.cfl.ca/api/stats/players/pims_player/${playerId}`;
                const playerData = await makeAPICall(playerStatsUrl, `Player ${playerId} stats`);
                
                // Filter to only 2025 data
                const filtered2025Data = {
                    ...playerData,
                    seasons: playerData.seasons ? playerData.seasons.filter(s => s.season === 2025) : [],
                    fixtures: playerData.fixtures ? playerData.fixtures.filter(f => f.season === 2025) : []
                };
                
                if (filtered2025Data.seasons.length > 0 || filtered2025Data.fixtures.length > 0) {
                    allPlayersData.push(filtered2025Data);
                }
                
                // Small delay to prevent overwhelming the API
                await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests));
                
            } catch (error) {
                console.error(`Error fetching stats for player ${playerId}:`, error.message);
                // Continue with other players even if one fails
            }
        }
        
        console.log(`Successfully fetched stats for ${allPlayersData.length} players with 2025 data`);
        
        // Calculate team statistics
        const teamStats = calculateTeamStats(allPlayersData);
        
        // Generate files
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Generate XML
        const xmlContent = generateXML(teamStats, allPlayersData, rosterData);
        const xmlFilename = `blue_bombers_2025_season_stats_${timestamp}.xml`;
        const xmlPath = path.join(CONFIG.outputDir, xmlFilename);
        fs.writeFileSync(xmlPath, xmlContent);
        console.log(`XML file saved: ${xmlPath}`);
        
        // Generate JSON
        const jsonContent = generateJSON(teamStats, allPlayersData, rosterData);
        const jsonFilename = `blue_bombers_2025_season_stats_${timestamp}.json`;
        const jsonPath = path.join(CONFIG.outputDir, jsonFilename);
        fs.writeFileSync(jsonPath, JSON.stringify(jsonContent, null, 2));
        console.log(`JSON file saved: ${jsonPath}`);
        
        // Create latest files (without date)
        const latestXmlPath = path.join(CONFIG.outputDir, 'blue_bombers_2025_season_stats_latest.xml');
        const latestJsonPath = path.join(CONFIG.outputDir, 'blue_bombers_2025_season_stats_latest.json');
        fs.writeFileSync(latestXmlPath, xmlContent);
        fs.writeFileSync(latestJsonPath, JSON.stringify(jsonContent, null, 2));
        console.log(`Latest files updated: ${latestXmlPath}, ${latestJsonPath}`);
        
        console.log('Azure automated fetch completed successfully!');
        
        return {
            success: true,
            playersProcessed: allPlayersData.length,
            filesGenerated: [xmlPath, jsonPath, latestXmlPath, latestJsonPath]
        };
        
    } catch (error) {
        console.error('Error in Azure automated fetch:', error);
        throw error;
    }
}

// Export for Azure Functions
export { fetchAllStats };

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    fetchAllStats()
        .then((result) => {
            console.log('Azure script completed successfully:', result);
            process.exit(0);
        })
        .catch((error) => {
            console.error('Azure script failed:', error);
            process.exit(1);
        });
} 