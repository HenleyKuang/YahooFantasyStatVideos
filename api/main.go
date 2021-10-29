package main

import (
	"encoding/json"
	"fmt"
	"log"
	"main/connection"
	"net/http"

	"github.com/gorilla/mux"
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
	playerID := r.FormValue("playerID") // e.g. "1629001" for Melton
	teamID := r.FormValue("teamID")     // e.g. "1610612763" for MEM
	gameID := r.FormValue("gameID")     // e.g. "0022100040" for MEM vs LAL on 10/24/2021
	statType := r.FormValue("statType") // e.g. "STL"
	playerVideoResults, _ := nbaClient.GetPlayerVideos("2021-22", gameID, teamID, playerID, statType)
	json.NewEncoder(w).Encode(playerVideoResults)
	fmt.Println("Endpoint Hit: playervideos")
}

func handleRequests() {
	// creates a new instance of a mux router
	myRouter := mux.NewRouter().StrictSlash(true)
	// replace http.HandleFunc with myRouter.HandleFunc
	myRouter.HandleFunc("/", homePage)
	myRouter.HandleFunc("/playerindex", playerIndex)
	myRouter.Path("/playervideos").
		Queries("playerID", "teamID", "gameID", "statType").
		HandlerFunc(playerVideos)
	myRouter.Path("/playervideos").HandlerFunc(playerVideos)
	// finally, instead of passing in nil, we want
	// to pass in our newly created router as the second
	// argument
	log.Fatal(http.ListenAndServe(":10000", myRouter))
}

func main() {
	nbaClient = connection.New(nil)
	defer nbaClient.Close()
	handleRequests()
}
