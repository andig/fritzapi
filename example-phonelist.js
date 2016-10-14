/**
 * smartFritz - Fritz goes smartHome
 *
 * AVM SmartHome nodeJS Control - for AVM Fritz!Box and Dect200 Devices
 *
 * @author Andreas Goetz <cpuidle@gmx.de>
 *
 * Examples. To use install csv:
 *    npm install csv
 */

var fritz = require('./smartfritz.js');
var csv = require('csv');

var username = DEFINE HERE;
var password = DEFINE HERE;


fritz.getSessionID(username, password).then(function(sid) {
    console.log("SID: " + sid);

    // function executeCommand(sid, command, ain, options, path)
    fritz.executeCommand(sid, null, null, null, "/fon_num/foncalls_list.lua?csv=").then(function(body) {
        console.log(body);

        // strip first line with delimiter
        csv.parse(body.split("\n").slice(1).join("\n"), {
            delimiter: ';'
        }, function(err, data) {
            console.log(JSON.stringify(data));
        });
    });

});
