package connection

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
)

const (
	playerIndexAPI = "https://stats.nba.com/stats/leaguedashplayerstats?"
)

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
func (c *Client) GetPlayerIndex(season string) (map[string]interface{}, error) {
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

	req.Header.Set("name", "value")
	req.Header.Set("Accept", "application/json, text/plain, */*")
	req.Header.Set("x-nba-stats-token", "true")
	// req.Header.Set("sec-ch-ua-mobile", "?0")
	req.Header.Set("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36")
	req.Header.Set("x-nba-stats-origin", "stats")
	req.Header.Set("sec-ch-ua-platform", "Linux")
	req.Header.Set("Origin", "https://www.nba.com")
	req.Header.Set("Sec-Fetch-Site", "same-site")
	req.Header.Set("Sec-Fetch-Mode", "cors")
	req.Header.Set("Sec-Fetch-Dest", "empty")
	req.Header.Set("Referer", "https://www.nba.com/")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	// req.Header.Set("If-Modified-Since", "Thu, 28 Oct 2021 06:32:33 GMT")

	resp, err := c.httpClient.Do(req)

	if err != nil {
		fmt.Printf("Errored when sending request to the server. err: %v\n", err)
		return nil, err
	}

	defer resp.Body.Close()
	responseData, _ := ioutil.ReadAll(resp.Body)

	fmt.Println(resp.Status)
	fmt.Println(string(responseData))

	return nil, nil
}

// Close closes the underlying http connection.
func (c *Client) Close() {
	c.httpClient.CloseIdleConnections()
}
