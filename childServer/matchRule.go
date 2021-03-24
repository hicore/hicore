package main

import (
	"encoding/json"
	"log"
	"reflect"
)

var (
	rules       = make(map[string]map[string]interface{})
	matchIdRule = make(map[string]interface{})
)

type MatchRules struct {
	Rules       map[string]map[string]interface{}
	MatchIdRule map[string]interface{}
}

func NewRule() *MatchRules {
	return &MatchRules{Rules: rules, MatchIdRule: matchIdRule}
}

func (rule *MatchRules) setMatchRules(rules interface{}) {

	for key := range rule.Rules {
		delete(rule.Rules, key)
	}

	r, _ := json.Marshal(rules)

	// get data form json
	jsonData := []byte(r)

	var v interface{}
	err := json.Unmarshal(jsonData, &v)
	if err != nil {
		log.Fatal(err)
	}
	data := v.([]interface{})

	for _, r := range data {
		ruleData := r.(map[string]interface{})

		matchMode := ruleData["mode"].(string)
		key := ruleData["key"].(string)
		value := ruleData["value"]

		if _, ok := rule.Rules[matchMode]; !ok {
			rule.Rules[matchMode] = make(map[string]interface{})
			rule.Rules[matchMode][key] = value
		}
	}
}

func (rule *MatchRules) createRuleForMatchId(matchId string , matchMode string)  {
	if _, ok := rule.MatchIdRule[matchId]; !ok {
	rule.MatchIdRule[matchId] = rule.getRule(matchMode)
	}
}

func (rule *MatchRules) getRule(matchMode string) interface{} {
	if _, ok := rule.Rules[matchMode]; ok {
		key := reflect.ValueOf(rule.Rules[matchMode]).MapKeys()
		return rule.Rules[matchMode][key[0].String()]
	}
	return false
}

func (rule *MatchRules) getMatchIdRule(matchId string)  interface{} {
	if _, ok := rule.MatchIdRule[matchId]; ok {
		return rule.MatchIdRule[matchId]
	}

	return  false
}
func (rule *MatchRules) removeMatchIdRule(matchId string){
	if _, ok := rule.MatchIdRule[matchId]; ok {
		delete(rule.MatchIdRule, matchId)
	}
}