package main

import "main/connection"

func main() {
	params := map[string]string{}
	params["LastNGames"] = "0"
	params["LeagueID"] = "00"
	params["MeasureType"] = "Base"
	params["Month"] = "0"
	params["OpponentTeamID"] = "0"
	params["PORound"] = "0"
	params["PaceAdjust"] = "N"
	params["PerMode"] = "PerGame"
	params["Period"] = "0"
	params["PlusMinus"] = "N"
	params["Rank"] = "N"
	params["Season"] = "2021-22"
	params["SeasonType"] = "Regular+Season"
	params["TeamID"] = "0"
	params["TwoWay"] = "0"
	connection.GetPlayerIndex(params)
}
