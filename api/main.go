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

func handleRequests() {
	http.HandleFunc("/", homePage)
	http.HandleFunc("/playerindex", playerIndex)
	log.Fatal(http.ListenAndServe(":10000", nil))
}

func main() {
	nbaClient = connection.New(nil)
	defer nbaClient.Close()
	handleRequests()
}
