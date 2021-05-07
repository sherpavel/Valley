const minLoginLength = 4;
const maxLoginLength = 12;
const minPassLength = 6;
const maxPassLength = 20;

let statusQueue = [];
const LOGIN_INPUT_ERROR = `Login must be between ${minLoginLength} and ${maxLoginLength} characters long and contain ONLY alphanumeric characters`;
const PASSWORD_INPUT_ERROR = `Password must be between ${minPassLength} and ${maxPassLength} characters long and contain ONLY alphanumeric characters`;
const PASSWORD_MISMATCH = "Passwords do not match";

const NO_FORM = -1;
const SIGN_IN = 0;
const SIGN_UP = 1;
let form;
let formID = NO_FORM;

function hideForm() {
    if (form) form.remove();
    formID = NO_FORM;
}

function newForm(title) {
    let form = $("<form>").attr('id', "form");
    form.append($("<div>").attr('id', "title").addClass("section").text(title));
    let closeButton = newButton("", "close", () => {
        showMenu(MENU_LAST_MODE);
        hideForm();
    });
    closeButton.append($('<img src="resources/close_icon.svg" alt="X"></img>'));
    form.append(closeButton);
    form.append($("<div>").attr('id', "status"));

    if ($("#sign_form").length)
        $("#sign_form").append(form);
    else
        $(document.body).append($("<div>").attr('id', "sign_form").append(form));

    return form;
}
function add(element) {
    element.insertBefore($("#status"));
}

//=== Sign in ===//
function showSignInForm() {
    if (formID !== NO_FORM) return;
    formID = SIGN_IN;

    form = newForm("Sign in");

    let login = $("<div>")
        .attr('id', "loginField")
        .addClass("section");
    let loginLabel = newLabel("Login");
    let loginInput = newInput("login", "Login", "text");
    login.append(loginLabel, loginInput);
    add(login);

    let pass = $("<div>")
        .attr('id', "passField")
        .addClass("section");
    let passLabel = newLabel("Password");
    let passInput = newInput("password", "Password", "password");
    pass.append(passLabel, passInput);
    add(pass);

    let waiting = false;
    let submitButton = newButton("Sign in", "signin", async () => {
        if (waiting) return;
        if (statusQueue.length > 0) return;
        if (passInput.val().length == 0) return;

        waiting = true;
        await axios.post('/signin', {
            login: loginInput.val(),
            password: passInput.val()
        }).then((response) => {
            $("#status").text(response.data.msg);
            reloadPage(1000);
        }, (error) => {
            $("#status").text(error.response.data);
            $("#status").addClass("flash");
            setTimeout(() => {
                $("#status").removeClass("flash");
            }, 100);
        });
        waiting = false;
    });
    add(submitButton.addClass("section"));
}

//=== Sign up ===//
function showSignUpForm() {
    if (formID !== NO_FORM) return;
    formID = SIGN_UP;

    form = newForm("Sign up");

    let login = $("<div>")
        .attr('id', "loginField")
        .addClass("section");
    let loginLabel = newLabel("Login");
    let loginInput = newInput("login", "Login", "text", () => {
        if (checkInput(loginInput.val(), minLoginLength, maxLoginLength)) {
            loginInput.removeClass("error");
            removeFromStatusQueue(LOGIN_INPUT_ERROR);
        } else {
            loginInput.addClass("error");
            addToStatusQueue(LOGIN_INPUT_ERROR, true);
        }
        printStatus();
    });
    login.append(loginLabel, loginInput);
    add(login);

    let pass = $("<div>")
        .attr('id', "passField")
        .addClass("section");
    let passLabel = newLabel("Password");
    let passInput = newInput("password", "Password", "text", () => {
        if (checkInput(passInput.val(), minPassLength, maxPassLength)) {
            passInput.removeClass("error");
            removeFromStatusQueue(PASSWORD_INPUT_ERROR)
        } else {
            passInput.addClass("error");
            addToStatusQueue(PASSWORD_INPUT_ERROR);
        }
        if (passInput.val() === passConfirmInput.val()) {
            passConfirmInput.removeClass("error");
            removeFromStatusQueue(PASSWORD_MISMATCH);
        } else {
            passConfirmInput.addClass("error");
            addToStatusQueue(PASSWORD_MISMATCH);
        }
        printStatus();
    });
    let passConfirmInput = newInput("", "Confirm password", "text", () => {
        if (passInput.val() === passConfirmInput.val()) {
            passConfirmInput.removeClass("error");
            removeFromStatusQueue(PASSWORD_MISMATCH);
        } else {
            passConfirmInput.addClass("error");
            addToStatusQueue(PASSWORD_MISMATCH);
        }
        printStatus();
    });
    pass.append(passLabel, passInput, passConfirmInput);
    add(pass);

    let waiting = false;
    let submitButton = newButton("Sign up", "signup", async () => {
        if (waiting) return;
        if (statusQueue.length > 0) return;
        if (passInput.val().length == 0) return;

        waiting = true;
        await axios.post('/signup', {
            login: loginInput.val(),
            password: passInput.val()
        }).then((response) => {
            addToStatusQueue(response.data.msg, true);
            printStatus();
            reloadPage(1000);
        }, (error) => {
            addToStatusQueue(error.response.data, true);
            printStatus();
            $("#status").addClass("flash");
            setTimeout(() => {
                $("#status").removeClass("flash");
            }, 100);
        });
        waiting = false;
    });
    add(submitButton.addClass("section"));
}

function addToStatusQueue(text, priority=false) {
    if (!statusQueue.includes(text)) {
        if (priority) statusQueue.unshift(text);
        else statusQueue.push(text);
    }
}
function removeFromStatusQueue(text) {
    let textIndex = statusQueue.indexOf(text);
    if (textIndex !== -1) {
        statusQueue.splice(textIndex, 1);
    }
}
function printStatus() {
    if (statusQueue.length > 0) {
        $("#status").text(statusQueue[0]);
    } else $("#status").text("");
}

function checkInput(str, minLength, maxLength) {
    return (/^[0-9a-zA-Z]+$/.test(str))
        && (str.length >= minLength && str.length <= maxLength);
}

function reloadPage(timeout=0) {
    if (timeout === 0) location.reload();
    else setTimeout(() => {
        location.reload();
    }, timeout);
}
