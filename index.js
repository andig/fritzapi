/**
 * smartFritz - Fritz goes smartHome
 *
 * AVM SmartHome nodeJS Control - for AVM Fritz!Box and Dect200 Devices
 *
 * @author Andreas Goetz <cpuidle@gmx.de>
 *
 * Forked from: https://github.com/nischelwitzer/smartfritz
 * nischi - first version: July 2014
 *
 * based on: Node2Fritz by steffen.timm on 05.12.13 for Fritz!OS > 05.50
 * and  thk4711 (code https://github.com/pimatic/pimatic/issues/38)
 * Documentation is at http://www.avm.de/de/Extern/files/session_id/AHA-HTTP-Interface.pdf
 */

/* jshint esversion: 6, -W079 */
var Promise = require('bluebird');
var request = require('request').defaults({ strictSSL: false }); // be less strict about SSL errors
var cheerio = require('cheerio');
var parser = require('xml2json-light');
var extend = require('extend');


/*
 * Object-oriented API
 */

module.exports.Fritz = Fritz;

function Fritz(username, password, uri) {
    this.sid = null;
    this.username = username;
    this.password = password;
    this.options = { url: uri || 'http://fritz.box' };
}

Fritz.prototype = {
    call: function(func) {
        var originalSID = this.sid;

        /* jshint laxbreak:true */
        var promise = this.sid
            ? Promise.resolve(this.sid)
            : module.exports.getSessionID(this.username, this.password, this.options);

        // function arguments beyond func parameter
        var args = Array.from(arguments).slice(1).concat(this.options);

        return promise.then(function(sid) {
            this.sid = sid;

            return func.apply(null, [this.sid].concat(args)).catch(function(error) {
                if (error.response && error.response.statusCode == 403) {
                    // this.sid has not been updated or is invalid - get a new SID
                    if (this.sid === null || this.sid === originalSID) {
                        this.sid = null;

                        return fritz.getSessionID(this.username, this.password, this.options).then(function(sid) {
                            // this session id is the most current one - so use it from now on
                            this.sid = sid;

                            return func.apply(null, [this.sid].concat(args));
                        }.bind(this));
                    }
                    // this.sid has already been updated during the func() call - assume this is a valid SID now
                    else {
                        return func.apply(null, [this.sid].concat(args));
                    }
                }

                throw error;
            }.bind(this));
        }.bind(this));
    },

    getSID: function() {
        return this.sid;
    },

    getDeviceListInfo: function() {
        return this.call(module.exports.getDeviceListInfo);
    },

    getDeviceList: function() {
        return this.call(module.exports.getDeviceList);
    },

    getDevice: function(ain) {
        return this.call(module.exports.getDevice, ain);
    },

    getTemperature: function(ain) {
        return this.call(module.exports.getTemperature, ain);
    },

    getSwitchList: function() {
        return this.call(module.exports.getSwitchList);
    },

    getSwitchState: function(ain) {
        return this.call(module.exports.getSwitchState, ain);
    },

    setSwitchOn: function(ain) {
        return this.call(module.exports.setSwitchOn, ain);
    },

    setSwitchOff: function(ain) {
        return this.call(module.exports.setSwitchOff, ain);
    },

    getSwitchEnergy: function(ain) {
        return this.call(module.exports.getSwitchEnergy, ain);
    },

    getSwitchPower: function(ain) {
        return this.call(module.exports.getSwitchPower, ain);
    },

    getSwitchPresence: function(ain) {
        return this.call(module.exports.getSwitchPresence, ain);
    },

    getSwitchName: function(ain) {
        return this.call(module.exports.getSwitchName, ain);
    },

    getThermostatList: function() {
        return this.call(module.exports.getThermostatList);
    },

    setTempTarget: function(ain, temp) {
        return this.call(module.exports.setTempTarget, ain, temp);
    },

    getTempTarget: function(ain) {
        return this.call(module.exports.getTempTarget, ain);
    },

    getTempNight: function(ain) {
        return this.call(module.exports.getTempNight, ain);
    },

    getTempComfort: function(ain) {
        return this.call(module.exports.getTempComfort, ain);
    },

    getBatteryCharge: function(ain) {
        return this.call(module.exports.getBatteryCharge, ain);
    },

    getGuestWlan: function() {
        return this.call(module.exports.getGuestWlan);
    },

    setGuestWlan: function(enable) {
        return this.call(module.exports.setGuestWlan, enable);
    },
};


/*
 * Functional API
 */

var defaults = { url: 'http://fritz.box' };

/**
 * Execute HTTP request that honors failed/invalid login
 */
function httpRequest(path, req, options)
{
    return new Promise(function(resolve, reject) {
        req = extend({}, defaults, req, options);
        req.url += path;

        request(req, function(error, response, body) {
            if (error || !(/^2/.test('' + response.statusCode)) || /action=".?login.lua"/.test(body)) {
                if (/action=".?login.lua"/.test(body)) {
                    // fake failed login if redirected to login page without HTTP 403
                    response.statusCode = 403;
                }
                reject({
                    error: error,
                    response: response,
                    options: req
                });
            }
            else {
                resolve(body.trim());
            }
        });
    });
}

/**
 * Execute Fritz API command for device specified by AIN
 */
function executeCommand(sid, command, ain, options, path)
{
    path = path || '/webservices/homeautoswitch.lua?0=0';

    if (sid)
        path += '&sid=' + sid;
    if (command)
        path += '&switchcmd=' + command;
    if (ain)
        path += '&ain=' + ain;

    return httpRequest(path, {}, options);
}

/**
 * Parse guest WLAN form settings
 */
function parseHTML(html)
{
    $ = cheerio.load(html);
    var form = $('form');
    var settings = {};

    $('input', form).each(function(i, elem) {
        var val;
        var name = $(elem).attr('name');
        if (!name) return;

        switch ($(elem).attr('type')) {
            case 'checkbox':
                val = $(elem).attr('checked') == 'checked';
                break;
            default:
                val = $(elem).val();
        }
        settings[name] = val;
    });

    $('select option[selected=selected]', form).each(function(i, elem) {
        var val = $(elem).val();
        var name = $(elem).parent().attr('name');
        settings[name] = val;
    });

    return settings;
}

/*
 * Temperature conversion
 */
const MIN_TEMP = 8;
const MAX_TEMP = 28;

function temp2api(temp)
{
    var res;

    if (temp == 'on' || temp === true)
        res = 254;
    else if (temp == 'off' || temp === false)
        res = 253;
    else {
        // 0.5C accuracy
        res = Math.round((Math.min(Math.max(temp, MIN_TEMP), MAX_TEMP) - 8) * 2) + 16;
    }

    return res;
}

function api2temp(param)
{
    if (param == 254)
        return 'on';
    else if (param == 253)
        return 'off';
    else {
        // 0.5C accuracy
        return (parseFloat(param) - 16) / 2 + 8;
    }
}

// #############################################################################

// run command for selected device
module.exports.executeCommand = executeCommand;

// supported temperature range
module.exports.MIN_TEMP = MIN_TEMP;
module.exports.MAX_TEMP = MAX_TEMP;

// functions bitmask
module.exports.FUNCTION_THERMOSTAT          = 1 << 6;  // Comet DECT, Heizkostenregler
module.exports.FUNCTION_ENERGYMETER         = 1 << 7;  // Energie Messgerät
module.exports.FUNCTION_TEMPERATURESENSOR   = 1 << 8;  // Temperatursensor
module.exports.FUNCTION_OUTLET              = 1 << 9;  // Schaltsteckdose
module.exports.FUNCTION_DECTREPEATER        = 1 << 10; // AVM DECT Repeater

/*
 * Session handling
 */

// get session id
module.exports.getSessionID = function(username, password, options)
{
    if (typeof username !== 'string') throw new Error('Invalid username');
    if (typeof password !== 'string') throw new Error('Invalid password');

    return executeCommand(null, null, null, options, '/login_sid.lua').then(function(body) {
        var challenge = body.match("<Challenge>(.*?)</Challenge>")[1];
        var challengeResponse = challenge +'-'+
            require('crypto').createHash('md5').update(Buffer(challenge+'-'+password, 'UTF-16LE')).digest('hex');
        var url = "/login_sid.lua?username=" + username + "&response=" + challengeResponse;

        return executeCommand(null, null, null, options, url).then(function(body) {
            sessionID = body.match("<SID>(.*?)</SID>")[1];
            return Promise.resolve(sessionID);
        });
    });
};

// check if session id is OK
module.exports.checkSession = function(sid, options)
{
    return executeCommand(sid, null, null, options, '/login_sid.lua').then(function(body) {
        sessionID = body.match("<SID>(.*?)</SID>")[1];
        return Promise.resolve(sessionID);
    });
};


/*
 * General functions
 */

// get detailed device information (XML)
module.exports.getDeviceListInfo = function(sid, options)
{
    return executeCommand(sid, 'getdevicelistinfos', null, options);
};

// get device list
module.exports.getDeviceList = function(sid, options)
{
    return module.exports.getDeviceListInfo(sid, options).then(function(devicelistinfo) {
        var devices = parser.xml2json(devicelistinfo);
        // extract devices as array
        devices = [].concat((devices.devicelist || {}).device || []);
        return Promise.resolve(devices);
    });
};

// get single device
module.exports.getDevice = function(sid, ain, options)
{
    /* jshint laxbreak:true */
    var deviceList = options && options.deviceList
        ? Promise.resolve(options.deviceList)
        : module.exports.getDeviceList(sid, options);

    return deviceList.then(function(devices) {
        var dev = devices.find(function(device) {
            return device.identifier.replace(/\s/g, '') == ain;
        });

        return dev || Promise.reject();
    });
};

// get temperature- both switches and thermostats are supported, but not powerline modules
module.exports.getTemperature = function(sid, ain, options)
{
    return executeCommand(sid, 'gettemperature', ain, options).then(function(body) {
        return Promise.resolve(parseFloat(body) / 10); // °C
    });
};


/*
 * Switches
 */

// get switch list
module.exports.getSwitchList = function(sid, options)
{
    return executeCommand(sid, 'getswitchlist', null, options).then(function(res) {
        // force empty array on empty result
        return Promise.resolve(res === "" ? [] : res.split(','));
    });
};

// get switch state
module.exports.getSwitchState = function(sid, ain, options)
{
    return executeCommand(sid, 'getswitchstate', ain, options).then(function(body) {
        return Promise.resolve(/^1/.test(body)); // true if on
    });
};

// turn an outlet on. returns the state the outlet was set to
module.exports.setSwitchOn = function(sid, ain, options)
{
    return executeCommand(sid, 'setswitchon', ain, options).then(function(body) {
        return Promise.resolve(/^1/.test(body)); // true if on
    });
};

// turn an outlet off. returns the state the outlet was set to
module.exports.setSwitchOff = function(sid, ain, options)
{
    return executeCommand(sid, 'setswitchoff', ain, options).then(function(body) {
        return Promise.resolve(/^1/.test(body)); // false if off
    });
};

// get the total enery consumption. returns the value in Wh
module.exports.getSwitchEnergy = function(sid, ain, options)
{
    return executeCommand(sid, 'getswitchenergy', ain, options).then(function(body) {
        return Promise.resolve(parseFloat(body)); // Wh
    });
};

// get the current enery consumption of an outlet. returns the value in mW
module.exports.getSwitchPower = function(sid, ain, options)
{
    return executeCommand(sid, 'getswitchpower', ain, options).then(function(body) {
        return Promise.resolve(parseFloat(body) / 1000); // W
    });
};

// get the outet presence status
module.exports.getSwitchPresence = function(sid, ain, options)
{
    return executeCommand(sid, 'getswitchpresent', ain, options).then(function(body) {
        return Promise.resolve(/^1/.test(body)); // true if present
    });
};

// get switch name
module.exports.getSwitchName = function(sid, ain, options)
{
    return executeCommand(sid, 'getswitchname', ain, options).then(function(body) {
        return Promise.resolve(body.trim());
    });
};


/*
 * Thermostats
 */

// get the switch list
module.exports.getThermostatList = function(sid, options)
{
    /* jshint laxbreak:true */
    var deviceList = options && options.deviceList
        ? Promise.resolve(options.deviceList)
        : module.exports.getDeviceList(sid, options);

    return deviceList.then(function(devices) {
        // get thermostats- right now they're only available via the XML api
        var thermostats = devices.filter(function(device) {
            return device.productname == 'Comet DECT';
        }).map(function(device) {
            // fix ain
            return device.identifier.replace(/\s/g, '');
        });

        return Promise.resolve(thermostats);
    });
};

// set target temperature (Solltemperatur)
module.exports.setTempTarget = function(sid, ain, temp, options)
{
    return executeCommand(sid, 'sethkrtsoll&param=' + temp2api(temp), ain, options).then(function(body) {
        // api does not return a value
        return Promise.resolve(temp);
    });
};

// get target temperature (Solltemperatur)
module.exports.getTempTarget = function(sid, ain, options)
{
    return executeCommand(sid, 'gethkrtsoll', ain, options).then(function(body) {
        return Promise.resolve(api2temp(body));
    });
};

// get night temperature (Absenktemperatur)
module.exports.getTempNight = function(sid, ain, options)
{
    return executeCommand(sid, 'gethkrabsenk', ain, options).then(function(body) {
        return Promise.resolve(api2temp(body));
    });
};

// get comfort temperature (Komforttemperatur)
module.exports.getTempComfort = function(sid, ain, options)
{
    return executeCommand(sid, 'gethkrkomfort', ain, options).then(function(body) {
        return Promise.resolve(api2temp(body));
    });
};

// get battery charge - not part of Fritz API
module.exports.getBatteryCharge = function(sid, ain, options)
{
    return module.exports.getDevice(sid, ain, options).then(function(device) {
        var req = {
            method: 'POST',
            form: {
                sid: sid,
                xhr: 1,
                no_sidrenew: '',
                device: device.id,
                oldpage: '/net/home_auto_hkr_edit.lua',
                back_to_page: '/net/network.lua'
            }
        };

        return httpRequest('/data.lua', req, options).then(function(body) {
            $ = cheerio.load(body);
            var res = $('div>label:contains(Batterie)+span').first().text().replace(/[\s%]/g, '');
            return Promise.resolve(res);
        });
    });
};


/*
 * WLAN
 */

// get guest WLAN settings - not part of Fritz API
module.exports.getGuestWlan = function(sid, options)
{
    return executeCommand(sid, null, null, options, '/wlan/guest_access.lua?0=0').then(function(body) {
        return Promise.resolve(parseHTML(body));
    });
};

// set guest WLAN settings - not part of Fritz API
module.exports.setGuestWlan = function(sid, enable, options)
{
    /* jshint laxbreak:true */
    var settings = enable instanceof Object
        ? Promise.resolve(enable)
        : executeCommand(sid, null, null, options, '/wlan/guest_access.lua?0=0').then(function(body) {
              return extend(parseHTML(body), {
                  activate_guest_access: enable
              });
          });

    return settings.then(function(settings) {
        // convert boolean to checkbox
        for (var property in settings) {
            if (settings[property] === true)
                settings[property] = 'on';
            else if (settings[property] === false)
                delete settings[property];
        }

        var req = {
            method: 'POST',
            form: extend(settings, {
                sid: sid,
                xhr: 1,
                no_sidrenew: '',
                apply: '',
                oldpage: '/wlan/guest_access.lua'
            })
        };

        return httpRequest('/data.lua', req, options).then(function(body) {
            return Promise.resolve(parseHTML(body));
        });
    });
};
