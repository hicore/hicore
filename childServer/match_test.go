package main

import (
	"encoding/json"
	"github.com/xtaci/kcp-go"
	"log"
	"testing"
)

func TestMatch_CreateMatch(t *testing.T) {

	createNewUser()

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

func TestMatch_Join(t *testing.T) {

	result := NewMatch().Join("matchId", "jupiterUserId", "socketId")

	if result.Type != "success" {
		t.Errorf("Expected output to be success but got %v", result.Type)
	}
	if result.Code != 1 {
		t.Errorf("Expected output to be 1 but got %v", result.Code)
	}
}

func createNewUser() {
	var user UserInfo
	user.UserID = "jupiterUserId"
	user.Username = "jupiter"

	var udpConn *kcp.UDPSession
	NewUser().setOnline(user, udpConn)
}

func TestMatch_SaveMatchData(t *testing.T) {

	matchData := make(map[string]interface{})
	matchData["code"] = 1
	matchData["position"] = "xyz"
	matchData["weapon"] = "wid_1"
	matchData["set"] = "sid_1"

	md, _ := json.Marshal(matchData)

	match := make(map[string]string)
	match["matchId"] = "matchId"
	match["id"] = "jupiterUserId"
	match["matchData"] = string(md)

	m, _ := json.Marshal(match)
	str := string(m)

	result := NewMatch().SaveMatchData(str)
	if result != true {
		t.Errorf("Expected output to be True but got %v", result)
	}
}

func TestMatch_GetMatchData(t *testing.T) {

	result := NewMatch().GetMatchData("matchId", "socketId")

	if result.Type != "success" {
		t.Errorf("Expected output to be success but got %v", result.Type)
	}
}

func TestMatch_Leave(t *testing.T) {
	result := NewMatch().Leave("matchId", "jupiterUserId","socketId")
	if result.Type != "success" {
		t.Errorf("Expected output to be success but got %v", result.Type)
	}
}

func TestMatch_LeaveAll(t *testing.T) {
	result := NewMatch().LeaveAll("matchId")
	if result.Type != "success" {
		t.Errorf("Expected output to be success but got %v", result.Type)
	}
}