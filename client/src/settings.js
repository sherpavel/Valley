let CANVAS_RATIO = 4/3;

const VELOCITY = 9;
const OBSTACLE_VELOCITY = 10;

const COLLISION_RADIUS = 30;

const BACKGROUND_RENDER_STEP = 2;
const BACKGROUND_LAYERS = 6;
const BACKGROUND_GROUND_HEIHGT = 60;

const MAX_SHADOW_ANGLE = Math.PI / 7;
const OBSTACLE_TYPE = {
    CIRCLE: 0,
    PILLAR: 1,
}
const CIRCLE_MIN_R = 50;
const CIRCLE_MAX_R = 80;
const PILLAR_MIN_GAP = 200;
const PILLAR_MAX_GAP = 300;
const PILLAR_WIDTH = 100;

const ANIMATION = {
    INTRO: 0,
    LOST: 1
}

const GRADIENTS = {
    Argon: [
        [3, 0, 30],
        [115, 3, 192],
        [236, 56, 188],
        [253, 239, 249]
    ],
    Atlas: [
        [254, 172, 94],
        [199, 121, 208],
        [75, 192, 200]
    ],
    WitchingHour: [
        [195, 20, 50],
        [36, 11, 54]
    ],
}

let TAIL_GRADIENT = GRADIENTS.WitchingHour.slice().reverse();
// TAIL_GRADIENT.push([191, 233, 255]);
const EXPLODE_GRADIENT = GRADIENTS.WitchingHour;

const TIME_ID = {
    NIGHT: 0,
    SUNRISE: 1,
    DAY: 2,
    SUNSET: 3,
}
const TIME = {
    night: {
        id: TIME_ID.NIGHT,
        sky: [20, 20, 20],
        background: [
            [35, 68, 94],
            [15, 48, 74],
            [5, 10, 5]
        ],
        ground: [5, 25, 80],
    },
    sunrise: {
        id: TIME_ID.SUNRISE,
        sky: [255, 227, 164],
        background: [
            [138, 146, 166],
            [0, 102, 146],
            [26, 80, 58],
        ],
        ground: [58, 82, 142],
    },
    day: {
        id: TIME_ID.DAY,
        sky: [224, 234, 252],
        background: [
            [175, 188, 187],
            [18, 57, 79],
            [80, 110, 85]
        ],
        ground: [101, 141, 168],
    },
    sunset: {
        id: TIME_ID.SUNSET,
        sky: [100, 106, 94],
        background: [
            [34, 52, 68],
            [20, 27, 36],
            [11, 20, 5]
        ],
        ground: [36, 38, 82],
    }
}
const DAY_CYCLE = [
    TIME.night,
    TIME.night,
    TIME.night,
    TIME.sunrise,
    TIME.day,
    TIME.day,
    TIME.day,
    TIME.sunset,
    // Overflow fix
    TIME.night
]

const WEATHER_ID = {
    CLEAR: 0,
    CLOUDS: 1,
    RAIN: 2,
    RAIN_LIGHT: 3,
    RAIN_HEAVY: 4,
}
const WEATHER_TYPE = {
    clear: {
        id: WEATHER_ID.CLEAR
    },
    clouds: {
        id: WEATHER_ID.CLOUDS,
    },
    rain: {
        id: WEATHER_ID.RAIN,
        light: {
            mask: 100,
            clouds: [200, 200, 200],
            amount: 200,
            v: 15,
        },
        heavy: {
            mask: 150,
            clouds: [200, 200, 200],
            amount: 400,
            v: 20,
        },
    }
}

const DEFAULT_WEATHER_CYCLE = [
    {
        "clouds": 1,
        "prec_type": "none",
        "prec_amount": 0
    },
    {
        "clouds": 7,
        "prec_type": "rain",
        "prec_amount": 4
    },
    {
        "clouds": 5,
        "prec_type": "none",
        "prec_amount": 0
    },
    {
        "clouds": 7,
        "prec_type": "rain",
        "prec_amount": 16
    },
    {
        "clouds": 9,
        "prec_type": "rain",
        "prec_amount": 10
    },
    {
        "clouds": 9,
        "prec_type": "none",
        "prec_amount": 0
    },
    {
        "clouds": 7,
        "prec_type": "rain",
        "prec_amount": 4
    },
]
