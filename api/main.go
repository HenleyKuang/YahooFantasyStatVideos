package main

import (
	"encoding/json"
	"fmt"
	"log"
	"main/connection"
	"net/http"
)

var nbaClient *connection.Client

func homePage(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Welcome to the HomePage!")
	fmt.Println("Endpoint Hit: homePage")
}

func playerIndex(w http.ResponseWriter, r *http.Request) {
	playerResults, _ := nbaClient.GetPlayerIndex("2021-22")
	json.NewEncoder(w).Encode(playerResults)
	fmt.Println("Endpoint Hit: playerIndex")
}

func playerVideos(w http.ResponseWriter, r *http.Request) {
	playerID := 1629001    // Melton
	teamID := 1610612763   // MEM
	gameID := "0022100040" // MEM vs GSW on 10/28/2021
	playerVideoResults, _ := nbaClient.GetPlayerVideos("2021-22", gameID, teamID, playerID, "STL")
	json.NewEncoder(w).Encode(playerVideoResults)
	fmt.Println("Endpoint Hit: playervideos")
}

func handleRequests() {
	http.HandleFunc("/", homePage)
	http.HandleFunc("/playerindex", playerIndex)
	http.HandleFunc("/playervideos", playerVideos)
	log.Fatal(http.ListenAndServe(":10000", nil))
}

func main() {
	nbaClient = connection.New(nil)
	defer nbaClient.Close()
	handleRequests()
}
