package connection

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"time"
)

const (
	scoreboardAPI     = "https://stats.nba.com/stats/scoreboardv3?"
	playerIndexAPI    = "https://stats.nba.com/stats/leaguedashplayerstats?"
	playerIndexAPI_V2 = "https://stats.nba.com/stats/playerindex?"
	playerVideosAPI   = "https://stats.nba.com/stats/videodetailsasset?"
)

type playerIndexResultSet struct {
	Headers []string        `json:"headers"`
	RowSet  [][]interface{} `json:"rowSet"` // either int32 or string elements in the list.
}

// A Response struct to map the playerIndexAPI response.
type playerIndexResponse struct {
	PlayerIndexResultSets []playerIndexResultSet `json:"resultSets"`
}

// PlayerIndexResult is the returned struct for each player found in the player index.
type PlayerIndexResult struct {
	PlayerName       string `json:"player_name"`
	PlayerID         int    `json:"player_id"`
	TeamAbbreviation string `json:"team_abbrev"`
	TeamID           int    `json:"team_id"`
}

type playerVideoLinks struct {
	LargeVideoURL  string `json:"lurl"`
	MediumVideoURL string `json:"murl"`
	SmallVideoURL  string `json:"surl"`
}

type playerVideoMeta struct {
	VideoUrls []playerVideoLinks `json:"VideoUrls"`
}

type playerVideoPlaylist struct {
	Description  string `json:"dsc"` // e.g. "Jackson Jr. 25' 3PT Jump Shot (6 PTS) (Melton 1 AST)"
	GameDateName string `json:"gc"`  // e.g. "2021-10-20/CLEMEM"
}

type playerVideosResultSet struct {
	Meta     playerVideoMeta       `json:"Meta"`
	Playlist []playerVideoPlaylist `json:"playlist"` // either int32 or string elements in the list.
}

// A Response struct to map the playerVideosAPI response.
type playerVideosResponse struct {
	PlayerIndexResultSets playerVideosResultSet `json:"resultSets"`
}

// PlayerVideoResult is the returned struct with the a single video's metadata.
type PlayerVideoResult struct {
	LargeVideoURL  string `json:"large_url"`
	MediumVideoURL string `json:"medium_url"`
	SmallVideoURL  string `json:"small_url"`
	Description    string `json:"description"`
}

type scoreboardTeam struct {
	TeamID           int    `json:"teamId"`
	TeamAbbreviation string `json:"teamTricode"`
}

type scoreboardGames struct {
	GameID   string         `json:"gameId"`
	GameCode string         `json:"gameCode"`
	AwayTeam scoreboardTeam `json:"awayTeam"`
	HomeTeam scoreboardTeam `json:"homeTeam"`
}

type scoreboardResult struct {
	Games []scoreboardGames `json:"games"`
}

// A Response struct to map the scoreboardAPI response.
type scoreboardResponse struct {
	Scoreboard scoreboardResult `json:"scoreboard"`
}

// GameResult is the returned struct with the a game's metadata.
type GameResult struct {
	GameID               string `json:"game_id"`
	GameCode             string `json:"game_code"`
	AwayTeamID           int    `json:"away_team_id"`
	AwayTeamAbbreviation string `json:"away_team_abbrev"`
	HomeTeamID           int    `json:"home_team_id"`
	HomeTeamAbbreviation string `json:"home_team_abbrev"`
}

func (pr *PlayerIndexResult) String() string {
	return fmt.Sprintf("%s:%s", pr.TeamAbbreviation, pr.PlayerName)
}

// Client holds the http connection.
type Client struct {
	httpClient *http.Client
	useProxy   bool
}

// New creates a new Client object.
func New(httpClient *http.Client) *Client {
	useProxy := false
	if httpClient == nil {
		useProxySettings := os.Getenv("USE_PROXY")
		proxyHost := os.Getenv("PROXY_HOST")
		proxyPort := os.Getenv("PROXY_PORT")
		c := &http.Client{
			Timeout: time.Second * 10,
		}
		if useProxySettings == "TRUE" && proxyHost != "" && proxyPort != "" {
			proxyUser := os.Getenv("PROXY_USER")
			proxyPass := os.Getenv("PROXY_PASS")
			fmt.Printf("Using proxy. %s:%s\n", proxyHost, proxyPort)
			httpProxyURL := &url.URL{
				Scheme: "http",
				Host:   proxyHost + ":" + proxyPort,
			}
			if proxyUser != "" && proxyPass != "" {
				fmt.Println("Proxy user and pass provided.")
				httpProxyURL.User = url.UserPassword(proxyUser, proxyPass)
			}
			c.Transport = &http.Transport{
				Proxy: http.ProxyURL(httpProxyURL),
			}
			useProxy = true
		}
		httpClient = c
	}
	return &Client{
		httpClient: httpClient,
		useProxy:   useProxy,
	}
}

func buildPlayerIndexRequest(season string) (*http.Request, error) {
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
	params["SeasonType"] = "Pre Season"
	// params["SeasonType"] = "Regular Season"
	params["StarterBench"] = ""
	params["TeamID"] = "0"
	params["TwoWay"] = "0"
	params["VsConference"] = ""
	params["VsDivision"] = ""
	for qName, qValue := range params {
		q.Add(qName, qValue)
	}
	req.URL.RawQuery = q.Encode()
	return req, nil
}

func buildPlayerIndexV2Request(season string) (*http.Request, error) {
	/* This function wouldn't work because it's blocked by Access Origin nba.com */
	req, err := http.NewRequest("GET", playerIndexAPI_V2, nil)

	if err != nil {
		log.Printf("Errored creating NewRequest. err: %v\n", err)
		return nil, err
	}

	q := req.URL.Query()
	params := map[string]string{}
	params["College"] = ""
	params["Country"] = ""
	params["DraftPick"] = ""
	params["DraftRound"] = ""
	params["DraftYear"] = ""
	params["Height"] = ""
	params["Historical"] = ""
	params["LeagueID"] = "00"
	params["Season"] = season // "2021-22"
	params["SeasonType"] = "Pre Season"
	// params["SeasonType"] = "Regular Season"
	params["Weight"] = ""
	for qName, qValue := range params {
		q.Add(qName, qValue)
	}
	req.URL.RawQuery = q.Encode()
	return req, nil
}

// GetPlayerIndex returns a list of all current nba players with metadata such as player name, player id, team name, team id, etc.
// Parameter season expects an nba season represented as a string. e.g. "2021-22"
func (c *Client) GetPlayerIndex(season string) (map[string]*PlayerIndexResult, error) {
	req, err := buildPlayerIndexRequest(season)

	if err != nil {
		log.Print(err)
		return nil, err
	}
	c.setRequestHeaders(&req.Header)

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
				newPlayerResult.PlayerID = int(value.(float64))
			case "PLAYER_NAME":
				newPlayerResult.PlayerName = value.(string)
			case "TEAM_ID":
				newPlayerResult.TeamID = int(value.(float64))
			case "TEAM_ABBREVIATION":
				newPlayerResult.TeamAbbreviation = value.(string)
			default:
			}
		}
		results[newPlayerResult.String()] = newPlayerResult
	}

	return results, nil
}

// GetPlayerVideos fetches for the videos for a particular player's stats.
func (c *Client) GetPlayerVideos(season string, gameID string, teamID string, playerID string, statType string) ([]*PlayerVideoResult, error) {
	req, err := http.NewRequest("GET", playerVideosAPI, nil)

	if err != nil {
		log.Printf("[GetPlayerVideos] Errored creating NewRequest. err: %v\n", err)
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
	params["OppPlayerID"] = ""
	params["OpponentTeamID"] = "0"
	params["Outcome"] = ""
	params["PORound"] = "0"
	params["Period"] = "0"
	params["PlayerID"] = playerID // "1629001"
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
	params["SeasonType"] = "Pre Season"
	// params["SeasonType"] = "Regular Season"
	params["ShotClockRange"] = ""
	params["StartPeriod"] = "1"
	params["StartRange"] = "0"
	params["StarterBench"] = ""
	params["TeamID"] = teamID // "1610612763"
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
	fmt.Println(req.URL.RawQuery)
	c.setRequestHeaders(&req.Header)

	resp, err := c.httpClient.Do(req)

	if err != nil {
		fmt.Printf("[GetPlayerVideos] Errored when sending request to the server. err: %v\n", err)
		return nil, err
	}

	if resp.StatusCode != 200 {
		err := fmt.Errorf("Status code is not 200 OK. It's %s", resp.Status)
		fmt.Printf("[GetPlayerVideos] Errored when sending request to the server. err: %v\n", err)
		return nil, err
	}

	defer resp.Body.Close()
	responseData, err := ioutil.ReadAll(resp.Body)

	if err != nil {
		fmt.Printf("[GetPlayerVideos] Errored when reading response body. err: %v\n", err)
		return nil, err
	}

	var responseObject playerVideosResponse
	json.Unmarshal(responseData, &responseObject)

	results := []*PlayerVideoResult{}
	for idx, videoURL := range responseObject.PlayerIndexResultSets.Meta.VideoUrls {
		videoResult := &PlayerVideoResult{
			LargeVideoURL:  videoURL.LargeVideoURL,
			MediumVideoURL: videoURL.MediumVideoURL,
			SmallVideoURL:  videoURL.SmallVideoURL,
			Description:    responseObject.PlayerIndexResultSets.Playlist[idx].Description,
		}
		results = append(results, videoResult)
	}

	return results, nil
}

// GetGames returns a list of all games for the a specific date.
// Parameter date should be represented as a string in YYYY-MM-DD. e.g. "2021-10-25"
func (c *Client) GetGames(date string) ([]*GameResult, error) {
	req, err := http.NewRequest("GET", scoreboardAPI, nil)

	if err != nil {
		log.Printf("Errored creating NewRequest. err: %v\n", err)
		return nil, err
	}

	q := req.URL.Query()
	params := map[string]string{}
	params["GameDate"] = date // "2021-10-25"
	params["LeagueID"] = "00"
	for qName, qValue := range params {
		q.Add(qName, qValue)
	}
	req.URL.RawQuery = q.Encode()
	c.setRequestHeaders(&req.Header)

	resp, err := c.httpClient.Do(req)

	if err != nil {
		fmt.Printf("[GetGames] Errored when sending request to the server. err: %v\n", err)
		return nil, err
	}

	if resp.StatusCode != 200 {
		err := fmt.Errorf("Status code is not 200 OK. It's %s", resp.Status)
		fmt.Printf("[GetGames] Errored when sending request to the server. err: %v\n", err)
		return nil, err
	}

	defer resp.Body.Close()
	responseData, err := ioutil.ReadAll(resp.Body)

	if err != nil {
		fmt.Printf("[GetGames] Errored when reading response body. err: %v\n", err)
		return nil, err
	}

	var responseObject scoreboardResponse
	json.Unmarshal(responseData, &responseObject)

	results := []*GameResult{}
	for _, game := range responseObject.Scoreboard.Games {
		gameResult := &GameResult{
			GameID:               game.GameID,
			GameCode:             game.GameCode,
			AwayTeamID:           game.AwayTeam.TeamID,
			AwayTeamAbbreviation: game.AwayTeam.TeamAbbreviation,
			HomeTeamID:           game.HomeTeam.TeamID,
			HomeTeamAbbreviation: game.HomeTeam.TeamAbbreviation,
		}
		results = append(results, gameResult)
	}

	return results, nil
}

func (c *Client) setRequestAuthentication(header *http.Header) {
	proxyUser := os.Getenv("PROXY_USER")
	proxyPass := os.Getenv("PROXY_PASS")
	if proxyUser != "" && proxyPass != "" {
		fmt.Println("Proxy user and pass provided.")
		//adding proxy authentication
		auth := proxyUser + ":" + proxyPass
		basicAuth := "Basic " + base64.StdEncoding.EncodeToString([]byte(auth))
		header.Add("Proxy-Authorization", basicAuth)
	}
}

func (c *Client) setRequestHeaders(header *http.Header) {
	// header.Set("sec-ch-ua", `Google Chrome";v="95", "Chromium";v="95", ";Not A Brand";v="99`)
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
	// if c.useProxy {
	// 	c.setRequestAuthentication(header)
	// }
}

// Close closes the underlying http connection.
func (c *Client) Close() {
	c.httpClient.CloseIdleConnections()
}
