package main

import "main/connection"

func main() {
	nbaClient := connection.New(nil)
	defer nbaClient.Close()

	nbaClient.GetPlayerIndex("2021-22")
}
