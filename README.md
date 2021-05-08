# Valley
[![Valley](Valley.png)](https://valley-journey.herokuapp.com/)  

## Table of contents
- [Description](#description)
    - [About](#about)
    - [Game](#game)
    - [Backend](#backend)
    - [Database](#database)
    - [APIs](#apis)
- [Run locally](#run-locally)
    - [Node modules](#node-modules)
    - [Start server](#start-local-server)

# Description

## About
The game is an *infinite runner* type, the mechanics of which is based on the once popular game *Flappy Bird*. There is no set goal, other than to earn as many points as you can by evading the obstacles.  
The standout feature of this project is the weather API implementation that dynamically changes the background of the game, making it an obstacle itself.

## Game
The rules of the game are simple: evade the obstacle and earn points doing so.  
The underlying rendering framework is the canvas-based `p5.js`. It is an easy-to-use library that provides hardware accelerated graphics, an update loop and input handling.

## Backend
For the backend server I use **Heroku** and the client-server connection is handled by `Express.js` framework.
To make the experience more user-friendly I implemented sessions (an `Express.js` module) to retain the user data between reloads and reconnections.
The other function of the server is to fetch weather using an **OpenWeather API**.
> Most APIs have a limited number of calls, so the way I account for that is a server-side weather buffer array. When a client requests weather data from a new geolocation, the server fetches and puts it into the buffer. On a subsequent request, any client with the same geolocation is going to instantly get the weather forecast without an unnecessary API call.

## Database
As for the database, I use **MongoDB**. It has its own Node module which makes it simple to use. I structured the database to be split in two collections: one for login info and another for all other user data like score and site theme

## APIs
Overall, I use 6 APIs, but they perform only three distinct tasks, with one backup solution per each, in the following order:
1. Determine the client’s IP address
2. Determine the geolocation, assigned to that IP address
3. Make a request to the weather service API to get a 7-day forecast.

APIs list:
- IP: [Cloudflare](https://www.cloudflare.com/cdn-cgi/trace/) (Backup: [ipify](https://api.ipify.org?format=json))
- Geolocation: [ip-api](http://ip-api.com/json/) (Backup: [Techniknews](https://api.techniknews.net/ipgeo/))
- Weather service: [OpenWeather](https://openweathermap.org/) (Backup: [7timer](http://www.7timer.info/))

# Run locally

## Node modules
After downloading the repository run the node install command in the root directory.
```
npm install
```

## Start local server
### Method 1: nodemon
In the root directory run the following command:
```
npm run server
```
> This method will produce a delay (black screen for several seconds) on first page load due to the inner functionality of the `server.js`. It tries to connect to an **OpenWeather** API, however, without the key it switches to a much slower public API.

### Method 2: browser-sync
If you have `browser-sync` installed, use the following command:
```
cd client
npx browser-sync start -sw
```
> This method is prefered for quick local runs, however, it completely omits the server and default weather will be loaded from the `settings.js`
