package main

import (
	"github.com/xtaci/kcp-go"
	"testing"
)

func TestUserManger_SetOnline(t *testing.T) {

	var user UserInfo
	user.UserID = "jupiterUserId"
	user.Username = "jupiter"

	var udpConn *kcp.UDPSession
	actual := NewUser().setOnline(user, udpConn)

	if actual.UserID != "jupiterUserId" {
		t.Errorf("Expected output to be jupiterUserId but got %s", actual.UserID)
	}
}

func TestUserManger_UpdateUserStructure(t *testing.T) {

	userId := "jupiterUserId"
	playmateId := "playmateId"
	matchId := "matchId"

	value, ok := updateUserStructure(userId, playmateId, matchId)

	if value.MatchID != "matchId" {
		t.Errorf("Expected output to be matchId but got %s", value.MatchID)
	}
	if ok != true {
		t.Errorf("Expected output to be True but got %v", ok)
	}
}

func TestUserManger_GetUserInfo(t *testing.T) {

	userId := "jupiterUserId"

	value, ok := getUserInfo(userId)

	if value.UserID != "jupiterUserId" {
		t.Errorf("Expected output to be jupiterUserId but got %s", value.UserID)
	}
	if ok != true {
		t.Errorf("Expected output to be True but got %v", ok)
	}
}
