package main

import (
	"main/api"

	_ "github.com/heroku/x/hmetrics/onload"
)

func main() {
	api.HandleRequests()
}
