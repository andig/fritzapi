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
 *
 * AVM Documentation is at https://avm.de/service/schnittstellen/
 */

/* jshint esversion: 6, -W079 */
var Promise = require('bluebird');
var request = require('request');
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

    //bitfunctions hidden, unchangable to prototype
    if (!Fritz.prototype.HANFUN)            { Object.defineProperty( Fritz.prototype, "HANFUN",            {value: module.exports.FUNCTION_HANFUN,            writable: false}); }
    if (!Fritz.prototype.LIGHT)             { Object.defineProperty( Fritz.prototype, "LIGHT",             {value: module.exports.FUNCTION_LIGHT,             writable: false}); }
    if (!Fritz.prototype.ALARM)             { Object.defineProperty( Fritz.prototype, "ALARM",             {value: module.exports.FUNCTION_ALARM,             writable: false}); }
    if (!Fritz.prototype.BUTTON)            { Object.defineProperty( Fritz.prototype, "BUTTON",            {value: module.exports.FUNCTION_BUTTON,            writable: false}); }
    if (!Fritz.prototype.THERMOSTAT)        { Object.defineProperty( Fritz.prototype, "THERMOSTAT",        {value: module.exports.FUNCTION_THERMOSTAT,        writable: false}); }
    if (!Fritz.prototype.ENERGYMETER)       { Object.defineProperty( Fritz.prototype, "ENERGYMETER",       {value: module.exports.FUNCTION_ENERGYMETER,       writable: false}); }
    if (!Fritz.prototype.TEMPERATURESENSOR) { Object.defineProperty( Fritz.prototype, "TEMPERATURESENSOR", {value: module.exports.FUNCTION_TEMPERATURESENSOR, writable: false}); }
    if (!Fritz.prototype.OUTLET)            { Object.defineProperty( Fritz.prototype, "OUTLET",            {value: module.exports.FUNCTION_OUTLET,            writable: false}); }
    if (!Fritz.prototype.DECTREPEATER)      { Object.defineProperty( Fritz.prototype, "DECTREPEATER",      {value: module.exports.FUNCTION_DECTREPEATER,      writable: false}); }
    if (!Fritz.prototype.MICROFONE)         { Object.defineProperty( Fritz.prototype, "MICROFONE",         {value: module.exports.FUNCTION_MICROFONE,         writable: false}); }
    if (!Fritz.prototype.TEMPLATE)          { Object.defineProperty( Fritz.prototype, "TEMPLATE",          {value: module.exports.FUNCTION_TEMPLATE,          writable: false}); }
    if (!Fritz.prototype.HANFUNUNIT)        { Object.defineProperty( Fritz.prototype, "HANFUNUNIT",        {value: module.exports.FUNCTION_HANFUNUNIT,        writable: false}); }
    if (!Fritz.prototype.SWITCHCONTROL)     { Object.defineProperty( Fritz.prototype, "SWITCHCONTROL",     {value: module.exports.FUNCTION_SWITCHCONTROL,     writable: false}); }
    if (!Fritz.prototype.LEVELCONTROL)      { Object.defineProperty( Fritz.prototype, "LEVELCONTROL",      {value: module.exports.FUNCTION_LEVELCONTROL,      writable: false}); }
    if (!Fritz.prototype.COLORCONTROL)      { Object.defineProperty( Fritz.prototype, "COLORCONTROL",      {value: module.exports.FUNCTION_COLORCONTROL,      writable: false}); }
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

                        return module.exports.getSessionID(this.username, this.password, this.options).then(function(sid) {
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

    getOSVersion: function() {
        return this.call(module.exports.getOSVersion);
    },

    // @deprecated
    getDeviceListInfo: function() {
        return this.call(module.exports.getDeviceListInfo);
    },

    getDeviceListInfos: function() {
        return this.call(module.exports.getDeviceListInfos);
    },

    // templates
    getTemplateListInfos : function() {
        return this.call(module.exports.getTemplateListInfos);
    },

    getTemplateList : function() {
        return this.call(module.exports.getTemplateList);
    },

    applyTemplate: function(ain) {
        return this.call(module.exports.applyTemplate, ain);
    },

    //new functions related to devices in version 7
    getBasicDeviceStats: function() {
        return this.call(module.exports.getBasicDeviceStats);
    },

    getDeviceList: function() {
        return this.call(module.exports.getDeviceList);
    },

    getDeviceListFiltered: function(filter) {
        return this.call(module.exports.getDeviceListFiltered, filter);
    },

    getDevice: function(ain) {
        return this.call(module.exports.getDevice, ain);
    },

    // multiple devices
    getTemperature: function(ain) {
        return this.call(module.exports.getTemperature, ain);
    },

    getPresence: function(ain) {
        return this.call(module.exports.getPresence, ain);
    },

    // plug commands
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

    setSwitchToggle: function(ain) {
        return this.call(module.exports.setSwitchToggle, ain);
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

    // thermostat commands
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

    setHkrBoost: function(ain, endtime) {
        return this.call(module.exports.setHkrBoost, ain, endtime);
    },

    setHkrWindowOpen: function(ain, endtime) {
        return this.call(module.exports.setHkrWindowOpen, ain, endtime);
    },

    // light related

    getBulbList: function() {
        return this.call(module.exports.getBulbList);
    },

    getColorBulbList: function() {
        return this.call(module.exports.getColorBulbList);
    },

    getDimmableBulbList: function() {
        return this.call(module.exports.getDimmableBulbList);
    },

    setSimpleOnOff: function(ain, state) {
        return this.call(module.exports.setSimpleOnOff, ain, state);
    },

    setLevel: function(ain, level) {
        return this.call(module.exports.setLevel, ain, level);
    },

    setLevelPercentage: function(ain, levelInPercent) {
        return this.call(module.exports.setLevelPercentage, ain, levelInPercent);
    },

    setColor: function(ain, color, satindex, duration) {
        return this.call(module.exports.setColor, ain,color, satindex, duration);
    },

    setColorTemperature: function(ain, temperature, duration) {
        return this.call(module.exports.setColorTemperature, ain, temperature, duration);
    },

    getColorDefaults: function(ain) {
        return this.call(module.exports.getColorDefaults, ain);
    },

    // Blind related
    // setBlind: function(ain, blindState) {
    //     return this.call(module.exports.setBlind, ain, blindState);
    // },


    // ---------------------------------------------
    getBatteryCharge: function(ain) {
        return this.call(module.exports.getBatteryCharge, ain);
    },

    getWindowOpen: function(ain) {
        return this.call(module.exports.getWindowOpen, ain);
    },

    getGuestWlan: function() {
        return this.call(module.exports.getGuestWlan);
    },

    setGuestWlan: function(enable) {
        return this.call(module.exports.setGuestWlan, enable);
    },

    getPhoneList: function() {
        return executeCommand(this.sid, null, null, null, "/fon_num/foncalls_list.lua?csv=");
    },


    /*
     * Helper functions
     */
    api2temp: module.exports.api2temp,
    temp2api: module.exports.temp2api
};


/*
 * Functional API
 */

var defaults = { url: 'http://fritz.box' };

/**
 * Check if numeric value
 */
function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

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

function time2api(seconds)
{
  if (seconds <= 0) {
    return 0;
  }

  return Date.now() / 1000 + Math.min(60 * 60 * 24, seconds);
}

// function api2time(param)
// {
//     // convert the input to a readable timestamp
//     return 0;
// }

function state2api(param)
{
    // convert the input to an allowed value
    if (isNumeric(param)) {
        return (param > 2 ? 2 : param);
    }
    else if ((typeof param) == "string") {
        switch(param.toUpperCase()) {
            case "OFF":     return 0; break;
            case "ON":      return 1; break;
            case "TOGGLE":
            default:        return 2; break;
        }
    }
    else
        return 2;
}

function level2api(param, isPercent)
{
    // convert the input to an allowed value
    if (isPercent)
        return (param > 100 ? 100 : param);
    else
        return (param > 255 ? 255 : param);
    return 0;
}

// The fritzbox accepts only a predefined set of color temperatures
// Setting the color temperature to other values fails silently.
function colortemp2api(param)
{
    if (param > 6200)
        return 6500;
    else if (param > 5600)
        return 5900;
    else if (param > 5000)
        return 5300;
    else if (param > 4500)
        return 4700;
    else if (param > 4000)
        return 4200;
    else if (param > 3600)
        return 3800;
    else if (param > 3200)
        return 3400;
    else if (param > 2850)
        return 3000;
    else
        return 2700;
}

// Fritz color schemes
// The fritzbox accepts only a limited range of hue/saturation combinations
// to set the color of a bulb. The hue value must be one of the 12 predefined
// values for the base colors and each of the hue values has its own set of
// three saturation values.
// Any attempt to use other hue/saturaion values fails silently.
colors = {
    "red"       : {"hue" : 358, "sat" : [180,112,54], "val" : [255,255,255] },
    "orange"    : {"hue" : 35,  "sat" : [214,140,72], "val" : [252,252,255] },
    "yellow"    : {"hue" : 52,  "sat" : [153,102,51], "val" : [255,255,255] },
    "lime"      : {"hue" : 92,  "sat" : [123, 79,38], "val" : [248,250,252] },
    "green"     : {"hue" : 120, "sat" : [160, 82,38], "val" : [220,232,242] },
    "turquoise" : {"hue" : 160, "sat" : [145, 84,41], "val" : [235,242,248] },
    "cyan"      : {"hue" : 195, "sat" : [179,118,59], "val" : [255,255,255] },
    "lightblue" : {"hue" : 212, "sat" : [169,110,56], "val" : [252,252,255] },
    "blue"      : {"hue" : 225, "sat" : [204,135,67], "val" : [255,255,255] },
    "purple"    : {"hue" : 266, "sat" : [169,110,54], "val" : [250,250,252] },
    "magenta"   : {"hue" : 296, "sat" : [140, 92,46], "val" : [250,252,255] },
    "pink"      : {"hue" : 335, "sat" : [180,107,51], "val" : [255,248,250] }
}

function color2apihue(color)
{
    var col = colors[color.toLowerCase()];
    if (typeof col != 'undefined')
        // convert the input to an allowed value
        return col.hue;
    else
        // unknow color, return a value that will change nothing
        return 0;
}

function satindex2apisat(color, satindex)
{
    var col = colors[color.toLowerCase()];
    if (typeof col != 'undefined')
        // convert the input to an allowed value
        return col.sat[(satindex > 2 ? 0 : satindex)];
    else
        // unknow color, return a value that will change nothing
        return 0;
}

// #############################################################################

// run command for selected device
module.exports.executeCommand = executeCommand;
module.exports.api2temp = api2temp;
module.exports.temp2api = temp2api;

// supported temperature range
module.exports.MIN_TEMP = MIN_TEMP;
module.exports.MAX_TEMP = MAX_TEMP;

// functions bitmask
module.exports.FUNCTION_HANFUN              = 1;       // HAN-FUN device
module.exports.FUNCTION_LIGHT               = 1 << 2;  // Bulb
module.exports.FUNCTION_ALARM               = 1 << 4;  // Alarm Sensor
module.exports.FUNCTION_BUTTON              = 1 << 5;  // Button device
module.exports.FUNCTION_THERMOSTAT          = 1 << 6;  // Comet DECT, Heizkostenregler
module.exports.FUNCTION_ENERGYMETER         = 1 << 7;  // Energie Messgerät
module.exports.FUNCTION_TEMPERATURESENSOR   = 1 << 8;  // Temperatursensor
module.exports.FUNCTION_OUTLET              = 1 << 9;  // Schaltsteckdose
module.exports.FUNCTION_DECTREPEATER        = 1 << 10; // AVM DECT Repeater
module.exports.FUNCTION_MICROFONE           = 1 << 11; // Microphone
module.exports.FUNCTION_TEMPLATE            = 1 << 12; // Template
module.exports.FUNCTION_HANFUNUNIT          = 1 << 13; // HAN-FUN unit
module.exports.FUNCTION_SWITCHCONTROL       = 1 << 15; // Simple switch on/off
module.exports.FUNCTION_LEVELCONTROL        = 1 << 16; // level
module.exports.FUNCTION_COLORCONTROL        = 1 << 17; // color

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
            var sessionID = body.match("<SID>(.*?)</SID>")[1];
            if (sessionID === "0000000000000000") {
                return Promise.reject(sessionID);
            }
            return sessionID;
        });
    });
};

// check if session id is OK
module.exports.checkSession = function(sid, options)
{
    return executeCommand(sid, null, null, options, '/login_sid.lua').then(function(body) {
        var sessionID = body.match("<SID>(.*?)</SID>")[1];
        if (sessionID === "0000000000000000") {
            return Promise.reject(sessionID);
        }
        return sessionID;
    });
};


/*
 * General functions
 */

// get OS version
module.exports.getOSVersion = function(sid, options)
{
    var req = {
        method: 'POST',
        form: {
            sid: sid,
            xhr: 1,
            page: 'overview'
        }
    };

    /* jshint laxbreak:true */
    return httpRequest('/data.lua', req, options).then(function(body) {
        var json = JSON.parse(body);
        var osVersion = json.data && json.data.fritzos && json.data.fritzos.nspver
            ? json.data.fritzos.nspver
            : null;
        return osVersion;
    });
};

// get template information (XML)
module.exports.getTemplateListInfos  = function(sid, options)
{
    return executeCommand(sid, 'gettemplatelistinfos', null, options);
};

// get template information (json)
module.exports.getTemplateList = function(sid, options)
{
    return module.exports.getTemplateListInfos(sid, options).then(function(templateinfo) {
        var templates = parser.xml2json(templateinfo);
        // extract templates as array
        templates = [].concat((templates.templatelist || {}).template || []).map(function(template) {
            return template;
        });
        return templates;
    });
};

// apply template
module.exports.applyTemplate = function(sid, ain, options)
{
    return executeCommand(sid, 'applytemplate', ain, options).then(function(body) {
        return body; // returns applied id if success
    });
};

// get basic device info (XML)
module.exports.getBasicDeviceStats  = function(sid, ain, options)
{
    return executeCommand(sid, 'getbasicdevicestats', ain, options);
};

// get detailed device information (XML)
module.exports.getDeviceListInfos = function(sid, options)
{
    return executeCommand(sid, 'getdevicelistinfos', null, options);
};

// @deprecated
module.exports.getDeviceListInfo = function(sid, options)
{
    console.warn('`getDeviceListInfo` is deprecated. Use `getDeviceListInfos` instead.');
    return module.exports.getDeviceListInfos(sid, options);
};

// get device list
module.exports.getDeviceList = function(sid, options)
{
    return module.exports.getDeviceListInfos(sid, options).then(function(devicelistinfo) {
        var devices = parser.xml2json(devicelistinfo);
        // extract devices as array
        devices = [].concat((devices.devicelist || {}).device || []).map(function(device) {
            // remove spaces in AINs
            device.identifier = device.identifier.replace(/\s/g, '');
            return device;
        });
        return devices;
    });
};

// get device list by filter criteria
module.exports.getDeviceListFiltered = function(sid, filter, options)
{
    /* jshint laxbreak:true */
    var deviceList = options && options.deviceList
        ? Promise.resolve(options.deviceList)
        : module.exports.getDeviceList(sid, options);

    return deviceList.then(function(devices) {
        return devices.filter(function(device) {
            return Object.keys(filter).every(function(key) {
                /* jshint laxbreak:true */
                return key === 'functionbitmask'
                    ? device.functionbitmask & filter[key]
                    : device[key] == filter[key];
            });
        });
    });
};

// get single device
module.exports.getDevice = function(sid, ain, options)
{
    return module.exports.getDeviceListFiltered(sid, {
        identifier: ain
    }, options).then(function(devices) {
        return devices.length ? devices[0] : Promise.reject();
    });
};

// get temperature- both switches and thermostats are supported, but not powerline modules
module.exports.getTemperature = function(sid, ain, options)
{
    return executeCommand(sid, 'gettemperature', ain, options).then(function(body) {
        return parseFloat(body) / 10; // °C
    });
};

// get presence from deviceListInfo
module.exports.getPresence = function(sid, ain, options)
{
    return module.exports.getDevice(sid, ain, options).then(function(device) {
        return !!device.presence;
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
        return res === "" ? [] : res.split(',');
    });
};

// get switch state
module.exports.getSwitchState = function(sid, ain, options)
{
    return executeCommand(sid, 'getswitchstate', ain, options).then(function(body) {
        return /^1/.test(body); // true if on
    });
};

// turn an outlet on. returns the state the outlet was set to
module.exports.setSwitchOn = function(sid, ain, options)
{
    return executeCommand(sid, 'setswitchon', ain, options).then(function(body) {
        return /^1/.test(body); // true if on
    });
};

// turn an outlet off. returns the state the outlet was set to
module.exports.setSwitchOff = function(sid, ain, options)
{
    return executeCommand(sid, 'setswitchoff', ain, options).then(function(body) {
        return /^1/.test(body); // false if off
    });
};

// toggle an outlet. returns the state the outlet was set to
module.exports.setSwitchToggle = function(sid, ain, options)
{
    return executeCommand(sid, 'setswitchtoggle', ain, options).then(function(body) {
        return /^1/.test(body); // false if off
    });
};

// get the total enery consumption. returns the value in Wh
module.exports.getSwitchEnergy = function(sid, ain, options)
{
    return executeCommand(sid, 'getswitchenergy', ain, options).then(function(body) {
        return parseFloat(body); // Wh
    });
};

// get the current enery consumption of an outlet. returns the value in mW
module.exports.getSwitchPower = function(sid, ain, options)
{
    return executeCommand(sid, 'getswitchpower', ain, options).then(function(body) {
        var power = parseFloat(body);
        return isNumeric(power) ? power / 1000 : null; // W
    });
};

// get the outet presence status
module.exports.getSwitchPresence = function(sid, ain, options)
{
    return executeCommand(sid, 'getswitchpresent', ain, options).then(function(body) {
        return /^1/.test(body); // true if present
    });
};

// get switch name
module.exports.getSwitchName = function(sid, ain, options)
{
    return executeCommand(sid, 'getswitchname', ain, options).then(function(body) {
        return body.trim();
    });
};


/*
 * Thermostats
 */

// get the thermostat list
module.exports.getThermostatList = function(sid, options)
{
    return module.exports.getDeviceListFiltered(sid, {
        functionbitmask: module.exports.FUNCTION_THERMOSTAT
    }, options).map(function(device) {
        return device.identifier;
    });
};

// set target temperature (Solltemperatur)
module.exports.setTempTarget = function(sid, ain, temp, options)
{
    return executeCommand(sid, 'sethkrtsoll&param=' + temp2api(temp), ain, options).then(function(body) {
        // api does not return a value
        return temp;
    });
};

// get target temperature (Solltemperatur)
module.exports.getTempTarget = function(sid, ain, options)
{
    return executeCommand(sid, 'gethkrtsoll', ain, options).then(function(body) {
        return api2temp(body);
    });
};

// get night temperature (Absenktemperatur)
module.exports.getTempNight = function(sid, ain, options)
{
    return executeCommand(sid, 'gethkrabsenk', ain, options).then(function(body) {
        return api2temp(body);
    });
};

// get comfort temperature (Komforttemperatur)
module.exports.getTempComfort = function(sid, ain, options)
{
    return executeCommand(sid, 'gethkrkomfort', ain, options).then(function(body) {
        return api2temp(body);
    });
};

// ------------------------------------------------
// Not yet tested - deactivated for now
//
// activate boost with end time or deactivate boost
module.exports.setHkrBoost = function(sid, ain, endtime, options)
{
    return executeCommand(sid, 'sethkrboost&endtimestamp=' + time2api(endtime), ain, options).then(function(body) {
        // api does not return a value
        return endtime;
    });
};

// activate window open  with end time or deactivate boost
module.exports.setHkrWindowOpen = function(sid, ain, endtime, options)
{
    return executeCommand(sid, 'sethkrwindowopen&endtimestamp=' + time2api(endtime), ain, options).then(function(body) {
        // api does not return a value
        return endtime;
    });
};
// ------------------------------------------------

/*
 * AVM Buttons Fritz!DECT 400 and Fritz!DECT 440
 * Querying a button isn't really useful because they don't have a state to query,
 * there is just a timestamp of the last short and long button press.
 * The only useful information is the battery status returned in the 'battery' and
 * 'batterylow' property.
 * The Fritz!DECT 440 should have an additional 'temperature' property
 */

// get a list of all button devices
module.exports.getButtonList = function(sid, options)
{
    return module.exports.getDeviceListFiltered(sid, {
        functionbitmask: module.exports.FUNCTION_BUTTON
    }, options).map(function(device) {
        return device.identifier;
    });
};


/*
 * Light bulbs (HAN-FUN)
 */

// get a list of all bulbs
module.exports.getBulbList = function(sid, options)
{
    return module.exports.getDeviceListFiltered(sid, {
        functionbitmask: module.exports.FUNCTION_LIGHT
        }, options).map(function(device) {
        return device.identifier;
    });
};

// get a list of bulbs which support colors
module.exports.getColorBulbList = function(sid, options)
{
    return module.exports.getDeviceListFiltered(sid, {
        functionbitmask: module.exports.FUNCTION_LIGHT | module.exports.FUNCTION_COLORCONTROL
        }, options).map(function(device) {
        return device.identifier;
    });
};

// switch the device on, of or toggle its current state
module.exports.setSimpleOnOff = function(sid, ain, state, options)
{
    //ain = ain.replace('-1','');
    return executeCommand(sid, 'setsimpleonoff&onoff=' + state2api(state), ain, options).then(function(body) {
        // api does not return a value
        return state;
    });
};

// Dimm the device, allowed values are 0 - 255
module.exports.setLevel = function(sid, ain, level, options)
{
    return executeCommand(sid, 'setlevel&level=' + level2api(level,false), ain, options).then(function(body) {
        // api does not return a value
        return level;
    });
};

// Dimm the device, allowed values are 0 - 100
module.exports.setLevelPercentage = function(sid, ain, levelInPercent, options)
{
    return executeCommand(sid, 'setlevelpercentage&level=' + level2api(level,true), ain, options).then(function(body) {
        // api does not return a value
        return level;
    });
};

// Set the color and saturation of a color bulb
// Valid color values are:
// red, orange, yellow, lime, green, turquoise, cyan,
// lightblue, blue, purple, magenta and pink
// Valid satindex values are: 0, 1 or 2
module.exports.setColor = function(sid, ain,  color, satindex, duration, options)
{
    return executeCommand(sid, 'setcolor&hue=' + color2apihue(color) +
                                '&saturation=' + satindex2apisat(color, satindex) +
                                '&duration=' + duration, ain, options).then(function(body) {
        // api does not return a value
        return color;
    });
};

// Set the color temperature of a bulb.
// Valid values are 2700, 3000, 3400,3800, 4200, 4700, 5300, 5900 and 6500.
// Other values are adjusted to one of the above values
module.exports.setColorTemperature = function(sid, ain,  temperature, duration, options)
{
    var temp = colortemp2api(temperature);
    return executeCommand(sid, 'setcolortemperature&temperature=' + temp +
                               '&duration=' + duration, ain, options).then(function(body) {
        // api does not return a value, return our corrected value
        return temp;
    });
};

// get the color defaults
// This is mostly useless because they are no defaults which can be changed but
// fixed values. Only combinations returned by this api call are accepted by
// setcolor and setcolortemperature.
// module.exports.getColorDefaults = function(sid, ain, options)
// {
//     return executeCommand(sid, 'getcolordefaults', ain, options).then(function(body) {
//         return body;
//     });
// };

// ------------------------------------------------
// Not yet tested - deactivated for now
// I don't know about any blind control unit with HANFUN support, but this API call makes
// it plausible that AVM or a partner has somthing like that in the pipeline.
//
// module.exports.setBlind = function(sid, ain,  blindState, options)
// {
//     // „open“, „close“ or „stop“
//     return executeCommand(sid, 'setblind&target=' + blindstate2api(blindState), ain, options).then(function(body) {
//         // api does not return a value
//         return blindState;
//     });
// };

// get battery charge
// Attention: this function queries the whole device list to get the value for one device.
// If multiple device will be queried for the battery status, a better approach would be to
// get the device list once and then filter out the devices of interest.
module.exports.getBatteryCharge = function(sid, ain, options)
{
    return module.exports.getDevice(sid, ain, options).then(function(device) {
        return device.battery;
    });
};

// Get the window open flag of a thermostat
// Attention: this function queries the whole device list to get the value for one device.
// If multiple device will be queried for the window open status, a better approach would
// be to get the device list once and then filter out the devices of interest.
module.exports.getWindowOpen = function(sid, ain, options)
{
    return module.exports.getDevice(sid, ain, options).then(function(device) {
        return device.hkr.windowopenactiv == '0' ? false : true;
    });
}


/*
 * WLAN
 */

// Parse guest WLAN form settings
function parseGuestWlanHTML(html)
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

// get guest WLAN settings - not part of Fritz API
module.exports.getGuestWlan = function(sid, options)
{
    return executeCommand(sid, null, null, options, '/wlan/guest_access.lua?0=0').then(function(body) {
        return parseGuestWlanHTML(body);
    });
};

// set guest WLAN settings - not part of Fritz API
module.exports.setGuestWlan = function(sid, enable, options)
{
    /* jshint laxbreak:true */
    var settings = enable instanceof Object
        ? Promise.resolve(enable)
        : executeCommand(sid, null, null, options, '/wlan/guest_access.lua?0=0').then(function(body) {
            return extend(parseGuestWlanHTML(body), {
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
            return parseGuestWlanHTML(body);
        });
    });
};
