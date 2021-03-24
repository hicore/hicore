const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');
const matchModeController = require('../controller/matchModeController');
const matchRuleController = require('../controller/matchRuleController');
const staticsDataController = require('../controller/staticsDataController');
const progressRulesController = require('../controller/progressRulesController');
const auth = require('../../config/auth');

router.post('/register', adminController.registerNewAdmin);
router.post('/login', adminController.loginAdmin);
router.get('/', auth, adminController.getAdminDetails);

router.post('/match-mode', matchModeController.addMode);
router.get('/match-mode', matchModeController.getMatchModes);
router.delete('/match-mode', matchModeController.deleteMode);

router.post('/match-rule', matchRuleController.addRule);
router.get('/match-rule', matchRuleController.getMatchRules);
router.delete('/match-rule', matchRuleController.deleteRule);

router.post('/static-class', staticsDataController.createClass);
router.get('/static-class', staticsDataController.getClasses);
router.delete('/static-class', staticsDataController.deleteClass);

router.post('/static-class-column', staticsDataController.addColumn);
router.get('/static-class-column', staticsDataController.getColumn);
router.delete('/static-class-column', staticsDataController.deleteColumn);

router.post('/static-class-row', staticsDataController.addRow);
router.get('/static-class-row', staticsDataController.getRow);
router.post('/static-class-row-update', staticsDataController.updateRow);
router.delete('/static-class-row', staticsDataController.deleteRow);

router.post('/progress-level', progressRulesController.addXp);
router.get('/progress-level', progressRulesController.getXps);
router.delete('/progress-level', progressRulesController.deleteXps);
router.post('/progress-level-update', progressRulesController.updateXpRow);

router.post('/progress-rank', progressRulesController.addSkill);
router.get('/progress-rank', progressRulesController.getSkills);
router.delete('/progress-rank', progressRulesController.deleteSkills);
router.post('/progress-rank-update', progressRulesController.updateSkillRow);

module.exports = router;
