'use strict'
const app = require('koa')()
const cors = require('koa-cors');
const logger = require('koa-logger')
const router = require('koa-router')()
const config = Object.freeze(require("./config/config"))
const NodeGeocoder = require('node-geocoder');
let googleMapsClient = require('@google/maps').createClient({
    key: config.APIKEY
});


var options = {
    provider: 'google',
    httpAdapter: 'https',
    apiKey: config.APIKEY 
};

const geocoder = NodeGeocoder(options);

async function getLatLongByLocation(loc) {
    let locDetails = await geocoder.geocode(loc)
    const {latitude, longitude} = locDetails[0]
    return Promise.resolve({latitude, longitude})
}

router.post('/route', function* () {
    yield Promise.all([getLatLongByLocation(this.request.header.start), 
        getLatLongByLocation(this.request.header.drop)])
    .then((latLongs) => {
        this.body = {
            "token": "9d3503e0-7236-4e47-a62f-8b01b5646c16",
            "latLongs": latLongs,
            "status": "Success"
        }
    })
})

router.get('/route/:token', function* (next) {
    const origins = JSON.parse(this.request.header.start)
    const destinations = JSON.parse(this.request.header.drop)
    console.log("origins : ", origins)
    console.log("destinations ", destinations)
    console.log("methods", Object.getOwnPropertyNames(googleMapsClient))

    yield new Promise((resolve) => {
        googleMapsClient.distanceMatrix({origins, destinations}, (err, response) => {
            this.body = {
                status: 'success',
                results: {...response.json, originLatLong: origins, destLatLong: destinations}
            }
            resolve()
        })
    })
})
 
var options = {
    "Access-Control-Allow-Origin": '*',
    "Access-Control-Allow-Methods": 'GET,HEAD,PUT,POST,DELETE,PATCH',
};

app.use(cors(options));

app
.use(logger())
//.use(cors())
.use(router.routes())
.use(router.allowedMethods())

app.listen(8080)
console.log('Mock server started at port 8080')