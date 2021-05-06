const express = require("express");
const session = require("express-session");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 86400000}, // One day
    secret: "qweasdzxczxcasdqwe"
}));
app.use(express.static('client'));
// Favicon
// crypto

const WEATHER_BUFFER_SIZE = 10;
const WEATHER_EXPIRATION_TIME = 86400000;
let WEATHER_BUFFER = [];

const API_TO_PREC = [0, 0.25, 1, 4, 10, 16, 30, 50, 75, 100];
app.post('/weather', async (req, res) => {
    let coords = {
        lat: Math.round(req.body.coords.lat),
        lon: Math.round(req.body.coords.lon)
    };

    for (let i = 0; i < WEATHER_BUFFER.length; i++) {
        let data = WEATHER_BUFFER[i];

        // If data is too old - remove
        if (Date.now() - data.recorded > WEATHER_EXPIRATION_TIME) {
            WEATHER_BUFFER.splice(i, 1);
            i--;
            continue;
        }

        // If data exists - send it
        if (data.lat === coords.lat && data.lon === coords.lon) {
            res.status(200).send(data.weather);
            return;
        }
    };

    // Make new entry
    let weather = [];

    let failed = false;
    await axios.get(`https://api.openweathermap.org/data/2.5/onecall?lat=${coords.lat}&lon=${coords.lon}&exclude=current,minutely,hourly,alerts&appid=${process.env.OW_KEY}`).then((response) => {
        let unfilteredWeather = response.data;
        unfilteredWeather.daily.forEach(datapoint => {
            let data = {
                clouds: datapoint.clouds,
                prec_type: (datapoint.rain) ? "rain" : "none",
                prec_amount: (datapoint.rain) ? datapoint.rain : 0,
            };
            weather.push(data);
        });
    }).catch(error => {
        failed = true;
        console.error("OpenWeather request failed. Switching to backup");
    });

    if (failed) {
        weather = [];
        await axios.get(`http://www.7timer.info/bin/api.pl?lon=${coords.lon}&lat=${coords.lat}&product=civil&unit=metric&output=json`).then((response) => {
            let unfilteredWeather = response.data;
            let i = 0;
            unfilteredWeather.dataseries.forEach(datapoint => {
                if (i > 55) return;
                let data = {
                    clouds: datapoint.cloudcover,
                    prec_type: datapoint.prec_type,
                    prec_amount: API_TO_PREC[datapoint.prec_amount],
                };
                i++;
                weather.push(data);
            });
        }).catch(error => {
            console.error("Backup weather request failed");
            res.status(418).send("Backup weather request failed. Set default weather cycle");
        });
    }

    WEATHER_BUFFER.push({
        lat: coords.lat,
        lon: coords.lon,
        weather: weather,
        recorded: Date.now()
    });

    // Delete oldest
    if (WEATHER_BUFFER.length > WEATHER_BUFFER_SIZE) {
        let oldestIndex = 0;
        let oldestRecord = WEATHER_BUFFER[0].recorded;
        for (let i = 1; i < WEATHER_BUFFER.length; i++) {
            if (WEATHER_BUFFER[i].recorded < oldestRecord) {
                oldestRecord = WEATHER_BUFFER[i].recorded;
                oldestIndex = i;
            }
        }
        WEATHER_BUFFER.splice(oldestIndex, 1);
    }

    console.log("Weather buffer usage: " + WEATHER_BUFFER.length + "/" + WEATHER_BUFFER_SIZE);
    res.status(201).send(weather);
});

// Send session data
app.get('/session/data', async (req, res) => {
    if (req.session.data) {
        res.status(200).send(req.session.data);
    } else {
        res.status(200).send(undefined);
    }
});

// MongoDB database variables
const MongoClient = require('mongodb').MongoClient;
const name = process.env.DB_NAME;
const pass = process.env.DB_PASS;
const connectionString = `mongodb+srv://${name}:${pass}@cluster0.kawhk.mongodb.net/Delta?retryWrites=true&w=majority`;

// Update best score
app.put('/session/score', async (req, res) => {
    if (!req.session.data) {
        res.status(401).send("Not logged in");
        return;
    }

    let score = Number(req.body.score);
    console.log(req.body);

    let client = MongoClient(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    await client.connect();
    let db = client.db("Delta");
    let data = db.collection("Data");

    await data.findOneAndUpdate({
        user: req.session.data.user
    }, {
        $max: {
            score: score
        }
    }, {
        upsert: true
    });

    req.session.data.score = score;

    res.status(200).send({
        msg: "Score updated",
        score: score
    });
    
    client.close();
});


const minLoginLength = 4;
const maxLoginLength = 12;
const minPassLength = 6;
const maxPassLength = 20;
//=== Singing in/up/out ===//
function checkInput(str, minLength, maxLength) {
    return (/^[0-9a-zA-Z]+$/.test(str))
        && (str.length >= minLength && str.length <= maxLength);
}
// Sign in
app.post('/signin', async (req, res) => {
    let login = req.body.login;
    let password = req.body.password;

    if (!checkInput(login, minLoginLength, maxLoginLength) 
        || !checkInput(password, minPassLength, maxPassLength)) {
            res.status(400).send("Login or password is incorrect");
            return;
    }

    let client = MongoClient(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    await client.connect();
    let db = client.db("Delta");
    let users = db.collection("Users");
    
    let correct = false;
    await users.find({login: login}).forEach(entry => {
        if (entry.password === password) correct = true;
    });
    if (!correct) {
        res.status(400).send("Login or password is incorrect");
        return;
    }

    req.session.data = {user: login};

    await db.collection("Data").find({user: login}).forEach(entry => {
        req.session.data.score = entry.score;
        req.session.data.theme_id = entry.theme_id;
    });

    res.status(200).send({
        msg: "Signed in!",
        data: req.session.data
    });

    client.close();
});

// Sing up
app.post('/signup', async (req, res) => {
    let login = req.body.login;
    let password = req.body.password;

    if (!checkInput(login, minLoginLength, maxLoginLength) 
        || !checkInput(password, minPassLength, maxPassLength)) {
            res.status(400).send("Login/Password incorrect");
            return;
    }

    let client = MongoClient(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    await client.connect();
    let db = client.db("Delta");
    let users = db.collection("Users");
    
    let exists = false;
    await users.find({login: login}).forEach(entry => {
        exists = true;
    });
    if (exists) {
        res.status(400).send("User already exists");
        return;
    }

    req.session.data = {
        user: login,
        score: 0,
        theme_id: 0
    };

    await users.insertOne({
        login: login,
        password: password
    });
    await db.collection("Data").insertOne(req.session.data);

    res.status(201).send({
        msg: "Account created",
        data: req.session.data
    });

    client.close();
});

// Sing out
app.get("/signout", async (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

let PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Access at port: " + PORT);
});
