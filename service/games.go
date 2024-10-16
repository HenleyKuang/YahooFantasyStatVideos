package service

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"strings"
)

type GamesScheduleResponse struct {
	LeagueSchedule LeagueSchedule `json:"leagueSchedule"`
}

type LeagueSchedule struct {
	SeasonYear string         `json:"seasonYear"`
	GameDates  []GameDateDict `json:"gameDates"`
}

type GameDateDict struct {
	GameDate string     `json:"gameDate"`
	Games    []GameData `json:"games"`
}

type GameData struct {
	GameID   string   `json:"gameId"`   // "0012400001",
	GameCode string   `json:"gameCode"` // "20241004/BOSDEN",
	AwayTeam TeamData `json:"awayTeam"`
	HomeTeam TeamData `json:"homeTeam"`
}

type TeamData struct {
	TeamID      int    `json:"teamId"`
	TeamName    string `json:"teamName"`
	TeamTricode string `json:"teamTricode"`
}

// GetAllGamesForSeason returns a dictionary where the key is the date and the value is a list of game datas.
func GetAllGamesForSeason() map[string][]GameData {
	allGamesResponse := make(map[string][]GameData)

	// Cache list of game IDs (reading from JSON file).
	seasonScheduleFile, err := os.Open("./2024_25_schedule.json")
	if err != nil {
		fmt.Printf("Error opening schedule file: %v\n", err)
		return allGamesResponse
	}
	fmt.Println("Successfully Opened 2024_25_schedule.json")
	// defer the closing of our jsonFile so that we can parse it later on
	defer seasonScheduleFile.Close()

	// read our opened jsonFile as a byte array.
	byteValue, _ := ioutil.ReadAll(seasonScheduleFile)
	var gamesSchedule GamesScheduleResponse
	json.Unmarshal(byteValue, &gamesSchedule)
	for _, gameDateData := range gamesSchedule.LeagueSchedule.GameDates {
		// Keep the date part only and replace "/" to "-"
		// (e.g. "10/04/2024 00:00:00" changes to "10-04-2024")
		gameDate := strings.Replace(gameDateData.GameDate[:10], "/", "-", -1)
		// fmt.Println(gameDate)
		allGamesResponse[gameDate] = gameDateData.Games
	}
	return allGamesResponse
}
