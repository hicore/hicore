package main

import (
	"encoding/json"
	"fmt"
	"log"
	"reflect"
	"sync"
	"time"
)

var matchRules = NewRule()

var (
	userMatchState = make(map[string]map[string]interface{})
	teamMatchState = make(map[string]map[int]interface{})
	usersState     = make(map[string]map[string]interface{})
)

type MatchState struct {
	SinglePlayerState map[string]map[string]interface{}
	TeamState         map[string]map[int]interface{}
	UsersState        map[string]map[string]interface{}
	Lock              sync.RWMutex
}

func NewState() *MatchState {
	return &MatchState{TeamState: teamMatchState, SinglePlayerState: userMatchState, UsersState: usersState}
}

func (state *MatchState) watchMatchState(inMatchState string) interface{} {

	// get write lock
	match.Lock.Lock()
	defer match.Lock.Unlock()

	// get data form json
	jsonData := []byte(inMatchState)

	var v interface{}
	err := json.Unmarshal(jsonData, &v)
	if err != nil {
		log.Fatal(err)
	}

	data := v.(map[string]interface{})

	matchId := data["matchId"].(string)
	subjectiveTeam := int(data["team"].(float64))
	subjectiveUser := data["userId"].(string)
	action := data["action"]

	if ok := isMatchExists(matchId); ok {
		if subjectiveTeam == 0 {
			return state.checkSinglePlayerState(matchId, subjectiveUser, action)
		} else {
			return state.checkTeamState(matchId, subjectiveTeam, action)
		}

	}
	return "test"
}

func (state *MatchState) checkSinglePlayerState(matchId string, userId string, action interface{}) string {
	if state.SinglePlayerState[matchId][userId] != nil {
		var rule = matchRules.getMatchIdRule(matchId)
		if typeOfKey(matchId) == 0.0 {
			result := state.SinglePlayerState[matchId][userId].(float64)
			result += action.(float64)
			state.SinglePlayerState[matchId][userId] = result
			if result >= rule.(float64) {
				createResult(matchId, userId, state.SinglePlayerState[matchId])
				return userId
			}

		} else if typeOfKey(matchId) == "" {
			state.SinglePlayerState[matchId][userId] = action
			if action.(string) == rule.(string) {
				createResult(matchId, userId, state.SinglePlayerState[matchId])
				return userId
			}
		}
	}
	return ""
}

func (state *MatchState) checkTeamState(matchId string, team int, action interface{}) int {

	if state.TeamState[matchId][team] != nil {
		var rule = matchRules.getMatchIdRule(matchId)

		if typeOfKey(matchId) == 0.0 {
			result := state.TeamState[matchId][team].(float64)
			result += action.(float64)
			state.TeamState[matchId][team] = result

			if result >= rule.(float64) {
				createResult(matchId, team, state.TeamState[matchId])
				return team
			}

		} else if typeOfKey(matchId) == "" {
			state.TeamState[matchId][team] = action
			if action.(string) == rule.(string) {
				createResult(matchId, team, state.TeamState[matchId])
				return team
			}
		}
	}
	return 0
}

func (state *MatchState) checkStateBaseOnTime(matchId string) {
	//TODO
	time.AfterFunc(30*time.Second, func() { createResult(matchId, "Hicore", "") })
}

func createResult(matchId string, winner interface{}, matchInfo interface{}) {
	parseData := make([]map[string]interface{}, 0, 0)
	var singleMap = make(map[string]interface{})
	singleMap["matchId"] = matchId
	singleMap["winner"] = winner
	singleMap["matchInfo"] = createMatchInfo(matchInfo)
	parseData = append(parseData, singleMap)

	b, err := json.Marshal(parseData)
	if err != nil {
		fmt.Println(err)
	}
	r := Result{
		Type:       "matchResult",
		FromClass:  "matchState.",
		ToClass:    "matchController",
		Code:       0,
		Message:    "The match is finished because of match rules",
		Data:       string(b),
		ToSocketId: "",
	}

	emitMessage(r)
}

func (state *MatchState) createStates(matchId string, userId string, userTeam int) {
	if userTeam == 0 {
		if _, ok := state.SinglePlayerState[matchId]; !ok {
			state.SinglePlayerState[matchId] = make(map[string]interface{})
		}

		state.SinglePlayerState[matchId][userId] = typeOfKey(matchId) // default action value start from 0
	} else {
		if _, ok := state.TeamState[matchId]; !ok {
			state.TeamState[matchId] = make(map[int]interface{})
			state.UsersState[matchId] = make(map[string]interface{})
		}
		state.TeamState[matchId][userTeam] = typeOfKey(matchId) // default action value start from 0
		state.UsersState[matchId][userId] = typeOfKey(matchId)  // default action value start from 0
	}

}

func createMatchInfo(info interface{}) []map[string]interface{} {
	parseData := make([]map[string]interface{}, 0, 0)
	v := reflect.ValueOf(info)
	if v.Kind() == reflect.Map {
		for _, key := range v.MapKeys() {
			value := v.MapIndex(key)
			var singleMap = make(map[string]interface{})
			singleMap["id"] = key.Interface()
			singleMap["action"] = value.Interface()
			parseData = append(parseData, singleMap)
		}
	}
	return parseData
}

func typeOfKey(matchId string) interface{} {
	var rule = matchRules.getMatchIdRule(matchId)

	switch rule.(type) {
	case float64:
		return 0.0 // float64
	case string:
		return "" // string
	default:
		return nil
	}
}

func (state *MatchState) removeState(matchId string) {

	if _, ok := state.SinglePlayerState[matchId]; ok {
		delete(state.SinglePlayerState, matchId)
	}
	if _, ok := state.TeamState[matchId]; ok {
		delete(state.TeamState, matchId)
	}
	//
	matchRules.removeMatchIdRule(matchId)

}
