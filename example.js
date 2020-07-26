/**
 * fritzapi - Fritz goes smartHome
 *
 * AVM SmartHome nodeJS Control - for AVM Fritz!Box and Dect Devices
 *
 * @author Andreas Goetz <cpuidle@gmx.de>
 */

/* jshint esversion: 6 */

var Fritz = require('./index.js').Fritz,
    commandLineArgs = require('command-line-args'),
    getUsage = require('command-line-usage'),
    csv = require('csv');


// utility function to sequentialize promises
function sequence(promises) {
  var result = Promise.resolve();
  promises.forEach(function(promise,i) {
    result = result.then(promise);
  });
  return result;
}

function errorHandler(error) {
  if (error == "0000000000000000")
    console.error("Did not get session id- invalid username or password?");
  else
    console.error(error);
}

// display switch information
function switches() {
  return fritz.getSwitchList().then(function(switches) {
    console.log("Switches: " + switches + "\n");

    return sequence(switches.map(function(sw) {
      return function() {
        return sequence([
          function() {
            return fritz.getSwitchName(sw).then(function(name) {
              console.log("[" + sw + "] " + name);
            });
          },
          function() {
            return fritz.getSwitchPresence(sw).then(function(presence) {
              console.log("[" + sw + "] presence: " + presence);
            });
          },
          function() {
            return fritz.getSwitchState(sw).then(function(state) {
              console.log("[" + sw + "] state: " + state);
            });
          },
          function() {
            return fritz.getTemperature(sw).then(function(temp) {
              temp = isNaN(temp) ? '-' : temp + "°C";
              console.log("[" + sw + "] temp: " + temp + "\n");
            });
          }
        ]);
      };
    }));
  });
}

// display thermostat information
function thermostats() {
  return fritz.getThermostatList().then(function(thermostats) {
    console.log("Thermostats: " + thermostats + "\n");

    return sequence(thermostats.map(function(thermostat) {
      return function() {
        return sequence([
          // there is no native getThermostatName function- use getDevice instead
          function() {
            return fritz.getDevice(thermostat).then(function(device) {
              console.log("[" + thermostat + "] " + device.name);
            });       
          },
          function() {
            return fritz.getTemperature(thermostat).then(function(temp) {
              temp = isNaN(temp) ? '-' : temp + "°C";
              console.log("[" + thermostat + "] temp: " + temp);
            });
          },
          function() {
            return fritz.getTempTarget(thermostat).then(function(temp) {
              temp = isNaN(temp) ? '-' : temp + "°C";
              console.log("[" + thermostat + "] target temp: " + temp + "\n");
            });
          }          
        ]);
      };
    }));
  });
}

// display bulb information
function bulbs() {
  return fritz.getBulbList().then(function(bulbs) {
    console.log("Bulbs: " + bulbs + "\n");

    return sequence(bulbs.map(function(bulb) {
      return function() {
        return sequence([
          function() {
          // same as for thermostats, use getdevice for device information
          // Not very efficient, because the complete device list is
          // downloaded for each device again, but this is a demo, so what ...
          return fritz.getDevice(bulb).then(function(device) {
              console.log("[" + bulb + "] " + device.name);
              console.log("[" + bulb + "] presence: " + device.present);
              onOff = device.simpleonoff.state == '0' ? 'off' : 'on';
              console.log("[" + bulb + "] state: " + onOff);
              // a bulb has either hue/saturation values
              if (device.colorcontrol.hue != '') {
                console.log("[" + bulb + "] hue: " + device.colorcontrol.hue);
                console.log("[" + bulb + "] saturation: " + device.colorcontrol.saturation);
              }
              // or a color temperature
              else
                console.log("[" + bulb + "] temperature: " + device.colorcontrol.temperature);
              console.log("[" + bulb + "] level: " + device.levelcontrol.level + '\n');
            });       
          }
        ]);
      };
    }));
  });
}

// show phone List
function phoneList() {
  return fritz.getPhoneList().then(function(body) {
    console.log("Phone list as csv: "+body);
    // strip first line with delimiter
    csv.parse(body.split("\n").slice(1).join("\n"), {
      delimiter: ';'
    }, function(err, data) {
      if (err) {
        console.log("Error in converting csv!")
      } else {
        console.log("Phone list: "+JSON.stringify(data));
      }
    });
  });
}

// display debug information
function debug() {
  return fritz.getDeviceList().then(function(devices) {
    console.log("Raw devices\n");
    console.log(devices);
  });
}

// -- main --

const cmdOptionsDefinition = [
  { name: 'username', alias: 'u', type: String },
  { name: 'password', alias: 'p', type: String },
  { name: 'types', alias: 't', type: String, multiple: true, description: 'switches|thermostats|bulbs|debug, default is all, multiple possible' },
  { name: 'url', type: String },
  { name: 'help', alias: 'h', type: Boolean }
];

const cmdOptions = commandLineArgs(cmdOptionsDefinition);

if (cmdOptions.username === undefined || cmdOptions.help) {
  const sections = [{
    header: 'Example App',
    content: 'A simple app demonstrating the fritzapi functions.'
  }, {
    header: 'Options',
    optionList: cmdOptionsDefinition
  }];
  console.log(getUsage(sections));
  return;
}

// parse options
var fritz = new Fritz(cmdOptions.username, cmdOptions.password||"", cmdOptions.url||""),
    tasks = [];

if (cmdOptions.types === undefined || cmdOptions.types.indexOf('switches') >= 0) {
  tasks.push(function() {
    return switches();
  });
}
if (cmdOptions.types === undefined || cmdOptions.types.indexOf('thermostats') >= 0) {
  tasks.push(function() {
    return thermostats();
  });
}
if (cmdOptions.types === undefined || cmdOptions.types.indexOf('bulbs') >= 0) {
  tasks.push(function() {
    return bulbs();
  });
}
if (cmdOptions.types === undefined || cmdOptions.types.indexOf('debug') >= 0) {
  tasks.push(function() {
    return debug();
  });
}

// run tasks
sequence(tasks).catch(errorHandler);
