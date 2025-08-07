package handlers

import (
	"io/ioutil"
	"log"
	"net/http"
	"time"
)

func PollNowPlaying() {
	var lastSong string

	for {
		resp, err := http.Get("http://127.0.0.1:12345/nowplaying")
		if err != nil {
			log.Println("Polling error:", err)
			time.Sleep(5 * time.Second)
			continue
		}

		body, err := ioutil.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			log.Println("Read error:", err)
			time.Sleep(5 * time.Second)
			continue
		}

		song := string(body)
		if song != lastSong {
			log.Println("Now Playing:", song)
			lastSong = song
		}

		time.Sleep(5 * time.Second)
	}
}
