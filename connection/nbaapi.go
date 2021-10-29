package connection

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
)

const (
	playerIndexAPI  = "https://stats.nba.com/stats/leaguedashplayerstats?"
	playerVideosAPI = "https://stats.nba.com/stats/videodetailsasset?"
)

type resultSet struct {
	Headers []string        `json:"headers"`
	RowSet  [][]interface{} `json:"rowSet"` // either int32 or string elements in the list.
}

// A Response struct to map the playerIndexAPI response.
type playerIndexResponse struct {
	PlayerIndexResultSets []resultSet `json:"resultSets"`
}

// PlayerIndexResult is the resturned struct for each player found in the player index.
type PlayerIndexResult struct {
	PlayerName       string `json:"player_name"`
	PlayerID         int32  `json:"player_id"`
	TeamAbbreviation string `json:"team_abbrev"`
	TeamID           int32  `json:"team_id"`
}

func (pr *PlayerIndexResult) String() string {
	return fmt.Sprintf("%s:%s", pr.TeamAbbreviation, pr.PlayerName)
}

// Client holds the http connection.
type Client struct {
	httpClient *http.Client
}

// New creates a new Client object.
func New(httpClient *http.Client) *Client {
	if httpClient == nil {
		c := &http.Client{}
		httpClient = c
	}
	return &Client{
		httpClient: httpClient,
	}
}

// GetPlayerIndex returns a list of all current nba players with metadata such as player name, player id, team name, team id, etc.
// Parameter season expects an nba season represented as a string. e.g. "2021-22"
func (c *Client) GetPlayerIndex(season string) (map[string]*PlayerIndexResult, error) {
	req, err := http.NewRequest("GET", playerIndexAPI, nil)

	if err != nil {
		log.Printf("Errored creating NewRequest. err: %v\n", err)
		return nil, err
	}

	q := req.URL.Query()
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
	params["Season"] = season // "2021-22"
	params["SeasonSegment"] = ""
	params["SeasonType"] = "Regular Season"
	params["StarterBench"] = ""
	params["TeamID"] = "0"
	params["TwoWay"] = "0"
	params["VsConference"] = ""
	params["VsDivision"] = ""
	for qName, qValue := range params {
		q.Add(qName, qValue)
	}
	req.URL.RawQuery = q.Encode()
	setRequestHeaders(&req.Header)

	resp, err := c.httpClient.Do(req)

	if err != nil {
		fmt.Printf("Errored when sending request to the server. err: %v\n", err)
		return nil, err
	}

	if resp.StatusCode != 200 {
		err := fmt.Errorf("Status code is not 200 OK. It's %s", resp.Status)
		fmt.Printf("Errored when sending request to the server. err: %v\n", err)
		return nil, err
	}

	defer resp.Body.Close()
	responseData, err := ioutil.ReadAll(resp.Body)

	if err != nil {
		fmt.Printf("Errored when reading response body. err: %v\n", err)
		return nil, err
	}

	var responseObject playerIndexResponse
	json.Unmarshal(responseData, &responseObject)

	results := map[string]*PlayerIndexResult{}

	for _, row := range responseObject.PlayerIndexResultSets[0].RowSet {
		newPlayerResult := &PlayerIndexResult{}
		for idx, header := range responseObject.PlayerIndexResultSets[0].Headers {
			value := row[idx]
			switch header {
			case "PLAYER_ID":
				newPlayerResult.PlayerID = int32(value.(float64))
			case "PLAYER_NAME":
				newPlayerResult.PlayerName = value.(string)
			case "TEAM_ID":
				newPlayerResult.TeamID = int32(value.(float64))
			case "TEAM_ABBREVIATION":
				newPlayerResult.TeamAbbreviation = value.(string)
			default:
			}
		}
		results[newPlayerResult.String()] = newPlayerResult
	}

	return results, nil
}

// Close closes the underlying http connection.
func (c *Client) Close() {
	c.httpClient.CloseIdleConnections()
}

// GetPlayerVideos fetches for the videos for a particular player's stats.
func (c *Client) GetPlayerVideos(season string, gameID string, teamID int, playerID int, statType string) (map[string]string, error) {
	req, err := http.NewRequest("GET", playerVideosAPI, nil)

	if err != nil {
		log.Printf("Errored creating NewRequest. err: %v\n", err)
		return nil, err
	}
	q := req.URL.Query()
	params := map[string]string{}
	params["AheadBehind"] = ""
	params["CFID"] = ""
	params["CFPARAMS"] = ""
	params["ClutchTime"] = ""
	params["Conference"] = ""
	params["ContextFilter"] = ""
	params["ContextMeasure"] = statType // "STL"
	params["DateFrom"] = ""
	params["DateTo"] = ""
	params["Division"] = ""
	params["EndPeriod"] = "10"
	params["EndRange"] = "28800"
	params["GROUP_ID"] = ""
	params["GameEventID"] = ""
	params["GameID"] = gameID // "0022100040"
	params["GameSegment"] = ""
	params["GroupID"] = ""
	params["GroupMode"] = ""
	params["GroupQuantity"] = "5"
	params["LastNGames"] = "0"
	params["LeagueID"] = "00"
	params["Location"] = ""
	params["Month"] = "0"
	params["OnOff"] = ""
	params["OpponentTeamID"] = "0"
	params["Outcome"] = ""
	params["PORound"] = "0"
	params["Period"] = "0"
	params["PlayerID"] = fmt.Sprint(playerID) // "1629001"
	params["PlayerID1"] = ""
	params["PlayerID2"] = ""
	params["PlayerID3"] = ""
	params["PlayerID4"] = ""
	params["PlayerID5"] = ""
	params["PlayerPosition"] = ""
	params["PointDiff"] = ""
	params["Position"] = ""
	params["RangeType"] = "0"
	params["RookieYear"] = ""
	params["Season"] = season // "2021-22"
	params["SeasonSegment"] = ""
	params["SeasonType"] = "Regular Season"
	params["ShotClockRange"] = ""
	params["StartPeriod"] = "1"
	params["StartRange"] = "0"
	params["StarterBench"] = ""
	params["TeamID"] = fmt.Sprint(teamID) // "1610612763"
	params["VsConference"] = ""
	params["VsDivision"] = ""
	params["VsPlayerID1"] = ""
	params["VsPlayerID2"] = ""
	params["VsPlayerID3"] = ""
	params["VsPlayerID4"] = ""
	params["VsPlayerID5"] = ""
	params["VsTeamID"] = ""

	for qName, qValue := range params {
		q.Add(qName, qValue)
	}
	req.URL.RawQuery = q.Encode()
	setRequestHeaders(&req.Header)

	resp, err := c.httpClient.Do(req)

	if err != nil {
		fmt.Printf("Errored when sending request to the server. err: %v\n", err)
		return nil, err
	}

	if resp.StatusCode != 200 {
		err := fmt.Errorf("Status code is not 200 OK. It's %s", resp.Status)
		fmt.Printf("Errored when sending request to the server. err: %v\n", err)
		return nil, err
	}

	defer resp.Body.Close()
	responseData, err := ioutil.ReadAll(resp.Body)

	if err != nil {
		fmt.Printf("Errored when reading response body. err: %v\n", err)
		return nil, err
	}

	fmt.Println(string(responseData))

	return nil, nil
}

func setRequestHeaders(header *http.Header) {
	header.Set("name", "value")
	header.Set("Accept", "application/json, text/plain, */*")
	header.Set("x-nba-stats-token", "true")
	// header.Set("sec-ch-ua-mobile", "?0")
	header.Set("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36")
	header.Set("x-nba-stats-origin", "stats")
	header.Set("sec-ch-ua-platform", "Linux")
	header.Set("Origin", "https://www.nba.com")
	header.Set("Sec-Fetch-Site", "same-site")
	header.Set("Sec-Fetch-Mode", "cors")
	header.Set("Sec-Fetch-Dest", "empty")
	header.Set("Referer", "https://www.nba.com/")
	header.Set("Accept-Language", "en-US,en;q=0.9")
	// header.Set("If-Modified-Since", "Thu, 28 Oct 2021 06:32:33 GMT")
}
