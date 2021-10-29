package main

import (
	"fmt"
	"main/connection"
)

func main() {
	nbaClient := connection.New(nil)
	defer nbaClient.Close()

	playerResults, _ := nbaClient.GetPlayerIndex("2021-22")
	fmt.Printf("%d\n", playerResults["MEM:Desmond Bane"].PlayerID)
}
