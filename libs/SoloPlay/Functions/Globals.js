/*
*	@filename	Globals.js
*	@author		theBGuy
*	@credits	isid0re
*	@desc		Global variables Settings, general functions for Kolbot-SoloPlay functionality
*/

if (!isIncluded("OOG.js")) { include("OOG.js"); }
if (!isIncluded("SoloPlay/Tools/Developer.js")) { include("SoloPlay/Tools/Developer.js"); }
if (!isIncluded("SoloPlay/Tools/SoloData.js")) { include("SoloPlay/Tools/SoloData.js"); }
if (!isIncluded("SoloPlay/Functions/PrototypesOverrides.js")) { include("SoloPlay/Functions/PrototypesOverrides.js"); }

let sdk = require('../modules/sdk');
let myData = SoloData.getStats();

// these builds are not possible to do on classic
let impossibleClassicBuilds = ["Bumper", "Socketmule", "Witchyzon", "Auradin", "Torchadin", "Immortalwhirl"];
// these builds are not possible to do without ladder runewords
let impossibleNonLadderBuilds = ["Auradin"];

function myPrint (str = "", toConsole = false, color = 0) {
	console.log("ÿc8Kolbot-SoloPlayÿc0: " + str);
	me.overhead(str);

	if (toConsole && typeof color === "string") {
		color = color[0].toUpperCase() + color.substring(1).toLowerCase();
		color = !!sdk.colors.D2Bot[color] ? sdk.colors.D2Bot[color] : 0;
	}
	toConsole && D2Bot.printToConsole("Kolbot-SoloPlayÿ :: " + str, color);
}

function updateMyData () {
	scriptBroadcast("data--" + JSON.stringify(Misc.copy(myData)));
}

function ensureData () {
	let update = false;

	if (myData.me.currentBuild !== SetUp.getBuild()) {
		switch (true) {
		case Check.currentBuild().active():
		case Check.finalBuild().active():
			myData.me.currentBuild = SetUp.getBuild();
			console.debug(myData);
			update = true;

			break;
		case !["Start", "Stepping", "Leveling"].includes(SetUp.getBuild()) && myData.me.currentBuild !== myData.me.finalBuild:
			myData.me.currentBuild = "Leveling";
			console.debug(myData);
			update = true;

			break;
		}
	}

	if (sdk.difficulty.Difficulties.indexOf(myData.me.highestDifficulty) < sdk.difficulty.Difficulties.indexOf(sdk.difficulty.nameOf(me.diff))) {
		myData.me.highestDifficulty = sdk.difficulty.nameOf(me.diff);
		console.debug(myData);
		update = true;
	}

	if (!!me.smith && myData[sdk.difficulty.nameOf(me.diff).toLowerCase()].imbueUsed === false) {
		myData[sdk.difficulty.nameOf(me.diff).toLowerCase()].imbueUsed = true;
		console.debug(myData);
		update = true;
	}

	if (!!me.respec && myData[sdk.difficulty.nameOf(me.diff).toLowerCase()].respecUsed === false) {
		myData[sdk.difficulty.nameOf(me.diff).toLowerCase()].respecUsed = true;
		console.debug(myData);
		update = true;
	}

	// Merc check
	if (me.expansion) {
		if (!!me.getMerc()) {
			// TODO: figure out how to ensure we are already using the right merc to prevent re-hiring
			// can't do an aura check as merc auras are bugged, only useful info from getUnit is the classid
		}

		if (!!me.shenk && myData[sdk.difficulty.nameOf(me.diff).toLowerCase()].socketUsed === false) {
			myData[sdk.difficulty.nameOf(me.diff).toLowerCase()].socketUsed = true;
			console.debug(myData);
			update = true;
		}
	}

	update && SoloData.updateData("me", myData) && updateMyData();
}

// general settings
const SetUp = {
	scripts: [
		"corpsefire", "den", "bloodraven", "tristram", "treehead", "countess", "smith", "pits", "jail", "boneash", "andariel", "a1chests", "cows", // Act 1
		"cube", "radament", "amulet", "summoner", "tombs", "ancienttunnels", "staff", "duriel", // Act 2
		"lamessen", "templeruns", "lowerkurast", "eye", "heart", "brain", "travincal", "mephisto", // Act 3
		"izual", "hellforge", "river", "hephasto", "diablo", // Act 4
		"shenk", "savebarby", "anya", "ancients", "baal", "a5chests", // Act 5
	],

	// Should this be moved elsewhere? Currently have to include Globals then call this to include rest of overrides
	// which in doing so would include globals anyway but does this always need to be included first?
	// really need a centralized way to make sure all files use/have the custom functions and all threads stay updated without having to
	// scriptBroadcast all the time
	include: function () {
		let folders = ["Functions"];
		folders.forEach( (folder) => {
			let files = dopen("libs/SoloPlay/" + folder + "/").getFiles();
			Array.isArray(files) && files
				.filter(file => file.endsWith('.js'))
				.sort(a => a.startsWith("PrototypesOverrides.js") ? 0 : 1) // Dirty fix to load new prototypes first
				.forEach(function (x) {
					if (!isIncluded("SoloPlay/" + folder + "/" + x)) {
						if (!include("SoloPlay/" + folder + "/" + x)) {
							throw new Error("Failed to include " + "SoloPlay/" + folder + "/" + x);
						}
					}
				});
		});
	},

	// Storage Settings
	sortSettings: {
		ItemsSortedFromLeft: [], // default: everything not in Config.ItemsSortedFromRight
		ItemsSortedFromRight: [
			// (NOTE: default pickit is fastest if the left side is open)
			603, 604, 605, // sort charms from the right
			519, 518, 543, // sort tomes and keys to the right
			515, 516, 587, 588, 589, 590, 591, 592, 593, 594, 595, 596 // sort all inventory potions from the right
		],
		PrioritySorting: true,
		ItemsSortedFromLeftPriority: [/*605, 604, 603, 519, 518*/], // (NOTE: the earlier in the index, the further to the Left)
		ItemsSortedFromRightPriority: [
			// (NOTE: the earlier in the index, the further to the Right)
			605, 604, 603, // sort charms from the right, GC > LC > SC
			519, 518, 543
		],
	},

	currentBuild: this.currentBuild,
	finalBuild: this.finalBuild,

	// setter for Developer option to stop a profile once it reaches a certain level
	stopAtLevel: (function () {
		if (!Developer.stopAtLevel.enabled) return false;
		let level = Developer.stopAtLevel.profiles.find(profile => profile[0].toLowerCase() === me.profile.toLowerCase()) || false;
		return level ? level[1] : false;
	})(),

	// pulls respec requirments from final build file
	respecTwo: function () {
		let respec = Check.finalBuild().respec() ? me.charlvl : 100;

		if (respec === me.charlvl && me.charlvl < 60) {
			showConsole();
			print("ÿc8Kolbot-SoloPlayÿc0: Bot has respecTwo items but is too low a level to respec.");
			print("ÿc8Kolbot-SoloPlayÿc0: This only happens with user intervention. Remove the items you gave the bot until at least level 60");
			respec = 100;
		}

		return respec;
	},

	getBuild: function () {
		let buildType;

		if (me.charlvl < Config.respecOne) {
			buildType = "Start";
		} else if (me.charlvl >= SetUp.respecTwo()) {
			buildType = SetUp.finalBuild;
		} else if (Config.respecOneB > 0 && me.charlvl >= Config.respecOne && me.charlvl < Config.respecOneB) {
			buildType = "Stepping";
		} else {
			buildType = "Leveling";
		}

		return buildType;
	},

	specPush: function (specType) {
		function getBuildTemplate () {
			let buildType = SetUp.getBuild();
			let build = buildType + "Build" ;
			let template = "SoloPlay/BuildFiles/" + sdk.charclass.nameOf(me.classid) + "." + build + ".js";

			return template.toLowerCase();
		}

		let template = getBuildTemplate();

		if (!include(template)) {
			throw new Error("Failed to include template: " + template);
		}

		let specCheck = [];
		let final = SetUp.getBuild() === SetUp.finalBuild;

		switch (specType) {
		case "skills":
			// Push skills value from template file
			specCheck = JSON.parse(JSON.stringify((final ? finalBuild.skills : build.skills)));

			break;
		case "stats":
			// Push stats value from template file
			specCheck = JSON.parse(JSON.stringify((final ? finalBuild.stats : build.stats)));

			break;
		}

		return specCheck;
	},

	makeNext: function () {
		if (!isIncluded("SoloPlay/Tools/NameGen.js")) { include("SoloPlay/Tools/NameGen.js"); }
		if (!isIncluded("SoloPlay/Tools/Tracker.js")) { include("SoloPlay/Tools/Tracker.js"); }
		let gameObj, printTotalTime = Developer.logPerformance;
		printTotalTime && (gameObj = Developer.readObj(Tracker.GTPath));

		// log info
		myPrint(this.finalBuild + " goal reached. On to the next.");
		D2Bot.printToConsole("Kolbot-SoloPlay: " + this.finalBuild + " goal reached" + (printTotalTime ? " (" + (Developer.formatTime(gameObj.Total + Developer.Timer(gameObj.LastSave))) + "). " : ". ") + "Making next...", 6);

		D2Bot.setProfile(null, null, NameGen());
		SoloData.delete(true);
		delay(100 + me.ping);
		D2Bot.restart();
	},
};

Object.defineProperties(SetUp, {
	currentBuild: {
        get: function () {
            return myData.me.currentBuild;
        },
    },
    finalBuild: {
        get: function () {
            return myData.me.finalBuild;
        },
    },
});

// SoloPlay Pickit Items
// TODO: check if is this even needed?
const nipItems = {
	Selling: [
		'([type] == ring || [type] == amulet) && [quality] >= magic # [fcr] >= 600',
		'([type] == armor || [type] == boots || [type] == gloves || [type] == belt) && [quality] >= magic # [fcr] >= 600',
		'([type] == helm || [type] == circlet || [type] == primalhelm || [type] == pelt) && [quality] >= magic # [fcr] >= 600',
		'([type] == shield || [type] == voodooheads) && [quality] >= magic # [fcr] >= 600',
		'([type] == javelin || [type] == amazonspear || [type] == amazonjavelin) && [quality] >= rare # [fcr] >= 600',
		'([type] == orb || [type] == wand || [type] == staff) && [quality] >= normal # [fcr] >= 600',
		'([type] == throwingaxe || [type] == axe || [type] == mace || [type] == club || [type] == scepter || [type] == hammer) && [quality] >= magic # [fcr] >= 600',
		'([type] == sword || [type] == knife || [type] == throwingknife) && [quality] >= magic # [fcr] >= 600',
		'([type] == bow || [type] == crossbow) && [quality] >= rare # [fcr] >= 600',
		'([type] == handtohand || [type] == assassinclaw) && [quality] >= magic  # [fcr] >= 600',
	],

	General: [
		"[name] == tomeoftownportal",
		"[name] == tomeofidentify",
		"[name] == gold # [gold] >= me.charlvl * 3 * me.diff",
		"(me.charlvl < 20 || me.gold < 500) && [name] == minorhealingpotion",
		"(me.charlvl < 25 || me.gold < 2000) && [name] == lighthealingpotion",
		"(me.charlvl < 29 || me.gold < 5000) && [name] == healingpotion",
		"[name] == greaterhealingpotion",
		"[name] == superhealingpotion",
		"(me.charlvl < 20 || me.gold < 1000) && [name] == minormanapotion",
		"[name] == lightmanapotion",
		"[name] == manapotion",
		"[name] == greatermanapotion",
		"[name] == supermanapotion",
		"[name] == rejuvenationpotion",
		"[name] == fullrejuvenationpotion",
		"[name] == scrolloftownportal # # [maxquantity] == 20",
		"[name] == scrollofidentify # # [maxquantity] == 20",
		"[name] == key # # [maxquantity] == 12",
	],

	Gems: [
		"[name] == perfecttopaz # # [maxquantity] == 2",
		"[name] == perfectdiamond # # [maxquantity] == 2",
		"[name] == perfectruby # # [maxquantity] == 2",
	],

	Quest: [
		"[name] == mephisto'ssoulstone",
		"[name] == hellforgehammer",
		"[name] == scrollofinifuss",
		"[name] == keytothecairnstones",
		"[name] == bookofskill",
		"[name] == horadriccube",
		"[name] == shaftofthehoradricstaff",
		"[name] == topofthehoradricstaff",
		"[name] == horadricstaff",
		"[name] == ajadefigurine",
		"[name] == thegoldenbird",
		"[name] == potionoflife",
		"[name] == lamesen'stome",
		"[name] == khalim'seye",
		"[name] == khalim'sheart",
		"[name] == khalim'sbrain",
		"[name] == khalim'sflail",
		"[name] == khalim'swill",
		"[name] == scrollofresistance",
	],
};

const goToDifficulty = function (diff = undefined, reason = "") {
	if (!diff) return;
	let diffString;
	switch (typeof diff) {
	case "string":
		diff = diff[0].toUpperCase() + diff.substring(1).toLowerCase();
		if (!sdk.difficulty.Difficulties.includes(diff) || sdk.difficulty.Difficulties.indexOf(diff) === me.diff) return;
		diffString = diff;

		break;
	case "number":
		if (diff === me.diff || diff < 0) return;
		diffString = sdk.difficulty.nameOf(diff);

		break;
	}

	D2Bot.setProfile(null, null, null, diffString);
	DataFile.updateStats("setDifficulty", diffString);
	myPrint("Going to " + diffString + reason, true);
	D2Bot.restart();
};

// General Game functions
const Check = {
	// TODO: clean this up somehow, I dislike how it looks right now as its not completely clear
	Task: function (sequenceName) {
		let needRunes = this.Runes();

		switch (sequenceName.toLowerCase()) {
		case "den":
			if (!me.den) {
				return true;
			}

			break;
		case "corpsefire":
			if (me.den && me.hell && (!me.andariel || Check.brokeAf()) && !me.druid && !me.paladin) {
				return true;
			}

			break;
		case "bloodraven":
			if ((!me.bloodraven && me.normal || (!me.summoner && Check.brokeAf())) ||
				(me.normal && !me.tristram && me.barbarian) ||
				(me.hell && ((me.sorceress && SetUp.currentBuild !== "Lightning") || ((me.amazon || me.assassin) && Attack.checkInfinity()) || (me.barbarian || me.paladin || me.necromancer || me.druid)))) {
				return true;
			}

			break;
		case "treehead":
			if (me.hell && (me.paladin && (!Attack.isAuradin || !Check.haveItem("armor", "runeword", "Enigma") || !Pather.accessToAct(3)))) {
				return true;
			}

			break;
		case "smith":
			if (!Misc.checkQuest(3, 1) && !me.smith) {
				return true;
			}

			break;
		case "tristram":
			if ((me.normal && (!me.tristram || me.charlvl < (me.barbarian ? 6 : 12) || Check.brokeAf())) ||
				(!me.normal &&
					((!me.tristram && me.diffCompleted) ||
					(me.barbarian && !Pather.accessToAct(3) && !Check.haveItem("sword", "runeword", "Lawbringer")) ||
					(me.paladin && me.hell && !Pather.accessToAct(3) && (!Attack.isAuradin || !Check.haveItem("armor", "runeword", "Enigma")))))) {
				return true;
			}

			break;
		case "countess":
			// classic quest not completed normal/nightmare || don't have runes for difficulty || barb in hell and have lawbringer
			if ((me.classic && !me.hell && !me.countess) ||
				(me.expansion && (needRunes || Check.brokeAf() || (me.barbarian && me.hell && Check.haveItem("sword", "runeword", "Lawbringer"))))) {
				return true;
			}

			break;
		case "pits":
			if (me.hell &&
				((me.necromancer || me.barbarian || me.assassin) ||
					(me.paladin || me.druid && !Check.currentBuild().caster) ||
					(me.amazon && (SetUp.currentBuild === SetUp.finalBuild || me.charlvl >= 85)) ||
					(me.sorceress && me.charlvl >= 80))) {
				return true;
			}

			break;
		case "jail":
			if (me.hell && me.amazon && !me.mephisto) {
				return true;
			}

			break;
		case "boneash":
			if (me.hell && me.classic && !me.diablo) {
				return true;
			}

			break;
		case "andariel":
			if (!me.andariel ||
				(me.classic && me.hell) ||
				(me.expansion &&
					(!me.normal && (Pather.canTeleport() || me.charlvl <= 60)) ||
					(me.hell && me.charlvl !== 100 && (!me.amazon || (me.amazon && SetUp.currentBuild === SetUp.finalBuild))))) {
				return true;
			}

			break;
		case "a1chests":
			if (me.expansion &&
				(me.charlvl >= 70 && Pather.canTeleport() ||
					(me.barbarian && me.hell && !Pather.accessToAct(3) && (Item.getEquippedItem(5).tier < 1270 && !Check.haveItem("sword", "runeword", "Lawbringer"))))) {
				return true;
			}

			break;
		case "cube":
			if (Pather.accessToAct(2) && !me.cube) {
				return true;
			}

			break;
		case "radament":
			if (Pather.accessToAct(2) && (!me.radament || (me.amazon && SetUp.currentBuild !== SetUp.finalBuild && me.hell) || (me.hell && me.sorceress && me.classic && !me.diablo))) {
				return true;
			}

			break;
		case "staff":
			if (Pather.accessToAct(2) && !me.shaft && !me.staff && !me.horadricstaff) {
				return true;
			}

			break;
		case "amulet":
			if (Pather.accessToAct(2) && !me.amulet && !me.staff && !me.horadricstaff) {
				return true;
			}

			break;
		case "ancienttunnels":
			// No pally in hell due to magic immunes unless is melee build, No zon in hell unless at final build because light/poison immunes
			if (Pather.accessToAct(2) && me.hell && (!me.paladin || (me.paladin && !Check.currentBuild().caster)) && (!me.amazon || (me.amazon && SetUp.currentBuild === SetUp.finalBuild))) {
				return true;
			}

			break;
		case "summoner":
			if (Pather.accessToAct(2) && !me.summoner) {
				return true;
			}

			break;
		case "tombs":
			if (Pather.accessToAct(2) && me.normal && me.charlvl < 24) {
				return true;
			}

			break;
		case "duriel":
			if (Pather.accessToAct(2) && !me.duriel) {
				return true;
			}

			break;
		case "eye":
			if (Pather.accessToAct(3) && !me.eye && !me.khalimswill && !me.travincal) {
				return true;
			}

			break;
		case "templeruns":
			if (Pather.accessToAct(3) && ((!me.lamessen || (me.nightmare && me.charlvl < 50) || (me.hell && !me.classic)) && (!me.paladin || (me.paladin && !Check.currentBuild().caster)))) {
				return true;
			}

			break;
		case "lamessen":
			if (Pather.accessToAct(3) && !me.lamessen && ((me.paladin && !Check.currentBuild().caster) || me.classic)) {
				return true;
			}

			break;
		case "lowerkurast":
			if (Pather.accessToAct(3) && me.nightmare && me.charlvl >= 50 && me.barbarian && !Check.haveItem("sword", "runeword", "Voice of Reason")) {
				return true;
			}

			break;
		case "heart":
			if (Pather.accessToAct(3) && !me.heart && !me.khalimswill && !me.travincal) {
				return true;
			}

			break;
		case "brain":
			if (Pather.accessToAct(3) && !me.brain && !me.khalimswill && !me.travincal) {
				return true;
			}

			break;
		case "travincal":
			if (Pather.accessToAct(3) &&
					(!me.travincal ||
						(me.charlvl < 25 ||
						(me.charlvl >= 25 && me.normal && !me.baal && !Check.Gold()) ||
						(me.nightmare && !me.diablo && me.barbarian && !Check.haveItem("sword", "runeword", "Lawbringer")) ||
						(me.hell && me.paladin && me.charlvl > 85 && (!Attack.isAuradin || !Check.haveItem("armor", "runeword", "Enigma")))))) {
				return true;
			}

			break;
		case "mephisto":
			if (Pather.accessToAct(3)) {
				if (!me.mephisto) return true;
				switch (me.diff) {
				case sdk.difficulty.Normal:
					return !Check.Gold() || !me.diffCompleted;
				case sdk.difficulty.Nightmare:
					return Pather.canTeleport() || me.charlvl <= 65
				case sdk.difficulty.Hell:
					return true;
				}
			}

			break;
		case "izual":
			if (Pather.accessToAct(4) && !me.izual) {
				return true;
			}

			break;
		case "river":
			if (Pather.accessToAct(4) && !me.diablo && !me.normal && (me.barbarian && !Check.haveItem("sword", "runeword", "Lawbringer")) || (me.sorceress && me.classic)) {
				return true;
			}

			break;
		case "hephasto":
			if (Pather.accessToAct(4) && !me.normal && me.diablo && me.barbarian && me.charlvl <= 70 && !Check.haveItem("sword", "runeword", "Lawbringer")) {
				return true;
			}

			break;
		case "diablo":
			if (Pather.accessToAct(4) && ((me.normal && (me.charlvl < 35 || me.classic)) || (me.nightmare && (Pather.canTeleport() || me.charlvl <= 65)) || me.hell || !me.diablo)) {
				return true;
			}

			break;
		case "hellforge":
			if (Pather.accessToAct(4) && !me.hellforge) {
				return true;
			}

			break;
		case "shenk":
			if (me.expansion && Pather.accessToAct(5) && (!me.druid || me.charlvl <= 70)) {
				return true;
			}

			break;
		case "savebarby":
			// I need tal, ral, or ort rune for runewords
			if (me.expansion && Pather.accessToAct(5) && !me.savebarby && Runewords.checkRune(sdk.items.runes.Tal, sdk.items.runes.Ral, sdk.items.runes.Ort)) {
				return true;
			}

			break;
		case "anya":
			if (me.expansion && Pather.accessToAct(5)) {
				return true;
			}

			break;
		case "ancients":
			if (me.expansion && Pather.accessToAct(5) && !me.ancients) {
				return true;
			}

			break;
		case "baal":
			if (me.expansion && Pather.accessToAct(5)) {
				return true;
			}

			break;
		case "cows":
			if (!me.cows && me.diffCompleted) {
				if (me.barbarian && !["Whirlwind", "Immortalwhirl", "Singer"].includes(SetUp.currentBuild) && (!me.normal || !Check.brokeAf())) return false;
				switch (me.diff) {
				case sdk.difficulty.Normal:
					if (Check.brokeAf()) {
						return true;
					}
					break;
				case sdk.difficulty.Nightmare:
					if (me.druid && me.charlvl <= 65) { 
						return true; 
					} else if (me.sorceress && (me.expansion || me.charlvl < 62)) { 
						return true; 
					} else if (!me.druid && !me.sorceress) {
						return true;
					}
					
					break;
				case sdk.difficulty.Hell:
					return true;
				}
			}

			break;
		case "a5chests":
			if (!me.normal && me.baal) {
				return true;
			}

			break;
		case "getkeys":
			if (me.expansion && Pather.accessToAct(5) && me.hell && ["Zealer", "Smiter", "Uberconc"].includes(SetUp.currentBuild)) {
				return true;
			}

			break;
		case "orgtorch":
			if (me.expansion && Pather.accessToAct(5) && me.hell && ["Zealer", "Smiter", "Uberconc"].includes(SetUp.currentBuild)) {
				return true;
			}

			break;
		default:
			break;
		}

		return false;
	},

	Gold: function () {
		let gold = me.gold;
		let goldLimit = [25000, 50000, 100000][me.diff];

		if ((me.normal && !Pather.accessToAct(2)) || gold >= goldLimit) {
			return true;
		}

		me.overhead('low gold');

		return false;
	},

	brokeAf: function () {
		let gold = me.gold;
		let goldLimit = [10000, 25000, 50000][me.diff];

		if (gold >= goldLimit || me.charlvl < 15 || (me.charlvl >= 15 && gold > 1000 && Item.getEquippedItem(4).durability !== 0)) {
			return false;
		}

		me.overhead("I am broke af");
		NTIP.addLine("[name] == gold # [gold] >= 1");

		return true;
	},

	broken: function () {
		let gold = me.gold;

		// Almost broken but not quite
		if (((Item.getEquippedItem(4).durability <= 30 && Item.getEquippedItem(4).durability > 0) || Item.getEquippedItem(5).durability <= 30 && Item.getEquippedItem(5).durability > 0) &&
			!me.getMerc() && me.charlvl >= 15 && !me.normal && !me.nightmare && gold < 1000) {
			return 1;
		}

		// Broken
		if ((Item.getEquippedItem(4).durability === 0 || Item.getEquippedItem(5).durability === 0) && me.charlvl >= 15 && !me.normal && gold < 1000) {
			return 2;
		}

		return 0;
	},

	Resistance: function () {
		let resStatus,
			resPenalty = me.getResPenalty(me.diff + 1),
			frRes = me.getStat(sdk.stats.FireResist) - resPenalty,
			lrRes = me.getStat(sdk.stats.LightResist) - resPenalty,
			crRes = me.getStat(sdk.stats.ColdResist) - resPenalty,
			prRes = me.getStat(sdk.stats.PoisonResist) - resPenalty;

		resStatus = !!((frRes >= 0) && (lrRes >= 0) && (crRes >= 0)); 

		return {
			Status: resStatus,
			FR: frRes,
			CR: crRes,
			LR: lrRes,
			PR: prRes,
		};
	},

	mercResistance: function () {
		let merc = Merc.getMercFix();

		// Dont have merc or he is dead
		if (!merc) {
			return {
				FR: 0, CR: 0, LR: 0, PR: 0,
			};
		}

		return {
			FR: merc.fireRes,
			CR: merc.coldRes,
			LR: merc.lightRes,
			PR: merc.poisonRes,
		};
	},

	nextDifficulty: function (announce = true) {
		let diffShift = me.diff;
		let res = this.Resistance();
		let lvlReq = !!((me.charlvl >= Config.levelCap) && !["Bumper", "Socketmule"].includes(SetUp.finalBuild) && !this.broken());

		if (me.diffCompleted) {
			if (lvlReq) {
				if (res.Status) {
					diffShift = me.diff + 1;
					announce && D2Bot.printToConsole('Kolbot-SoloPlay: next difficulty requirements met. Starting: ' + sdk.difficulty.nameOf(diffShift), sdk.colors.D2Bot.Blue);
				} else {
					if (me.charlvl >= Config.levelCap + (!me.normal ? 5 : 2)) {
						diffShift = me.diff + 1;
						announce && D2Bot.printToConsole('Kolbot-SoloPlay: Over leveled. Starting: ' + sdk.difficulty.nameOf(diffShift));
					} else {
						announce && myPrint(sdk.difficulty.nameOf(diffShift + 1) + ' requirements not met. Negative resistance. FR: ' + res.FR + ' | CR: ' + res.CR + ' | LR: ' + res.LR);
						return false;
					}
				}
			}
		} else {
			return false;
		}

		return sdk.difficulty.nameOf(diffShift);
	},

	Runes: function () {
		if (me.classic) return false;
		let needRunes = true;

		switch (me.diff) {
		case sdk.difficulty.Normal:
			// Have runes or stealth and ancients pledge
			if ((me.getItem(sdk.items.runes.Tal) && me.getItem(sdk.items.runes.Eth)) || this.haveItem("armor", "runeword", "Stealth")) {
				needRunes = false;
			}

			break;
		case sdk.difficulty.Nightmare:
			if ((me.getItem(sdk.items.runes.Tal) && me.getItem(sdk.items.runes.Thul) && me.getItem(sdk.items.runes.Ort) && me.getItem(sdk.items.runes.Amn) && Check.currentBuild().caster) ||
				(!me.paladin && this.haveItem("sword", "runeword", "Spirit")) || (me.paladin && this.haveItem("sword", "runeword", "Spirit") && this.haveItem("auricshields", "runeword", "Spirit")) ||
				(me.necromancer && this.haveItem("wand", "runeword", "White") && (this.haveItem("voodooheads", "runeword", "Rhyme") || Item.getEquippedItem(5).tier > 800)) ||
				(me.barbarian && (Check.haveItem("sword", "runeword", "Lawbringer") || me.baal))) {
				needRunes = false;
			}

			break;
		case sdk.difficulty.Hell:
			if (!me.baal || (me.sorceress && !["Blova", "Lightning"].includes(SetUp.currentBuild))) {
				needRunes = false;
			}

			break;
		}

		return needRunes;
	},

	haveItem: function (type, flag, iName = undefined) {
		type !== undefined && (type = type.toLowerCase());
		flag !== undefined && (flag = flag.toLowerCase());
		iName !== undefined && (iName = iName.toLowerCase());

		if (type && type !== "dontcare" && !NTIPAliasType[type] && !NTIPAliasClassID[type]) {
			print("ÿc9Kolbot-SoloPlayÿc0: No NTIPalias for '" + type + "'");
			return false;
		}

		let typeCHECK = false;
		let itemCHECK = false;
		let items = me.getItems().filter(item => !Town.ignoredItemTypes.includes(item.itemType) && !item.isQuestItem);

		for (let i = 0; i < items.length && !itemCHECK; i++) {
			switch (flag) {
			case 'set':
				itemCHECK = !!(items[i].quality === sdk.itemquality.Set) && (iName ? items[i].fname.toLowerCase().includes(iName) : true);
				break;
			case 'unique':
				itemCHECK = !!(items[i].quality === sdk.itemquality.Unique) && (iName ? items[i].fname.toLowerCase().includes(iName) : true);
				break;
			case 'crafted':
				itemCHECK = !!(items[i].quality === sdk.itemquality.Crafted);
				break;
			case 'runeword':
				itemCHECK = !!(items[i].isRuneword) && (iName ? items[i].fname.toLowerCase().includes(iName) : true);
				break;
			}

			// don't waste time if first condition wasn't met
			if (itemCHECK) {
				switch (type) {
				case "dontcare":
					typeCHECK = itemCHECK;
					break;
				case "helm":
				case "primalhelm":
				case "pelt":
				case "armor":
				case "shield":
				case "auricshields":
				case "voodooheads":
				case "gloves":
				case "belt":
				case "boots":
				case "ring":
				case "amulet":
				case "axe":
				case "bow":
				case "amazonbow":
				case "crossbow":
				case "dagger":
				case "javelin":
				case "amazonjavelin":
				case "mace":
				case "polearm":
				case "scepter":
				case "spear":
				case "amazonspear":
				case "staff":
				case "sword":
				case "wand":
				case "assassinclaw":
				case "smallcharm":
				case "mediumcharm":
				case "largecharm":
					typeCHECK = items[i].itemType === NTIPAliasType[type];
					break;
				default:
					typeCHECK = items[i].classid === NTIPAliasClassID[type];
					break;
				}
			}

			if (type) {
				itemCHECK = itemCHECK && typeCHECK;
			}
		}

		return itemCHECK;
	},

	haveItemAndNotSocketed: function (type, flag, iName) {
		type !== undefined && (type = type.toLowerCase());
		flag !== undefined && (flag = flag.toLowerCase());
		iName !== undefined && (iName = iName.toLowerCase());

		if (type && !NTIPAliasType[type] && !NTIPAliasClassID[type]) {
			print("ÿc8Kolbot-SoloPlayÿc0: No NTIPalias for '" + type + "'");
			return false;
		}

		let typeCHECK = false;
		let itemCHECK = false;
		let items = me.getItems()
			.filter(item => !Town.ignoredItemTypes.includes(item.itemType) && getBaseStat("items", item.classid, "gemsockets") > 0 && !item.isQuestItem && !item.getItem());

		for (let i = 0; i < items.length && !itemCHECK; i++) {
			switch (flag) {
			case 'set':
				itemCHECK = !!(items[i].quality === sdk.itemquality.Set) && (iName ? items[i].fname.toLowerCase().includes(iName) : true);
				break;
			case 'unique':
				itemCHECK = !!(items[i].quality === sdk.itemquality.Unique) && (iName ? items[i].fname.toLowerCase().includes(iName) : true);
				break;
			case 'crafted':
				itemCHECK = !!(items[i].quality === sdk.itemquality.Crafted);
				break;
			case 'runeword':
				itemCHECK = !!(items[i].isRuneword) && (iName ? items[i].fname.toLowerCase().includes(iName) : true);
				break;
			}

			// don't waste time if first condition wasn't met
			if (itemCHECK) {
				switch (type) {
				case "helm":
				case "primalhelm":
				case "pelt":
				case "armor":
				case "shield":
				case "auricshields":
				case "voodooheads":
				case "gloves":
				case "belt":
				case "boots":
				case "ring":
				case "amulet":
				case "axe":
				case "bow":
				case "amazonbow":
				case "crossbow":
				case "dagger":
				case "javelin":
				case "amazonjavelin":
				case "mace":
				case "polearm":
				case "scepter":
				case "spear":
				case "amazonspear":
				case "staff":
				case "sword":
				case "wand":
				case "assassinclaw":
				case "weapon":
					typeCHECK = items[i].itemType === NTIPAliasType[type];
					break;
				default:
					typeCHECK = items[i].classid === NTIPAliasClassID[type];
					break;
				}
			}

			if (type) {
				itemCHECK = itemCHECK && typeCHECK && !items[i].getItem();
			}
		}

		return itemCHECK;
	},

	haveBase: function (type = undefined, sockets = undefined) {
		if (!type|| !sockets) return false;
		typeof type === "string" && (type = type.toLowerCase());

		let baseCheck = false;
		let items = me.getItems()
			.filter(item => item.isBaseType && item.isInStorage);

		for (let i = 0; i < items.length; i++) {
			if (items[i].getStat(sdk.stats.NumSockets) === sockets) {
				switch (type) {
				case "helm":
				case "primalhelm":
				case "pelt":
				case "armor":
				case "shield":
				case "auricshields":
				case "voodooheads":
				case "gloves":
				case "belt":
				case "boots":
				case "ring":
				case "amulet":
				case "axe":
				case "bow":
				case "amazonbow":
				case "crossbow":
				case "dagger":
				case "javelin":
				case "amazonjavelin":
				case "mace":
				case "polearm":
				case "scepter":
				case "spear":
				case "amazonspear":
				case "staff":
				case "sword":
				case "wand":
				case "assassinclaw":
				case "weapon":
					baseCheck = items[i].itemType === NTIPAliasType[type];

					break;
				default:
					baseCheck = items[i].classid === NTIPAliasClassID[type];

					break;
				}

				if (baseCheck) {
					break;
				}

			}
		}

		return baseCheck;
	},

	currentBuild: function () {
		function getBuildTemplate () {
			let buildType = SetUp.currentBuild;
			let build = buildType + "Build" ;
			let template = "SoloPlay/BuildFiles/" + sdk.charclass.nameOf(me.classid) + "." + build + ".js";

			return template.toLowerCase();
		}

		let template = getBuildTemplate();

		if (!include(template)) {
			throw new Error("currentBuild(): Failed to include template: " + template);
		}

		if (SetUp.currentBuild === SetUp.finalBuild) {
			return {
				caster: finalBuild.caster,
				tabSkills: finalBuild.skillstab,
				wantedSkills: finalBuild.wantedskills,
				usefulSkills: finalBuild.usefulskills,
				precastSkills: finalBuild.precastSkills,
				mercDiff: finalBuild.mercDiff,
				mercAct: finalBuild.mercAct,
				mercAuraWanted: finalBuild.mercAuraWanted,
				finalGear: finalBuild.autoEquipTiers,
				respec: finalBuild.respec,
				active: finalBuild.active,
			};
		}

		return {
			caster: build.caster,
			tabSkills: build.skillstab,
			wantedSkills: build.wantedskills,
			usefulSkills: build.usefulskills,
			active: build.active,
		};
	},

	finalBuild: function () {
		function getBuildTemplate () {
			let foundError = false;
			if (SetUp.finalBuild.includes("Build") || SetUp.finalBuild.includes("build")) {
				SetUp.finalBuild = SetUp.finalBuild.substring(0, SetUp.finalBuild.length - 5);
				D2Bot.printToConsole("Kolbot-SoloPlay: Info tag contained build which is unecessary. It has been fixed. New InfoTag/finalBuild :: " + SetUp.finalBuild, 9);
				foundError = true;
			}

			if (SetUp.finalBuild.includes(".")) {
				SetUp.finalBuild = SetUp.finalBuild.substring(SetUp.finalBuild.indexOf(".") + 1);
				SetUp.finalBuild = SetUp.finalBuild[0].toUpperCase() + SetUp.finalBuild.substring(1).toLowerCase();
				D2Bot.printToConsole("Kolbot-SoloPlay: Info tag was incorrect, it contained '.' which is unecessary and means you likely entered something along the lines of Classname.finalBuild. I have attempted to remedy this. If it is still giving you an error please re-read the documentation. New InfoTag/finalBuild :: " + SetUp.finalBuild, 9);
				foundError = true;
			}

			if (SetUp.finalBuild.includes(" ")) {
				// Trailing space
				if (SetUp.finalBuild.indexOf(" ") === (SetUp.finalBuild.length - 1)) {
					SetUp.finalBuild = SetUp.finalBuild.split(" ")[0];
					SetUp.finalBuild = SetUp.finalBuild[0].toUpperCase() + SetUp.finalBuild.substring(1).toLowerCase();
					D2Bot.printToConsole("Kolbot-SoloPlay: Info tag was incorrect, it contained a trailing space. I have attempted to remedy this. If it is still giving you an error please re-read the documentation. New InfoTag/finalBuild :: " + SetUp.finalBuild, 9);
					foundError = true;
				}
			}

			if (SetUp.finalBuild.includes("-")) {
				SetUp.finalBuild = SetUp.finalBuild.substring(SetUp.finalBuild.indexOf("-") + 1);
				SetUp.finalBuild = SetUp.finalBuild[0].toUpperCase() + SetUp.finalBuild.substring(1).toLowerCase();
				D2Bot.printToConsole("Kolbot-SoloPlay: Info tag was incorrect, it contained '-' which is unecessary and means you likely entered something along the lines of Classname-finalBuild. I have attempted to remedy this. If it is still giving you an error please re-read the documentation. New InfoTag/finalBuild :: " + SetUp.finalBuild, 9);
				foundError = true;
			}

			if (foundError) {
				D2Bot.setProfile(null, null, null, null, null, SetUp.finalBuild);
				SoloData.updateData("me", "finalBuild", SetUp.finalBuild);
				myData.me.finalBuild = SetUp.finalBuild;
			}

			let buildType = SetUp.finalBuild;
			let build;

			if (["Bumper", "Socketmule"].includes(SetUp.finalBuild)) {
				build = ["Javazon", "Cold", "Bone", "Hammerdin", "Whirlwind", "Wind", "Trapsin"][me.classid] + "Build";
			} else {
				build = buildType + "Build";
			}

			let template = "SoloPlay/BuildFiles/" + sdk.charclass.nameOf(me.classid) + "." + build + ".js";

			return template.toLowerCase();
		}

		let template = getBuildTemplate();

		if (!include(template)) {
			print("ÿc8Kolbot-SoloPlayÿc0: Failed to include finalBuild template. Please check that you have actually entered it in correctly. Here is what you currently have: " + SetUp.finalBuild);
			throw new Error("finalBuild(): Failed to include template: " + template);
		}

		return {
			caster: finalBuild.caster,
			tabSkills: finalBuild.skillstab,
			wantedSkills: finalBuild.wantedskills,
			usefulSkills: finalBuild.usefulskills,
			precastSkills: finalBuild.precastSkills,
			mercDiff: finalBuild.mercDiff,
			mercAct: finalBuild.mercAct,
			mercAuraWanted: finalBuild.mercAuraWanted,
			finalGear: finalBuild.autoEquipTiers,
			respec: finalBuild.respec,
			active: finalBuild.active,
		};
	},

	checkSpecialCase: function () {
		let goalReached = false, goal = "";

		switch (true) {
		case SetUp.finalBuild === "Bumper" && me.charlvl >= 40:
			goal = SetUp.finalBuild;
			goalReached = true;

			break;
		case SetUp.finalBuild === "Socketmule" && Misc.checkQuest(35, 1):
			goal = SetUp.finalBuild;
			goalReached = true;

			break;
		case SetUp.stopAtLevel && me.charlvl >= SetUp.stopAtLevel:
			goal = "Level: " + SetUp.stopAtLevel;
			goalReached = true;

			break;
		default:
			break;
		}

		if (goalReached) {
			let gameObj, printTotalTime = Developer.logPerformance;
			printTotalTime && (gameObj = Developer.readObj(Tracker.GTPath));

			if (Developer.fillAccount.bumpers || Developer.fillAccount.socketMules) {
				SetUp.makeNext();
			} else {
				D2Bot.printToConsole("Kolbot-SoloPlay " + goal + " goal reached." + (printTotalTime ? " (" + (Developer.formatTime(gameObj.Total + Developer.Timer(gameObj.LastSave))) + ")" : ""), 6);
				Developer.logPerformance && Tracker.Update();
				D2Bot.stop();
			}
		}
	},

	// TODO: enable this for other items, i.e maybe don't socket tal helm in hell but instead go back and use nightmare so then we can use hell socket on tal armor?
	usePreviousSocketQuest: function () {
		if (me.classic) return;
		if (!Check.Resistance().Status) {
			if (me.weaponswitch === 0 && Item.getEquippedItem(5).fname.includes("Lidless Wall") && !Item.getEquippedItem(5).socketed) {
				if (!me.normal) {
					if (!myData.normal.socketUsed) goToDifficulty(sdk.difficulty.Normal, " to use socket quest");
					if (me.hell && !myData.nightmare.socketUsed) goToDifficulty(sdk.difficulty.Nightmare, " to use socket quest");
				}
			}
		}
	},
};

// TODO: set this up similar to cubing where certain items get added to the validGids list to be kept and we look for items from the needList
// Idea: would be nice that if we were currently pathing and had low stam that this updates to include picking up a stam pot then once we have it remove it so we don't pick up more
let SoloPlay = {
	needList: [],
	validGids: [],

	
};
