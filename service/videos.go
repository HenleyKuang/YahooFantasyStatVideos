package service

import (
	"fmt"
	"main/connection"
)

var playerResults map[string]*connection.PlayerIndexResult

func init() {
	// Cache list of player names and their team.
	nbaClient := connection.New(nil)
	defer nbaClient.Close()

	playerResults, _ = nbaClient.GetPlayerIndex("2021-22")
}

// GetVideos returns a list of videos for a given player name, team abbreviation, date, and stat type.
// Example parameters:
// 	playerName: "De'Anthony Melton"
//  teamAbbreviation: "MEM"
//  date: "2021-10-29"
//  statType: "STL"
func GetVideos(nbaClient *connection.Client, playerName string, teamAbbreviation string, date string, statType string) []*connection.PlayerVideoResult {
	key := fmt.Sprintf("%s:%s", teamAbbreviation, playerName)
	if playerResult, ok := playerResults[key]; ok {
		playerID := playerResult.PlayerID
		teamID := playerResult.TeamID
		var gameID string

		gameResults, _ := nbaClient.GetGames(date)
		for _, gameResult := range gameResults {
			if gameResult.AwayTeamID == teamID || gameResult.HomeTeamID == teamID {
				gameID = gameResult.GameID
			}
		}
		videoResults, _ := nbaClient.GetPlayerVideos("2021-22", gameID, fmt.Sprint(teamID), fmt.Sprint(playerID), statType)
		return videoResults
	} else {
		fmt.Printf("Key did not exist in playerResults index: %s\n", key)
	}

	return nil
}
