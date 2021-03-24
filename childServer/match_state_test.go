package main

import (
	"encoding/json"
	"fmt"
	"github.com/xtaci/kcp-go"
	"log"
	"testing"
)

var testState = NewState()

func TestMatchState_CheckSinglePlayerState(t *testing.T) {
	createRule()
	createMatch()

	testState.createStates("matchId", "jupiter", 0)

	match := make(map[string]interface{})
	match["matchId"] = "matchId"
	match["team"] = 0
	match["userId"] = "jupiterUserId"
	match["action"] = 1.0

	m, _ := json.Marshal(match)
	str := string(m)

	result := testState.watchMatchState(str)
	fmt.Println(result)
	if result != "jupiterUserId" {
		t.Errorf("Expected output to be jupiterUserId but got %v", result)
	}

}

func createRule(){
	rule := NewRule()
	//Set_MatchRules
	info := make(map[string]interface{})
	info["mode"] = "TDM1"
	info["key"] = "kill"
	info["value"] = 1.0

	m := []map[string]interface{}{
		info,
	}
	rule.setMatchRules(m)

}
func createMatch(){
	//createNewUser
	var user UserInfo
	user.UserID = "jupiterUserId"
	user.Username = "jupiter"


	var udpConn *kcp.UDPSession
	NewUser().setOnline(user, udpConn)
	//CreateMatch

	users := make(map[string]interface{})
	users["userId"] = "jupiterUserId"
	users["username"] = "jupiter"
	users["team"] = 0

	d := []map[string]interface{}{
		users,
	}

	payload := make(map[string]interface{})
	payload["matchId"] = "matchId"
	payload["matchMode"] = "TDM1"
	payload["data"] = d

	data, _ := json.Marshal(payload)

	var matchInfo MatchReadyMessage
	err := json.Unmarshal(data, &matchInfo)
	if err != nil {
		log.Fatal(err)
	}

	//create new room by match ID
	NewMatch().createMatch(matchInfo)
}