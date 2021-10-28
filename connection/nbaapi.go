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

// GetPlayerIndex returns a list of all current nba players with metadata such as player name, player id, team name, team id, etc.
func GetPlayerIndex(params map[string]string) (map[string]interface{}, error) {
	client := &http.Client{}
	req, err := http.NewRequest("GET", playerIndexAPI, nil)

	if err != nil {
		log.Printf("Errored creating NewRequest. err: %v\n", err)
		return nil, err
	}

	q := req.URL.Query()
	for qName, qValue := range params {
		q.Add(qName, qValue)
	}
	req.URL.RawQuery = q.Encode()
	fmt.Println(req.URL.RawPath)

	resp, err := client.Do(req)

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
