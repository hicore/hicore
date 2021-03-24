// Copyright (C) 2017 prototyped.cn All rights reserved.
// Distributed under the terms and conditions of the MIT License.
// See accompanying files LICENSE.

package main

import (
	"encoding/json"
	"fmt"
	"github.com/xtaci/kcp-go"
	"log"
	"net"
	"os"
)

var match = NewMatch()
var matchState = NewState()

type Event struct {
	EventName string      `json:"event"`
	TokenData string      `json:"tokenData,omitempty"`
	Data      interface{} `json:"data,omitempty"`
}

func main() {

	initSocket()

	//host := "0.0.0.0:7100"
	host := "0.0.0.0:" + getEnv("CHILD_PORT", "7100")
	if len(os.Args) > 1 {
		host = os.Args[1]
	}
	listener, err := kcp.Listen(host)
	if err != nil {
		log.Fatalf("Listen: %v", err)
	}
	log.Printf("start listen at %s\n", host)

	for {
		conn, err := listener.Accept()
		if err != nil {
			log.Fatalf("Accept: %v", err)
		}
		go handleConn(conn)

	}

}

// Echo every thing back
func handleConn(conn net.Conn) {
	defer conn.Close()
	var udpConn = conn.(*kcp.UDPSession)
	udpConn.SetWindowSize(128, 128)
	udpConn.SetNoDelay(1, 10, 2, 1)
	udpConn.SetStreamMode(true)
	fmt.Println("client connect", udpConn.RemoteAddr(), conn.RemoteAddr())

	var buffer = make([]byte, 1024)
	for {
		//conn.SetReadDeadline(time.Now().Add(30 * time.Second))
		bytesRead, err := udpConn.Read(buffer)
		if err != nil {
			//log.Printf("Read: %v", err, udpConn.RemoteAddr())
			break
		}

		//
		var e Event
		err2 := json.Unmarshal(buffer[:bytesRead], &e)
		if err2 != nil {
			log.Fatal(err2)
		}

		switch e.EventName {
		case "registerUser":
			ti, valid := checkToken(e.TokenData)
			if valid {

				NewUser().setOnline(ti.UserInfo, udpConn)

			} else {
				if _, err := udpConn.Write([]byte("Token is not valid")); err != nil {
					log.Fatal(err)
				}
			}
		case "broadcast":
			// get data form json
			jsonData := []byte(buffer[:bytesRead])
			match.Broadcast(jsonData)
		case "saveMatchData":
			_, valid := checkToken(e.TokenData)
			if valid {
				match.SaveMatchData(e.Data.(string))
			} else {
				if _, err := udpConn.Write([]byte("Token is not valid")); err != nil {
					log.Fatal(err)
				}
			}
		case "matchState":
			_, valid := checkToken(e.TokenData)
			if valid {
				matchState.watchMatchState(e.Data.(string))
			} else {
				if _, err := udpConn.Write([]byte("Token is not valid")); err != nil {
					log.Fatal(err)
				}
			}
		default:
			log.Fatal("cant find any event name")

		}
	}

}
