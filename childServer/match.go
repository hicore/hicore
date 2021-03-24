package main

import (
	"encoding/json"
	"fmt"
	"log"
	"reflect"
	"sync"
)

var (
	rooms     = make(map[string]map[string]UserStructure)
	matchData = make(map[string]map[string]interface{})
)

type Match struct {
	Rooms     map[string]map[string]UserStructure // map of rooms where each room contains a map of connection id to connections in that room
	MatchData map[string]map[string]interface{}   // map of matches in progress where each match contains a map of that match data
	Lock      sync.RWMutex                        // access lock for rooms
}

// NewMatch creates a new Match adapter
func NewMatch() *Match {
	return &Match{Rooms: rooms, MatchData: matchData}
}

func (match *Match) createMatch(motherShipData MatchReadyMessage) { // TODO: need return values to motherShip server

	// get write lock
	match.Lock.Lock()
	defer match.Lock.Unlock()

	// check if room already has user mappings, if not then create one
	if _, ok := match.Rooms[motherShipData.MatchID]; !ok {
		match.Rooms[motherShipData.MatchID] = make(map[string]UserStructure)
		// create match data mappings
		match.MatchData[motherShipData.MatchID] = make(map[string]interface{})

		matchRules.createRuleForMatchId(motherShipData.MatchID , motherShipData.MatchMode)
	}

	for _, userInfo := range motherShipData.Data {

		//create match state for watching final result.
		matchState.createStates(motherShipData.MatchID, userInfo.UserID, userInfo.Team)
		// update user info with playmate id and match id
		updateUserStructure(userInfo.UserID, userInfo.PlaymateID, motherShipData.MatchID)
		// get data from user manager to add this user to room, with user address
		user, ok := getUserInfo(userInfo.UserID)
		if ok {
			// add the user to the rooms user map
			match.Rooms[motherShipData.MatchID][userInfo.UserID] = user

		}
	}
}

func (match *Match) Broadcast(inMatchData []byte) {

	var v interface{}
	err := json.Unmarshal(inMatchData, &v)
	if err != nil {
		log.Fatal(err)
	}

	data := v.(map[string]interface{})
	matchData := data["data"].(map[string]interface{})

	matchId := matchData["matchId"].(string)

	// BROADCAST
	// iterate through each connection in the room
	if _, ok := match.Rooms[matchId]; ok {
		matchDataForBroadcast, _ := json.Marshal(matchData)
		for _, connection := range match.Rooms[matchId] {
			// emit the event to the connection
			if _, err := connection.Address.Write(matchDataForBroadcast); err != nil {
				log.Fatal(err)
			}
			//fmt.Println(connection.Address.RemoteAddr())
		}
	}
}

func (match *Match) Join(matchId string, userId string, socketId string) Result {
	// it controlled by mother ship server

	// get write lock
	match.Lock.Lock()
	defer match.Lock.Unlock()

	if _, ok := match.MatchData[matchId]; ok {

		user, r := getUserInfo(userId)
		if r {
			// add the user to the rooms user map
			match.Rooms[matchId][userId] = user

			success := Result{
				Type:       "success",
				FromClass:  "match.Join",
				ToClass:    "matchController",
				Code:       1,
				Message:    "Join to match successfully",
				Data:       "",
				ToSocketId: socketId,
			}
			return success

		}
	}

	warning := Result{
		Type:       "warning",
		FromClass:  "match.Join",
		ToClass:    "matchController",
		Code:       0,
		Message:    "Match does not exist for this matchId",
		Data:       "",
		ToSocketId: socketId,
	}
	return warning
}

func (match *Match) Leave(matchId string, userId string, socketId string) Result {
	// it controlled by mother ship server

	// get write lock
	match.Lock.Lock()
	defer match.Lock.Unlock()

	// check if room  has user mappings, if yes deleted
	if _, ok := match.Rooms[matchId]; ok {
		delete(match.Rooms[matchId], userId)

		success := Result{
			Type:       "success",
			FromClass:  "match.Leave",
			ToClass:    "matchController",
			Code:       1,
			Message:    "Left from match successfully",
			Data:       "",
			ToSocketId: socketId,
		}
		return success
	}

	warning := Result{
		Type:       "warning",
		FromClass:  "match.Leave",
		ToClass:    "matchController",
		Code:       0,
		Message:    "Match does not exist for this matchId",
		Data:       "",
		ToSocketId: socketId,
	}
	return warning

}
func (match *Match) LeaveAll(matchId string) Result {
	// it should control with mother ship server

	// get write lock
	match.Lock.Lock()
	defer match.Lock.Unlock()

	fmt.Println("leave all", match.MatchData)

	if _, ok := match.Rooms[matchId]; ok {

		matchState.removeState(matchId)

		delete(match.Rooms, matchId)
		delete(match.MatchData, matchId)

		success := Result{
			Type:       "success",
			FromClass:  "match.LeaveAll",
			ToClass:    "matchController",
			Code:       1,
			Message:    "Match deleted successfully",
			Data:       "", //TODO send final info to mother ship server?
			ToSocketId: "",
		}
		return success
	}

	warning := Result{
		Type:       "warning",
		FromClass:  "match.LeaveAll",
		ToClass:    "matchController",
		Code:       0,
		Message:    "Match does not exist for this matchId",
		Data:       "",
		ToSocketId: "",
	}
	return warning
}

// save all game data for future like if users lost internet connection and so on
// we can save users states like which weapon or set they have ...
// the id parameter can be user id or environment id
func (match *Match) SaveMatchData(data string) bool {

	// get write lock
	match.Lock.Lock()
	defer match.Lock.Unlock()

	// get data form json
	jsonData := []byte(data)

	var v interface{}
	err := json.Unmarshal(jsonData, &v)
	if err != nil {
		log.Fatal(err)
	}
	userData := v.(map[string]interface{})

	matchId := userData["matchId"].(string)
	id := userData["id"].(string)
	matchData := userData["matchData"]

	if _, ok := match.MatchData[matchId]; ok {

		// save it to map
		match.MatchData[matchId][id] = matchData

		return true
	}
	return false
}

func (match *Match) GetMatchData(matchId string, socketId string) Result {

	if _, ok := match.MatchData[matchId]; ok {

		// use reflect to iterate through the map
		// and then convert maps to json string
		// like -> [{"id":"userId or any Id","matchData":{"position":"xyz","set":"sid_3","weapon":"wid_1"}}].

		parseData := make([]map[string]interface{}, 0, 0)
		v := reflect.ValueOf(match.MatchData[matchId])
		if v.Kind() == reflect.Map {
			for _, key := range v.MapKeys() {
				value := v.MapIndex(key)
				var singleMap = make(map[string]interface{})
				singleMap["id"] = key.Interface()
				singleMap["matchData"] = value.Interface()
				parseData = append(parseData, singleMap)
			}
		}

		//b, _ := json.MarshalIndent(parseData, "", "    ")
		//fmt.Println(string(b))
		b, err := json.Marshal(parseData)
		if err != nil {
			fmt.Println(err)
		} else {
			success := Result{
				Type:       "success",
				FromClass:  "match.GetMatchData",
				ToClass:    "matchController",
				Code:       1,
				Message:    "Retrieve match data successfully",
				Data:       string(b),
				ToSocketId: socketId,
			}
			return success
		}

	}
	warning := Result{
		Type:       "warning",
		FromClass:  "match.GetMatchData",
		ToClass:    "matchController",
		Code:       0,
		Message:    "Data does not exist for this matchId",
		Data:       "",
		ToSocketId: socketId,
	}
	return warning
}

func isMatchExists(matchId string) bool {
	if _, ok := match.Rooms[matchId]; !ok {
		return false
	}
	return true
}
