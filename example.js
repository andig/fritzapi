/**
 * smartFritz - Fritz goes smartHome
 *
 * AVM SmartHome nodeJS Control - for AVM Fritz!Box and Dect200 Devices
 *
 * @author Andreas Goetz <cpuidle@gmx.de>
 */

var fritz = require('./smartfritz.js');

// NOTE: options only needs to be passed to each fritz function call if the Fritz!Box is not
//       reachable at http://fritz.box

var options = {
    // "url": URL
};

var username = username;
var password = password;


fritz.getSessionID(username, password, options).then(function(sid) {
    console.log("SID: " + sid);

    // display switch information
    fritz.getSwitchList(sid, options).then(function(switches) {
        console.log("Switches: " + switches);

        if (switches.length) {
            fritz.getSwitchName(sid, switches[0], options).then(function(name) {
                console.log("Switch name [" + switches[0] + "]: " + name);

                fritz.getSwitchPresence(sid, switches[0], options).then(function(presence) {
                    console.log("Switch presence [" + switches[0] + "]: " + presence);

                    fritz.getSwitchState(sid, switches[0], options).then(function(state) {
                        console.log("Switch state [" + switches[0] + "]: " + state);
                    });

                    fritz.getTemperature(sid, switches[0], options).then(function(temp) {
                        console.log("Switch temperature [" + switches[0] + "]: " + temp + "°C");
                    });
                });
            });
        }
    });

    // display thermostat information
    fritz.getThermostatList(sid, options).then(function(thermostats) {
        console.log("Thermostats: " + thermostats);

        if (thermostats.length) {
            fritz.getTemperature(sid, thermostats[0], options).then(function(temp) {
                console.log("Thermostat temperature [" + thermostats[0] + "]: " + temp + '°C');
            });

            fritz.getTempTarget(sid, thermostats[0], options).then(function(temp) {
                console.log("Get Target temperature [" + thermostats[0] + "]: " + temp + '°C');
            });

            fritz.setTempTarget(sid, thermostats[0], 22.0, options).then(function(temp) {
                console.log("Set Target temperature [" + thermostats[0] + "]: " + temp + '°C');
            });
        }
    });
})
.catch(function(error) {
    console.error(error);
});
