package main

import (
	"fmt"
	"main/connection"
)

func main() {
	nbaClient := connection.New(nil)
	defer nbaClient.Close()

	// playerResults, _ := nbaClient.GetPlayerIndex("2021-22")
	// fmt.Printf("%d\n", playerResults["MEM:Desmond Bane"].PlayerID)

	// playerID := "1629001"  // Melton
	// teamID := "1610612763" // MEM
	// gameID := "0022100040" // MEM vs GSW on 10/28/2021
	// videoResults, _ := nbaClient.GetPlayerVideos("2021-22", gameID, teamID, playerID, "STL")
	// fmt.Printf("%s\n", videoResults[0].MediumVideoURL)

	gameResults, _ := nbaClient.GetGames("2021-10-29")
	fmt.Printf("GameID: %s, AwayTeam: %s, HomeTeam: %s]\n", gameResults[0].GameID, gameResults[0].AwayTeamAbbreviation, gameResults[0].HomeTeamAbbreviation)
}
