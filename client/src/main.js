let WEATHER_CYCLE = [];
let START_TIME = new Date().getHours();
let END_TIME = START_TIME + 7*24;
let CURRENT_TIME = START_TIME;

async function startup() {
    let ip = await getIP();
    let coords = await getCoords(ip);
    WEATHER_CYCLE = await getWeather(coords);
    // WEATHER_CYCLE = DEFAULT_WEATHER_CYCLE;
    start();
}
window.onload = startup;

async function getIP() {
    let ip;
    await axios.get('https://www.cloudflare.com/cdn-cgi/trace').then((response) => {
        let data = response.data.trim().split('\n').reduce(function(obj, pair) {
            pair = pair.split('=');
            return obj[pair[0]] = pair[1], obj;
        }, {});
        ip = data.ip;
    }).catch(error => {
        console.error("First IP request failed. Switching to backup");
    });
    if (ip) return ip;

    // Backup request
    await axios.get('https://api.ipify.org?format=json').then((response) => {
        ip = response.data.ip;
    }).catch(error => {
        console.error("Backup IP request failed. Setting default IP");
    });
    return ip;
}

async function getCoords(ip) {
    let coords;
    await axios.get(`http://ip-api.com/json/${ip}`).then((response) => {
        coords = {
            lat: response.data.lat,
            lon: response.data.lon
        }
    }).catch(error => {
        console.error("First coords request failed. Switching to backup");
    });
    if (coords) return coords;

    // Backup request
    await axios.get(`https://api.techniknews.net/ipgeo/${ip}`).then((response) => {
        coords = {
            lat: response.data.lat,
            lon: response.data.lon
        }
    }).catch(error => {
        console.error("Backup coords request failed. Setting default coords");
    });
    return coords || {lat: 36, lon: -79};
}

async function getWeather(coords) {
    let weather;
    await axios.post('/weather', {coords: coords}).then((response) => {
        weather = response.data;
    }).catch(error => {
        console.error(error.response.data);
        weather = DEFAULT_WEATHER_CYCLE;
    });
    return weather;
}

let USER_DATA;
const THEME_ID = {
    DARK: 0,
    LIGHT: 1
};
let PREV_THEME;
//=== Start ===//
async function start() {
    startCanvas();
    document.body.classList.remove("fade");
    let root = $(document.body);

    showMenu(MENU_MODE.START);

    // Read session data, if possible
    await axios.get('/session/data').then((response) => {
        USER_DATA = response.data;
    }, (error) => console.error(error));

    setScore(0);
    setBestScore(0);
    if (USER_DATA) {
        PREV_THEME = USER_DATA.theme_id;
        if (USER_DATA.theme_id === THEME_ID.LIGHT) toggleTheme(false);
        setBestScore(USER_DATA.score);
        showUI(USER_DATA);
    } else {
        // Sign in
        let signinButton = newButton("Sign in", "signin_button", () => {
            // pauseGame();
            hideMenu();
            hideInfo();
            if (formID === SIGN_IN) return;
            hideForm();
            showSignInForm();
        });
        // Sign up
        let signupButton = newButton("Sign up", "signup_button", () => {
            // pauseGame();
            hideMenu();
            hideInfo();
            if (formID === SIGN_UP) return;
            hideForm();
            showSignUpForm();
        });
        root.append($("<div>").attr('id', "sign_buttons").append(signinButton, signupButton));
    }
}

function toggleTheme(reassign=true) {
    let backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--background-color');
    let fontColor = getComputedStyle(document.documentElement).getPropertyValue('--font-color');
    document.documentElement.style.setProperty('--background-color', fontColor);
    document.documentElement.style.setProperty('--font-color', backgroundColor);
    $("#menu").toggleClass("light");
    if (!reassign) return;
    if (USER_DATA.theme_id === THEME_ID.LIGHT) USER_DATA.theme_id = THEME_ID.DARK;
    else USER_DATA.theme_id = THEME_ID.LIGHT;
}
async function saveTheme(saveToDB=false) {
    if (saveToDB && USER_DATA.theme_id === PREV_THEME) return;
    if (saveToDB) PREV_THEME = USER_DATA.theme_id;
    await axios.put('/session/theme', {
        theme_id: USER_DATA.theme_id,
        saveToDB: saveToDB
    });
}

//=== Menu ===//
const MENU_MODE = {
    START: 0,
    PAUSE: 1
};
let MENU_LAST_MODE;
function handleInput(e) {
    if (e.code === "Space") {
        document.removeEventListener("keydown", handleInput);
        hideMenu();
        startGame();
    }
}
function showMenu(mode) {
    if ($("#menu").length) return;

    MENU_LAST_MODE = mode;

    let menu = $("<div>").attr('id', "menu");
    if (USER_DATA) if (USER_DATA.theme_id === THEME_ID.LIGHT) menu.addClass("light");

    menu.append($("<div>")
        .attr('id', "title")
        .addClass("section")
        .text("Valley"));

    if (mode === MENU_MODE.START) {
        menu.append(newButton("Start", "start", () => {
            shiftUp();
            hideMenu();
            startGame();
        }).addClass("section"));
        document.addEventListener("keydown", handleInput);
    } else if (mode === MENU_MODE.PAUSE) {
        menu.append(newButton("Resume", "resume", () => {
            hideMenu();
            resumeGame();
        }).addClass("section"));
    }

    menu.append(newButton("How to play", "howto", () => {
        hideMenu();
        showInfo(HOWTO_TEXT);
    }).addClass("section"));

    $("#game").append(menu);
}
function hideMenu() {
    document.removeEventListener("keydown", handleInput);
    $("#menu").remove();
}

//=== UI ===//
const HOWTO_TEXT = 'Press “Start” or spacebar to start the game. Press and hold left mouse button or spacebar to move up and evade the obstacles. Have fun!';
function showInfo(text) {
    let infoPanel = $("<div>").attr('id', "info");
    if (USER_DATA) if (USER_DATA.theme_id === THEME_ID.LIGHT) infoPanel.addClass("light");
    infoPanel.text(text);
    let closeButton = newButton("", "close", () => {
        showMenu(MENU_LAST_MODE);
        hideInfo();
    });
    closeButton.append($('<img src="resources/close_icon.svg" alt="X"></img>'));
    infoPanel.append(closeButton);
    $(document.body).append(infoPanel);
}
function hideInfo() {
    $("#info").remove();
}

//=== Score access ===//
let BEST_SCORE = 0;
function setScore(score) {
    $("#current_score").text(score);
}
function setBestScore(score) {
    if (score < BEST_SCORE) return;
    BEST_SCORE = score;
    $("#best_score").text(score);
}
function saveBestScore() {
    if (!USER_DATA) return;
    axios.put('/session/score', {score: BEST_SCORE}).then((response) => {
        // TODO Show tha score was saved
    }).catch((error) => console.error(error));
}

//=== Elements ===//
function newButton(text, id, onClick) {
    return $("<div>")
        .attr('id', id)
        .addClass("button")
        .text(text)
        .on('click', onClick);
}

function newToggle(text, id, onClick) {
    return $("<div>")
        .attr('id', id)
        .addClass("toggle")
        .text(text)
        .on('click', onClick);
}

function newLabel(text, id=undefined) {
    if (id) return $("<label>").attr('id', id).text(text);
    else return $("<label>").text(text);
}

function newInput(name, placeholder, type, inputListener=null) {
    return $('<input autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">')
        .attr('name', name)
        .attr('placeholder', placeholder)
        .attr('type', type)
        .on('input', inputListener);
}
