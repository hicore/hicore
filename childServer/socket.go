package main

import (
	"Hicore/socket"
	"Hicore/transport"
	"encoding/json"
	"fmt"
	"log"
	"strconv"
)

var client *socket.Client

type MatchReadyMessage struct {
	MatchID string `json:"matchId"`
	MatchMode  string `json:"matchMode"`
	Data    []struct {
		UserID     string `json:"userId"`
		Username   string `json:"username"`
		PlaymateID string `json:"playmateId,omitempty"`
		Team       int    `json:"team"`
	} `json:"data"`
}

type UserStatus struct {
	Status   int    `json:"status"`
	UserID   string `json:"userId"`
	Username string `json:"username"`
}

type Result struct {
	Type       string
	FromClass  string // className.methodName
	ToClass    string // the class result should back to it in MotherShip server
	Message    string
	Code       int
	Data       string
	ToSocketId string // the socket id, data should back to it
}

func initSocket() {

	var params []string

	params = append(params, "socketKey="+getEnv("MOTHERSHIP_SOCKET_KEY", "defaultKey"))
	params = append(params, "childServerKey="+getEnv("CHILD_SERVER_KEY", "defaultChildServerKey"))
	params = append(params, "serverLocation="+getEnv("CHILD_SERVER_LOCATION", ""))
	params = append(params, "serverCode="+getEnv("CHILD_SERVER_CODE", "1"))
	params = append(params, "serverId="+getEnv("CHILD_SERVER_ID", "default"))
	params = append(params, "type=server")

	port, _ := strconv.Atoi(getEnv("MOTHERSHIP_PORT", "7192"))

	_url := socket.GetUrl(getEnv("MOTHERSHIP_HOST", "localhost"), port, params, false)
	c, err := socket.Dial(_url, transport.GetDefaultWebsocketTransport())
	if err != nil {
		log.Fatal("Dial Error:", err)
	}
	client = c
	err = c.On(socket.OnDisconnection, func(h *socket.Channel) {
		fmt.Println("Disconnected. Try to reconnect")
		initSocket()

	})
	err = c.On(socket.OnConnection, func(h *socket.Channel) {
		log.Println("Connected to mothership")
		//c.Emit("ChildServer", "hello")
	})
	err = c.On(socket.OnError, func(h *socket.Channel) {
		fmt.Println("Error")
	})
	if err != nil {
		log.Fatal(err)
	}

	err = c.On("MssMatchmaker", func(h *socket.Channel, args MatchReadyMessage) {

		data, _ := json.Marshal(args)
		// receive data form matchmaker in mother ship server in json form
		var matchInfo MatchReadyMessage
		err := json.Unmarshal(data, &matchInfo)
		if err != nil {
			log.Fatal(err)
		}

		//create new room by match ID
		NewMatch().createMatch(matchInfo)

	})

	err = c.On("MssUserStatus", func(h *socket.Channel, args UserStatus) {

		data, _ := json.Marshal(args)
		// receive data form matchmaker in mother ship server in json form
		var userStatus UserStatus
		err := json.Unmarshal(data, &userStatus)
		if err != nil {
			log.Fatal(err)
		}

		if userStatus.Status == 0 {
			user := NewUser()
			user.setOffline(userStatus.UserID)
		}

	})

	err = c.On("MssJoinToMatch", func(h *socket.Channel, args interface{}) {

		data, _ := json.Marshal(args)

		jsonData := []byte(data)

		var v interface{}
		err := json.Unmarshal(jsonData, &v)
		if err != nil {
			log.Fatal(err)
		}
		userData := v.(map[string]interface{})

		matchId := userData["matchId"].(string)
		userId := userData["userId"].(string)
		socketId := userData["socketId"].(string)

		match := NewMatch()
		// join that user to match by id
		c.Emit("ChildServer", match.Join(matchId, userId, socketId))
		// retrieve match data and send it to motherShip server
		emitErr := c.Emit("ChildServer", match.GetMatchData(matchId, socketId))

		if emitErr != nil {
			log.Fatal(emitErr)
		}
		//result, err := c.Ack("MssJoinToGame", MyEventData{"ack data"}, time.Second * 5)
		//fmt.Println(result , err)

	})

	err = c.On("MssLeaveMatch", func(h *socket.Channel, args interface{}) {

		data, _ := json.Marshal(args)

		jsonData := []byte(data)

		var v interface{}
		err := json.Unmarshal(jsonData, &v)
		if err != nil {
			log.Fatal(err)
		}
		userData := v.(map[string]interface{})

		matchId := userData["matchId"].(string)
		userId := userData["userId"].(string)
		socketId := userData["socketId"].(string)

		match := NewMatch()
		// leave that user from match by id
		emitErr := c.Emit("ChildServer", match.Leave(matchId, userId, socketId))
		if emitErr != nil {
			log.Fatal(emitErr)
		}

	})

	err = c.On("MssLeaveAll", func(h *socket.Channel, args interface{}) {

		data, _ := json.Marshal(args)

		jsonData := []byte(data)

		var v interface{}
		err := json.Unmarshal(jsonData, &v)
		if err != nil {
			log.Fatal(err)
		}
		userData := v.(map[string]interface{})

		matchId := userData["matchId"].(string)

		match := NewMatch()
		// leave that user from match by id
		emitErr := c.Emit("ChildServer", match.LeaveAll(matchId))
		if emitErr != nil {
			log.Fatal(emitErr)
		}

	})

	err = c.On("MssMatchRules", func(h *socket.Channel, args interface{}) {

		rule := NewRule()
		rule.setMatchRules(args)
	})

	if err != nil {
		log.Fatal(err)
	}
}

func emitMessage(m interface{}) {
	if client != nil{
		emitErr := client.Emit("ChildServer", m)
		if emitErr != nil {
			log.Fatal(emitErr)
		}
	}
}
