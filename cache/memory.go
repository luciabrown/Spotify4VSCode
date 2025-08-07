package cache

import "sync"

var (
	imageURL   string
	prettyJSON []byte
	mutex      sync.RWMutex
)

func SaveImageURL(url string) {
	mutex.Lock()
	defer mutex.Unlock()
	imageURL = url
}

func GetImageURL() string {
	mutex.RLock()
	defer mutex.RUnlock()
	return imageURL
}

func SaveJSON(data []byte) {
	mutex.Lock()
	defer mutex.Unlock()
	prettyJSON = data
}

func GetPrettyJSON() []byte {
	mutex.RLock()
	defer mutex.RUnlock()
	return prettyJSON
}
