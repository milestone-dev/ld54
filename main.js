var cheat = false;
var playerID;
var playerCanvas;
var currentScreen;
var socketConnection;
var isTouching = false;
var audioPlayers = {
	tick:new Audio("audio/tick.mp3"),
	discovery:new Audio("audio/discovery.mp3"),
	radio:new Audio("audio/radio.ogg"),
	musicbox:new Audio("audio/musicbox.mp3"),
};
var audioLastPlayed = {}
var codeScrollIndex = {}
var tickAudioPlayerIndex = 0;
var tickAudioPlayers = [];
var audioPlayersWarmed = false;
var socketURL = window.location.href.indexOf("localhost") == -1 ? "ws://46.246.44.156:6502" : "ws://localhost:6502";

// state
var musicBoxUnlocked = false;
var compartmentUnlocked = false;
var photoBookUnlocked = false;
var radioPowered = false;


const init = function() {
	for (let i = 0; i < 15; i++) {
		let a = new Audio();
		a.src = "audio/empty.mp3";
		a.actualSrc = "audio/tick.mp3";
		tickAudioPlayers[i] = a;
	}
	Object.values(audioPlayers).forEach((player) => {
		player.actualSrc = player.src;
		player.src = "audio/empty.mp3";
	});
	Object.keys(audioPlayers).forEach((key) => audioLastPlayed[key] = new Date().valueOf());

	document.addEventListener("touchstart", touchStart);
	document.addEventListener("touchend", touchEnd);
	document.addEventListener("mouseup", touchEnd);
	document.addEventListener("touchcancel", touchCancel);
	document.addEventListener("touchmove", touchMove);
	document.addEventListener("click", touchClick);
	document.addEventListener("keydown", keyDown);
	document.addEventListener("keyup", keyUp);
	document.addEventListener("animationiteration", evt => {});
	document.addEventListener("animationend", evt => {});
	document.addEventListener("transitionend", evt => {});

	elms(".suitcase-lock").forEach(elm => elm.addEventListener("scroll", suitcaseCodeScroll));
	elms(".music-box-lock").forEach(elm => elm.addEventListener("scroll", musicBoxCodeScroll));
	elms(".suitcase-compartment-lock").forEach(elm => elm.addEventListener("scroll", suitcaseCompartmentCodeScroll));
	elms(".photo-book-lock").forEach(elm => elm.addEventListener("scroll", photoBookCodeScroll));

	openSocketConnection();
	if(window.location.search.indexOf("?player=") != -1) {
		let parts = window.location.search.split("?player=");
		if (parts.length > 1) {
			startGame(parseInt(parts[1]));
		}
	}
};

// Network

const openSocketConnection = function() {	
	socketConnection = new WebSocket(socketURL, "json");
	socketConnection.onmessage = socketResponse;
}

const sendSocketAction = function(actionID, args) {
	console.log("SEND", actionID);
	if (!socketConnection) return;
	if (socketConnection.readyState == 0) {
		socketConnection.onopen = function(evt) {
			socketConnection.send(JSON.stringify({action:actionID, args:args}));
		}
	} else if (socketConnection.readyState == 1) {
		socketConnection.send(JSON.stringify({action:actionID, args:args}));
	}
}



// Utils 

const id = function(id) { return document.getElementById(id); }
const elm = function(selector) { return document.querySelector(selector); }
const elms = function(selector) { return document.querySelectorAll(selector); }
const show = function(elm) { elm.classList.add("active"); }
const hide = function(elm) { elm.classList.remove("active"); elm.classList.add("hidden") }; 
const hideAll = function(selector) {
	elms(selector).forEach(function(elm) {
		elm.classList.remove("active");
	});
}
const tryPlayTickAudio = function() {
	if (tickAudioPlayerIndex < tickAudioPlayers.length - 1) tickAudioPlayerIndex++;
	else tickAudioPlayerIndex = 0;
	tickAudioPlayers[tickAudioPlayerIndex].play();
}

const tryPlayAudio = function(key, timeout) {
	if (timeout == null) timeout = 500;
	if (new Date().valueOf() - audioLastPlayed[key] > timeout) {
		audioLastPlayed[key] = new Date().valueOf();
		audioPlayers[key].play();
	}
}

const stopAudio = function(key) {
	audioPlayers[key].currentTime = 0;
	audioPlayers[key].pause();
}

const warmUpAudioPlayers = function() {
	audioPlayersWarmed = true;
	tickAudioPlayers.forEach(player => {
		player.play();
		player.addEventListener("ended", evt => {
			evt.target.src = event.target.actualSrc;
		})
	});

	Object.values(audioPlayers).forEach(player => {
		// player.volume = 0;
		player.play();
		player.addEventListener("ended", evt => {
			evt.target.src = event.target.actualSrc;
		})
	});

}

const switchScreen = function(id) {
	hideAll(".screen");
	currentScreen = elm(`#${id}`);
	show(currentScreen);
	switch(currentScreen.id) {
		case "music-box-lock":
			if (musicBoxUnlocked) switchScreen("music-box-opened");
			break;
		case "photo-book-lock":
			if (photoBookUnlocked) switchScreen("photo-book-opened");
			break;
		case "radio-unpowered":
			if (radioPowered) switchScreen("radio-powered");
			break;
		case "radio-powered":
			tryPlayAudio("radio");
			break;
		case "music-box-opened":
			tryPlayAudio("musicbox");
			break;
	}
}

// Events

const touchClick = function(evt) {
	if (!audioPlayersWarmed) warmUpAudioPlayers();

	let audioID = evt.target.dataset.stopAudioId;
	if (audioID) {
		stopAudio(audioID);
	}
	
	let screenID = evt.target.dataset.screenId;
	if (screenID) {
		switchScreen(screenID)
		tryPlayAudio("tick", 200);
		return;
	}


	const id = evt.target.id;
	switch(id) {
		case "invite-p2":
			if (navigator.share) {
				navigator.share({
					url:window.location.href + "?player=2",
					title:document.title + " - Join the game!",
				});
			}
			break;
		case "start-p1": 
			startGame(1);
			break;
		case "start-p2": 
			startGame(2);
			break;
		case "battery-button":
			if (evt.target.classList.contains("passing")) return;
			sendSocketAction("pass-battery", {playerID: playerID});
			evt.target.classList.add("passing");
			break;
	}
}

const socketResponse = function(evt) {
	const data = JSON.parse(evt.data);
	const action = data.action;
	const args = data.args;
	console.log("RECV",action);
	switch(action) {
		case "solve-suitcase":
			if (args.playerID != playerID) {
				tryPlayAudio("discovery");
				switchScreen("suitcase-right");
			}
		break;
		case "solve-suitcase-compartment":
			if (args.playerID != playerID) {
				tryPlayAudio("discovery");
				switchScreen("win-p2");
			}
		break;
		case "pass-battery":
			if (args.playerID != playerID) {
				if (currentScreen.id == "radio-unpowered") {
					sendSocketAction("battery-accepted", {playerID: playerID});
					radioPowered = true;
					switchScreen("radio-powered");
				} else {
					sendSocketAction("battery-denied", {playerID: playerID});
				}
			}
		break;
		case "battery-accepted":
			if (args.playerID != playerID) {
				tryPlayAudio("discovery");
				id("battery-button").remove();
			}
			break;
		case "battery-denied":
			if (args.playerID != playerID) {
				id("battery-button").classList.remove("passing");
			}
			break;
	}
}

const touchStart = function(evt) {
	isTouching = true;
}

const touchEnd = function(evt) {
	isTouching = false;
}

const touchCancel = function(evt) {
	isTouching = false;
}

const touchMove = function(evt) {
}

const scroll = function(evt) {
	
}

const keyDown = function(evt) {
	if (evt.key == "Shift") document.body.classList.add("debug")
}

const keyUp = function(evt) {
	document.body.classList.remove("debug")
}


// Game loop

const startGame = function(newPlayerID) {
	playerID = newPlayerID;
	playerCanvas = id(`p${playerID}`);
	if (playerID == 1) switchScreen("suitcase");
	else if (playerID == 2) switchScreen("qr-view");
	show(playerCanvas);
	hide(id("start"));
	sendSocketAction("start-game", {playerID: playerID});
}

// Screen specific

const manageCodeScroll = function(evt) {
	if (!codeScrollIndex[evt.target.id]) codeScrollIndex[evt.target.id] = 0;
	const idx = Math.floor(evt.target.scrollTop/evt.target.offsetHeight);
	if (idx != codeScrollIndex[evt.target.id]) {
		codeScrollIndex[evt.target.id] = idx;
		tryPlayTickAudio();
	}	
}

const suitcaseCodeScroll = function(evt) {
	manageCodeScroll(evt);
	if (isTouching) return;
	if (currentScreen.id != "suitcase-lock") return;
	const l1 = Math.floor(id("suitcase-lock-1").scrollTop/id("suitcase-lock-1").offsetHeight);
	const l2 = Math.floor(id("suitcase-lock-2").scrollTop/id("suitcase-lock-2").offsetHeight);
	const l3 = Math.floor(id("suitcase-lock-3").scrollTop/id("suitcase-lock-3").offsetHeight);
	id("debug").innerText = `suitcase-lock ${l1} ${l2} ${l3}`;
	if (cheat || l1 == 2 && l2 == 6 && l3 == 4) {
		switchScreen("suitcase-left");
		tryPlayAudio("discovery")
		sendSocketAction("solve-suitcase", {playerID: playerID});
	}
}

const musicBoxCodeScroll = function(evt) {
	manageCodeScroll(evt);
	if (isTouching) return;
	if (currentScreen.id != "music-box-lock") return;
	const l1 = Math.floor(id("music-box-lock-1").scrollTop/id("music-box-lock-1").offsetHeight);
	const l2 = Math.floor(id("music-box-lock-2").scrollTop/id("music-box-lock-2").offsetHeight);
	const l3 = Math.floor(id("music-box-lock-3").scrollTop/id("music-box-lock-3").offsetHeight);
	id("debug").innerText = `music-box-lock ${l1} ${l2} ${l3}`;
	if (cheat || l1 == 2 && l2 == 6 && l3 == 4) {
		musicBoxUnlocked = true;
		switchScreen("music-box-opened");
		tryPlayAudio("discovery");
	}
}

const photoBookCodeScroll = function(evt) {
	manageCodeScroll(evt);
	if (isTouching) return;
	if (currentScreen.id != "photo-book-lock") return;
	const l1 = Math.floor(id("photo-book-lock-1").scrollTop/id("photo-book-lock-1").offsetHeight);
	const l2 = Math.floor(id("photo-book-lock-2").scrollTop/id("photo-book-lock-2").offsetHeight);
	const l3 = Math.floor(id("photo-book-lock-3").scrollTop/id("photo-book-lock-3").offsetHeight);
	id("debug").innerText = `photo-book-lock ${l1} ${l2} ${l3}`;
	if (cheat || l1 == 2 && l2 == 6 && l3 == 4) {
		photoBookUnlocked = true;
		switchScreen("photo-book-opened");
		tryPlayAudio("discovery");
	}
}

const suitcaseCompartmentCodeScroll = function(evt) {
	manageCodeScroll(evt);
	if (isTouching) return;
	if (currentScreen.id != "suitcase-compartment-lock") return;
	const l1 = Math.floor(id("suitcase-compartment-lock-1").scrollTop/id("suitcase-compartment-lock-1").offsetHeight);
	const l2 = Math.floor(id("suitcase-compartment-lock-2").scrollTop/id("suitcase-compartment-lock-2").offsetHeight);
	const l3 = Math.floor(id("suitcase-compartment-lock-3").scrollTop/id("suitcase-compartment-lock-3").offsetHeight);
	id("debug").innerText = `suitcase-compartment-lock ${l1} ${l2} ${l3}`;
	if (cheat || l1 == 2 && l2 == 6 && l3 == 4) {
		compartmentUnlocked = true;
		switchScreen("win-p1");
		tryPlayAudio("discovery")
		sendSocketAction("solve-suitcase-compartment", {playerID: playerID});
	}
}
init();