function showUI(data) {
    let ui = $("<div>").attr('id', "ui");
    
    let user = $("<div>").attr('id', "username");
    user.append($('<img id="dropdown_arrow" src="resources/triangle_icon.svg" alt=">"></img>'));
    user.append($("<p>").text(data.user));
    let showOptions = false;
    user.on('click', () => {
        showOptions = !showOptions;
        if (showOptions) {
            $(document.body).addClass("shift_down");
            $("#dropdown_arrow").addClass("down");
        }
        else {
            $(document.body).removeClass("shift_down");
            $("#dropdown_arrow").removeClass("down");
        }
    });

    let options = $("<div>").attr('id', "options");
    // options.append($("<div>").text("Options"));
    // options.append(newButton("Info", "info", () => {
    //     console.log("Info");
    // }));
    // options.append(newButton("Settings", "settings", () => {
    //     console.log("Settings");
    // }));
    options.append(newButton("Sing out", "signout", async () => {
        console.log("out");
        await axios.get('/signout');
        location.reload();
    }));

    ui.append(user, options);

    $(document.body).append(ui);
}
