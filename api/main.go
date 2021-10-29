package api

import (
	"encoding/json"
	"fmt"
	"log"
	"main/connection"
	"main/service"
	"net/http"

	"github.com/gorilla/mux"
)

var nbaClient *connection.Client

func init() {
	nbaClient = connection.New(nil)
	defer nbaClient.Close()
}

func homePage(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Welcome to the HomePage!")
	fmt.Println("Endpoint Hit: homePage")
}

func playerIndex(w http.ResponseWriter, r *http.Request) {
	playerResults, _ := nbaClient.GetPlayerIndex("2021-22")
	json.NewEncoder(w).Encode(playerResults)
	fmt.Println("Endpoint Hit: playerIndex")
}

func playerGameVideos(w http.ResponseWriter, r *http.Request) {
	playerID := r.FormValue("playerID") // e.g. "1629001" for Melton
	teamID := r.FormValue("teamID")     // e.g. "1610612763" for MEM
	gameID := r.FormValue("gameID")     // e.g. "0022100040" for MEM vs LAL on 10/24/2021
	statType := r.FormValue("statType") // e.g. "STL"
	playerVideoResults, _ := nbaClient.GetPlayerVideos("2021-22", gameID, teamID, playerID, statType)
	json.NewEncoder(w).Encode(playerVideoResults)
	fmt.Println("Endpoint Hit: playergamevideos")
}

func nbaGames(w http.ResponseWriter, r *http.Request) {
	gameDate := r.FormValue("gameDate") // e.g. "10-29-2021"
	fmt.Printf("%s", gameDate)
	gameResults, _ := nbaClient.GetGames(gameDate)
	json.NewEncoder(w).Encode(gameResults)
	fmt.Println("Endpoint Hit: nbagames")
}

func playerVideos(w http.ResponseWriter, r *http.Request) {
	playerName := r.FormValue("playerName")             // e.g. "De'Anthony Melton"
	teamAbbreviation := r.FormValue("teamAbbreviation") // e.g. "MEM"
	gameDate := r.FormValue("gameDate")                 // e.g. "10-28-2021"
	statType := r.FormValue("statType")                 // e.g. "STL"
	gameResults := service.GetVideos(nbaClient, playerName, teamAbbreviation, gameDate, statType)
	json.NewEncoder(w).Encode(gameResults)
	fmt.Println("Endpoint Hit: playervideos")
}

func HandleRequests(port string) {
	// creates a new instance of a mux router
	myRouter := mux.NewRouter().StrictSlash(true)
	// replace http.HandleFunc with myRouter.HandleFunc
	myRouter.HandleFunc("/", homePage)
	myRouter.HandleFunc("/playerindex", playerIndex)
	myRouter.Path("/playergamevideos").
		Queries("playerID", "{playerID:[0-9]+}",
			"teamID", "{teamID:[0-9]+}",
			"gameID", "{gameID:[0-9]+}",
			"statType", "{statType:[A-Z0-9]+}").
		HandlerFunc(playerGameVideos)
	myRouter.Path("/playergamevideos").HandlerFunc(playerGameVideos)
	myRouter.Path("/nbagames").
		Queries("gameDate", "{gameDate:\\d{4}-\\d{2}-\\d{2}").
		HandlerFunc(nbaGames)
	myRouter.Path("/nbagames").HandlerFunc(nbaGames)
	myRouter.Path("/playervideos").
		Queries("playerName", "{playerName:.+}",
			"teamAbbreviation", "{teamAbbreviation:.+}",
			"gameDate", "{gameDate:\\d{4}-\\d{2}-\\d{2}",
			"statType", "{statType:[A-Z0-9]+}").
		HandlerFunc(playerVideos)
	myRouter.Path("/playervideos").HandlerFunc(playerVideos)
	// finally, instead of passing in nil, we want
	// to pass in our newly created router as the second
	// argument
	log.Fatal(http.ListenAndServe(":"+port, myRouter))
}
