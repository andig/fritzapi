# fritzapi
[![NPM Version](https://img.shields.io/npm/v/fritzapi.svg)](https://www.npmjs.com/package/fritzapi)
[![Build status](https://travis-ci.org/andig/fritzapi.svg?branch=master)](https://travis-ci.org/andig/fritzapi)
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=HWZTN5AU8LSUC)

Home automation node API for Fritz!Box, Fritz!DECT and FRITZ!Powerline devices. 

[homebridge-fritz](https://github.com/andig/homebridge-fritz) and [pimatic-fritz](https://github.com/andig/pimatic-fritz) are built on fritzapi.

## Functions

### General functions

- Get the session ID `getSessionID`
- Get device list as XML `getDeviceListInfo` >FritzOS 6.10
- Get device list `getDeviceList` >FritzOS 6.10
- Get device `getDevice` >FritzOS 6.10
- Get temperature `getTemperature` - polyfill

**Note**

`getTemperature` is not available on the FRITZ!Powerline 546E WLAN set and will always return `NaN`.

### Fritz!DECT 200 and 210 outlet functions (includes FRITZ!Powerline 546E)

- Get list `getSwitchList`
- Get state `getSwitchState`
- Set on `setSwitchOn`
- Set off `setSwitchOff`
- Get power `getSwitchPower`
- Get energy `getSwitchEnergy`
- Get presence status `getSwitchPresence`
- Get name `getSwitchName`

For controlling AVM Fritz!DECT 200 devices the actuator identification number (AIN) is needed. The AIN can be obtained using `getSwitchList` which returns a list of AINs or the more general `getDeviceList` function which returns a verbose device list structure as JSON.

`getTemperature` is not available for switch groups that can be created through the Fritz!Box user interface.

### Fritz!DECT 100 functions

The Fritz!DECT 100 DECT repeater AIN does only appear in the `getDeviceList` output. It supports retrieving the repeaters temperature.

### Comet DECT thermostat functions

Thermostat functions are only available as of FritzOS 6.36

- Get list `getThermostatList` - polyfill
- Set target temperature `setTempTarget`, supports 'ON'/'OFF' to enable/disable thermostat
- Get target temperature `getTempTarget`
- Get comfort temperature `getTempComfort`
- Get night temperature `getTempNight`
- Get battery charge status `getBatteryCharge`


### Wlan functions

- Get the guest wlan settings `getGuestWlan`
- Set the guest wlan `setGuestWlan`

**Note**

`getGuestWlan` returns a structure containing all wifi settings found in the Fritz!Box UI. The `setGuestWlan` function accepts either a settings structure such as this or a single boolean value.

All functions have been tested on FritzOS 6.20/6.36/6.51 using the Fritz!Box 7390. The WLAN functions may be less stable.


## Installation

```bash
npm install fritzapi
```


## Usage

### Object-oriented interface

Get the list of switch AINs using a customer Fritz!Box address:
```js
var Fritz = require('fritzapi').Fritz;

var f = new Fritz("user", "password", "192.168.178.1");

f.getSwitchList().then(function(ains){
  console.log(f.getSID());
  console.log(ains);
});
```

### Functional interface

Get the session ID using default Fritz!Box address (http://fritz.box):
```js
var fritz = require('fritzapi');

fritz.getSessionID("user", "password").then(function(sid) {
    console.log(sid);
});
```

Get the list of switch AINs using a custom Fritz!Box address with self-signed certificate:
```js
fritz.getSessionID("user", "password", {
  url: "192.168.178.1",
  strictSSL: false         // workaround DEPTH_ZERO_SELF_SIGNED_CERT SSL error
}).then(function(sid) {
  console.log(sid);

  // note that the options/url need be carries through every single api call
  fritz.getSwitchList(sid, options).then(function(ains){
    console.log(ains);
  });
});
```


## AHA HTTP Interface Documentation

http://avm.de/fileadmin/user_upload/Global/Service/Schnittstellen/AHA-HTTP-Interface.pdf


## Acknowledgements

Thanks to:

* nischelwitzer for the basic js implementation (https://github.com/nischelwitzer/smartfritz)
* steffen.timm for the basic communication function
* thk4711 for the FRITZ!DECT 200 codes
* AVM for providing the good AHA-HTTP interface document
* EUROtronic Technology GmbH for providing free CometDECT thermostat sample
* AVM for providing free FRITZ!Powerline 546E WLAN set
