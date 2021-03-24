package main

import (
	"encoding/json"
	"github.com/dgrijalva/jwt-go"
	"io/ioutil"
	"log"
)

type JsonToken struct {
	Token string `json:"token"`
}

type UserInfo struct {
	UserID   string `json:"userId"`
	Username string `json:"username"`
}

type TokenInfo struct {
	Exp      int `json:"exp"`
	Iat      int `json:"iat"`
	UserInfo `json:"user"`
}

const (
	pubKeyPath = "./keys/public.key"
)

func checkToken(tokenData string) (TokenInfo, bool) {

	pubKey, err := ioutil.ReadFile(pubKeyPath)

	if err != nil {
		log.Fatal(err)
	}
	token, err := jwt.Parse(tokenData, func(token *jwt.Token) (interface{}, error) {
		key, err := jwt.ParseRSAPublicKeyFromPEM(pubKey)
		if err != nil {
			return nil, err
		}

		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, err
		}

		return key, nil
	})

	var ut TokenInfo

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		data, _ := json.Marshal(claims)

		err := json.Unmarshal(data, &ut)
		if err != nil {
			log.Fatal(err)
		}

		return ut, token.Valid

	}
	return ut, false

}
