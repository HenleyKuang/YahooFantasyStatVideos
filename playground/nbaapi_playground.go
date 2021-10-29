package main

import (
	"main/connection"
)

func main() {
	nbaClient := connection.New(nil)
	defer nbaClient.Close()

	// playerResults, _ := nbaClient.GetPlayerIndex("2021-22")
	// fmt.Printf("%d\n", playerResults["MEM:Desmond Bane"].PlayerID)

	playerID := 1629001    // Melton
	teamID := 1610612763   // MEM
	gameID := "0022100040" // MEM vs GSW on 10/28/2021
	nbaClient.GetPlayerVideos("2021-22", gameID, teamID, playerID, "STL")
}
