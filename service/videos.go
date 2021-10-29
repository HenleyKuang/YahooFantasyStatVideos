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
	playerID := playerResults[key].PlayerID
	teamID := playerResults[key].TeamID
	var gameID string

	gameResults, _ := nbaClient.GetGames("2021-10-29")
	for _, gameResult := range gameResults {
		if gameResult.AwayTeamID == teamID || gameResult.HomeTeamID == teamID {
			gameID = gameResult.GameID
		}
	}
	videoResults, _ := nbaClient.GetPlayerVideos("2021-22", gameID, string(teamID), string(playerID), statType)
	return videoResults
}
