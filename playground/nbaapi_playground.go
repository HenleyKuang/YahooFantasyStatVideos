package main

import "main/connection"

func main() {
	nbaClient := connection.New(nil)

	params := map[string]string{}
	params["DateFrom"] = ""
	params["DateTo"] = ""
	params["GameScope"] = ""
	params["GameSegment"] = ""
	params["LastNGames"] = "0"
	params["LeagueID"] = "00"
	params["Location"] = ""
	params["MeasureType"] = "Base"
	params["Month"] = "0"
	params["OpponentTeamID"] = "0"
	params["PORound"] = "0"
	params["PaceAdjust"] = "N"
	params["PerMode"] = "PerGame"
	params["Period"] = "0"
	params["PlayerExperience"] = ""
	params["PlayerPosition"] = ""
	params["PlusMinus"] = "N"
	params["Outcome"] = ""
	params["Rank"] = "N"
	params["Season"] = "2021-22"
	params["SeasonSegment"] = ""
	params["SeasonType"] = "Regular Season"
	params["StarterBench"] = ""
	params["TeamID"] = "0"
	params["TwoWay"] = "0"
	params["VsConference"] = ""
	params["VsDivision"] = ""

	nbaClient.GetPlayerIndex(params)
}
