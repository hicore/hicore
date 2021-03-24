package main

import "testing"

var testRule = NewRule()

func TestMatchRule_SetMatchRules(t *testing.T)  {
	info := make(map[string]interface{})
	info["mode"] = "TDM1"
	info["key"] = "kill"
	info["value"] = 1.0

	m := []map[string]interface{}{
		info,
	}

	testRule.setMatchRules(m)
}

func TestMatchRule_GetRule(t *testing.T)  {
	result := testRule.getRule("TDM1")
	if result != 1.0 {
		t.Errorf("Expected output to be 1 but got %v", result)
	}
}
func TestMatchRule_CreateRuleForMatchId(t *testing.T)  {
	testRule.createRuleForMatchId("matchId" , "TDM1")
}

func TestMatchRule_GetMatchIdRule(t *testing.T)  {
	result := testRule.getMatchIdRule("matchId")

	if result != 1.0 {
		t.Errorf("Expected output to be 1 but got %v", result)
	}
}