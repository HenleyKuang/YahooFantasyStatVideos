package service

import (
	"fmt"
	"main/connection"
)

var playerResults map[string]*connection.PlayerIndexResult
var gamesResults map[string][]GameData

const currentSeason = "2024-25"

func init() {
	// Cache list of player names and their team.
	nbaClient := connection.New(nil)
	defer nbaClient.Close()

	playerResults, _ = nbaClient.GetPlayerIndex(currentSeason)
	fmt.Printf("Loaded players index. Total %d players data\n", len(playerResults))
	// for k, v := range playerResults {
	// 	fmt.Printf("k=%v; v=%v\n", k, v)
	// }
	// fmt.Printf("playerResults: %v\n", playerResults)
	/* Example log:
	...
	k=LAC:Jordan Miller; v=LAC:Jordan Miller
	k=WAS:Kyle Kuzma; v=WAS:Kyle Kuzma
	k=PHI:Andre Drummond; v=PHI:Andre Drummond
	...
	*/
	// Cache list of game IDs (reading from JSON file).
	gamesResults = GetAllGamesForSeason()
	fmt.Printf("Loaded all games for the season. Total of %d games data\n", len(gamesResults))
}

// GetVideos returns a list of videos for a given player name, team abbreviation, date, and stat type.
// Example parameters:
// 	playerName: "De'Anthony Melton"
//  teamAbbreviation: "MEM"
//  date: "2021-10-29"
//  statType: "STL"
func GetVideos(nbaClient *connection.Client, playerName string, teamAbbreviation string, date string, statType string) []*connection.PlayerVideoResult {
	key := fmt.Sprintf("%s:%s", teamAbbreviation, playerName)
	fmt.Printf("playervideos; %s\n", key)
	if playerResult, ok := playerResults[key]; ok {
		playerID := playerResult.PlayerID
		teamID := playerResult.TeamID
		fmt.Printf("playerID: %v; teamID: %v\n", playerID, teamID)
		var gameID string

		// gameResults, _ := nbaClient.GetGames(date)
		gameResults := gamesResults[date]
		for _, gameResult := range gameResults {
			if gameResult.AwayTeam.TeamID == teamID || gameResult.HomeTeam.TeamID == teamID {
				gameID = gameResult.GameID
				break
			}
		}
		fmt.Printf("gameID: %v\n", gameID)
		videoResults, err := nbaClient.GetPlayerVideos(currentSeason, gameID, fmt.Sprint(teamID), fmt.Sprint(playerID), statType)
		if err != nil {
			fmt.Println(err)
		}
		return videoResults
	} else {
		fmt.Printf("Key did not exist in playerResults index: %s\n", key)
	}

	return nil
}
