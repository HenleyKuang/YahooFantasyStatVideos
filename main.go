package main

import (
	"log"
	"main/api"
	"os"

	_ "github.com/heroku/x/hmetrics/onload"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		log.Fatal("$PORT must be set")
	}
	api.HandleRequests(port)
}
