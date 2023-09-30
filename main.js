var playerID;
var playerCanvas;
var currentScreen;
var socketConnection;
var isTouching = false;

const init = function() {
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

	id("suitcase-lock-1").addEventListener("scroll", (evt) => { if (!isTouching) checkSuitcaseCode(); })
	id("suitcase-lock-2").addEventListener("scroll", (evt) => { if (!isTouching) checkSuitcaseCode(); })
	id("suitcase-lock-3").addEventListener("scroll", (evt) => { if (!isTouching) checkSuitcaseCode(); })

	openSocketConnection();
	if(window.location.search.indexOf("?p=") != -1) {
		let parts = window.location.search.split("?p=");
		if (parts.length > 1) {
			startGame(parseInt(parts[1]));
		}
	}
};

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


const touchClick = function(evt) {
	let screenID = evt.target.dataset.screenId;
	if (screenID) {
		switchScreen(screenID)
		return;
	}

	const id = evt.target.id;
	if (id == "invite-p2" && navigator.share) navigator.share({url:window.location.href + "?player=2"});
	else if (id == "start-p1") startGame(1);
	else if (id == "start-p2") startGame(2);
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

const startGame = function(playerID) {
	playerID = playerID;
	playerCanvas = id(`p${playerID}`);
	if (playerID == 1) switchScreen("suitcase");
	else if (playerID == 2) switchScreen("weather-symbols");
	show(playerCanvas);
	hide(id("start"));
	sendSocketAction("start-game", {playerID: playerID});
}

const switchScreen = function(id) {
	hideAll(".screen");
	currentScreen = elm(`#${id}`);
	show(currentScreen);
}

const checkSuitcaseCode = function() {
	if (currentScreen.id != "suitcase-lock") return;
	const l1 = Math.floor(id("suitcase-lock-1").scrollTop/id("suitcase-lock-1").offsetHeight);
	const l2 = Math.floor(id("suitcase-lock-2").scrollTop/id("suitcase-lock-2").offsetHeight);
	const l3 = Math.floor(id("suitcase-lock-3").scrollTop/id("suitcase-lock-3").offsetHeight);
	id("debug").innerText = `${l1} ${l2} ${l3}`;
	if (l1 == 2 && l2 == 6 && l3 == 4) {
		switchScreen("win");
	}
}

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

const socketResponse = function(evt) {
	const data = JSON.parse(evt.data);
	const action = data.action;
	const args = data.args;
	switch(action) {
		case "start-game":
			if (args.playerID == 2) startGame(1);
		break;
	}
}

init();