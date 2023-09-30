var playerID;
var playerCanvas;
var currentScreen;
var socketConnection;
var isTouching = false;
var audioPlayers = {
	tick:new Audio("audio/tick.mp3"),
	discovery:new Audio("audio/discovery.mp3"),
};
var audioLastPlayed = {}
var suitcaseLockScrollIndex = {}
var tickAudioPlayerIndex = 0;
var tickAudioPlayers = [];
var audioPlayersWarmed = false;
var snowmanButtonClicks = 0;

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
	document.addEventListener("scrollend", scrollEnd);
	document.addEventListener("scroll", scroll);
	document.addEventListener("click", touchClick);

	document.addEventListener("animationiteration", evt => {

	});

	document.addEventListener("animationend", evt => {

	});

	document.addEventListener("transitionend", evt => {
		
	});


	id("suitcase-lock-1").addEventListener("scroll", suitcaseCodeScroll);
	id("suitcase-lock-2").addEventListener("scroll", suitcaseCodeScroll);
	id("suitcase-lock-3").addEventListener("scroll", suitcaseCodeScroll);

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
	var url = "ws://46.246.44.156:6502";
	if (window.location.href.indexOf("localhost") != -1) {
		url = "ws://localhost:6502";
	}
	socketConnection = new WebSocket(url, "json");
	socketConnection.onmessage = socketResponse;
}

const sendSocketAction = function(actionID, args) {
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

	}
}

// Events

const touchClick = function(evt) {
	if (!audioPlayersWarmed) warmUpAudioPlayers();

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
		case "snowman-button": 
			snowmanButtonClicks++;
			if (snowmanButtonClicks > 5) {
				sendSocketAction("solve-snowman", {playerID: playerID});
				tryPlayAudio("discovery")
				switchScreen("snow-land");
			}
			break;
	}
}

const socketResponse = function(evt) {
	const data = JSON.parse(evt.data);
	const action = data.action;
	const args = data.args;
	switch(action) {
		case "start-game":
			if (args.playerID == 2) startGame(1);
		break;
		case "solve-suitcase":
			if (args.playerID != playerID) tryPlayAudio("discovery");
		break;
		case "solve-snowman":
			if (args.playerID != playerID) tryPlayAudio("discovery");
		break;
	}
}

const touchStart = function(evt) {
	isTouching = true;
	// console.log(evt, evt.target);
}

const touchEnd = function(evt) {
	isTouching = false;
	// console.log(evt, evt.target);
}

const touchCancel = function(evt) {
	isTouching = false;
	// console.log(evt, evt.target);
}

const touchMove = function(evt) {
	// console.log(evt, evt.target);
}

const scroll = function(evt) {
	console.log(evt, evt.target);
}

const scrollEnd = function(evt) {
	console.log(evt, evt.target);
}

// Game loop

const startGame = function(newPlayerID) {
	playerID = newPlayerID;
	playerCanvas = id(`p${playerID}`);
	if (playerID == 1) switchScreen("suitcase");
	else if (playerID == 2) switchScreen("weather-symbols");
	show(playerCanvas);
	hide(id("start"));
	sendSocketAction("start-game", {playerID: playerID});
}

// Screen specific

const suitcaseCodeScroll = function(evt) {
	if (!suitcaseLockScrollIndex[evt.target.id]) suitcaseLockScrollIndex[evt.target.id] = 0;
	const idx = Math.floor(evt.target.scrollTop/evt.target.offsetHeight);
	if (idx != suitcaseLockScrollIndex[evt.target.id]) {
		suitcaseLockScrollIndex[evt.target.id] = idx;
		tryPlayTickAudio();
	}
	if (!isTouching) checkSuitcaseCode();
}

const checkSuitcaseCode = function() {
	if (currentScreen.id != "suitcase-lock") return;
	const l1 = Math.floor(id("suitcase-lock-1").scrollTop/id("suitcase-lock-1").offsetHeight);
	const l2 = Math.floor(id("suitcase-lock-2").scrollTop/id("suitcase-lock-2").offsetHeight);
	const l3 = Math.floor(id("suitcase-lock-3").scrollTop/id("suitcase-lock-3").offsetHeight);
	id("debug").innerText = `${l1} ${l2} ${l3}`;
	if (l1 == 2 && l2 == 6 && l3 == 4) {
		switchScreen("suitcase-inside");
		tryPlayAudio("discovery")
		sendSocketAction("solve-suitcase", {playerID: playerID});
	}
}

init();