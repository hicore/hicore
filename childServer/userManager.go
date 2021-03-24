package main

import (
	"fmt"
	"github.com/xtaci/kcp-go"
)

var userMaps = make(map[string]UserStructure)

type UserStructure struct {
	MatchID  string
	UserID   string
	Username string
	PlaymateId string
	Address  *kcp.UDPSession
}

type Users struct {
	UserIdentity map[string]UserStructure
}

func NewUser() *Users {
	return &Users{UserIdentity: userMaps}
}

func (u *Users) setOnline(user UserInfo, udpConn *kcp.UDPSession) UserStructure{
	var createUser UserStructure
	// check if user already has user identity, if not then create one
	if _, ok := u.UserIdentity[user.UserID]; !ok {


		createUser.UserID = user.UserID
		createUser.Username = user.Username
		createUser.Address = udpConn

		u.UserIdentity[user.UserID] = createUser
		return  createUser
	}else{
		return u.updateUserAddr(user ,udpConn)
	}

}

func (u *Users) updateUserAddr(user UserInfo, udpConn *kcp.UDPSession) UserStructure {
	var createUser UserStructure

	createUser.UserID = user.UserID
	createUser.Username = user.Username
	createUser.Address = udpConn

	u.UserIdentity[user.UserID] = createUser

	return createUser
}

func (u *Users) setOffline(userId string) {


	// it controlled with mother ship server
	if _, ok := u.UserIdentity[userId]; ok {

		// check if a user in-game or not then leave it
		match := NewMatch()
		match.Leave(u.UserIdentity[userId].MatchID,userId,"")

		// delete user form users map
		fmt.Println("user get offline", u.UserIdentity[userId])
		delete(u.UserIdentity, userId)
	}

}


func updateUserStructure(userId string, playmateId string , matchId string) (UserStructure , bool){

	var createUser UserStructure

	//  update user with match id
	if value, ok := userMaps[userId]; ok {


		createUser.UserID = value.UserID
		createUser.Username = value.Username
		createUser.Address = value.Address
		createUser.MatchID = matchId
		createUser.PlaymateId = playmateId
		userMaps[userId] = createUser

		return  createUser,ok
	}

	return createUser, false
}

func getUserInfo(userId string) (UserStructure, bool) {

	if value, ok := userMaps[userId]; ok {
		return value, ok
	}
	return userMaps[""], false

}
