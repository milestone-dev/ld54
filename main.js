var playerCanvas;
var currentScreen;

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
	console.log("ready");
	startGame();
};

const elm = function(selector) { return document.querySelector(selector); }
const elms = function(selector) { return document.querySelectorAll(selector); }
const show = function(elm) { elm.classList.add("active"); }
const hide = function(elm) { elm.classList.remove("active") }; 
const hideAll = function(selector) {
	elms(selector).forEach(function(elm) {
		elm.classList.remove("active");
	});
}


const touchClick = function(evt) {
	let screenID = evt.target.dataset.screenId;
	if (screenID) {
		console.log(screenID);
		switchScreen(screenID)
	}
}

const touchStart = function(evt) {
	// console.log(evt, evt.target);
}

const touchEnd = function(evt) {
	// console.log(evt, evt.target);
}

const touchCancel = function(evt) {
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

const startGame = function() {
	playerCanvas = elm("#p1");
	// playerCanvas = elm("#p2");
	show(playerCanvas);
	
	switchScreen("suitcase");
	// switchScreen("symbols");
}

const switchScreen = function(id) {
	hideAll(".screen");
	currentScreen = elm(`#${id}`);
	show(currentScreen);
}

init();