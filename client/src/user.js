let showOptions = false;

function showUI(data) {
    let ui = $("<div>").attr('id', "ui");
    
    let user = $("<div>").attr('id', "username");
    user.append($('<img id="dropdown_arrow" src="resources/triangle_icon.svg" alt=">"></img>'));
    user.append($("<p>").text(data.user));
    user.on('click', () => {
        if (showOptions) shiftUp();
        else shiftDown();
    });

    let options = $("<div>").attr('id', "options");
    options.append(newButton("Sing out", "signout", async () => {
        saveTheme(true);
        await axios.get('/signout');
        location.reload();
    }));
    let themeToggle = newToggle("Toggle theme", "theme_toggle", () => {
        toggleTheme();
        saveTheme();
    });
    options.append(themeToggle);

    ui.append(user, options);

    $(document.body).append(ui);
}

function shiftDown() {
    $("#ui").addClass("shift_down");
    $("#dropdown_arrow").addClass("down");
    showOptions = true;
}

function shiftUp() {
    $("#ui").removeClass("shift_down");
    $("#dropdown_arrow").removeClass("down");
    showOptions = false;
    saveTheme(true);
}
