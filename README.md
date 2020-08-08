# fritzapi
[![NPM Version](https://img.shields.io/npm/v/fritzapi.svg)](https://www.npmjs.com/package/fritzapi)
[![NPM Downloads](https://img.shields.io/npm/dt/fritzapi.svg)](https://www.npmjs.com/package/fritzapi)
[![Build status](https://travis-ci.org/andig/fritzapi.svg?branch=master)](https://travis-ci.org/andig/fritzapi)
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=HWZTN5AU8LSUC)

Home automation node API for Fritz!Box, Fritz!DECT and FRITZ!Powerline devices. 

[homebridge-fritz](https://github.com/andig/homebridge-fritz) and [pimatic-fritz](https://github.com/andig/pimatic-fritz) are built on fritzapi.

## Functions

### General functions

- Get the Fritz!OS version `getOSVersion`
- Get the session ID `getSessionID`
- Get device list as XML `getDeviceListInfos` >Fritz!OS 6.10
- Get device list `getDeviceList` >Fritz!OS 6.10
- Get device list with filter criteria applied `getDeviceListFiltered` >Fritz!OS 6.10
- Get device `getDevice` >Fritz!OS 6.10
- Get temperature `getTemperature` - polyfill
- Get presence `getPresence` - polyfill
- Get template list as XML `getTemplateListInfos` >Fritz!OS 7.0
- Get template list `getTemplateList` >Fritz!OS 7.0
- Get template list `applyTemplate` >Fritz!OS 7.0

**Note**

`getTemperature` works for DECT repeaters but is not available on the FRITZ!Powerline 546E WLAN set and will always return `NaN`.

While `getTemperature` works for outlets, it is not available for (outlet) groups that can be created through the Fritz!Box user interface.

`getDeviceListInfos` was named `getDeviceListInfo` in earlier versions. For consistency with the official Fritz!Box API the name has been changed. The `getDeviceListInfo` name is deprecated and will be removed in a future release. 
In general, use of `getDeviceListInfos` is discouraged as the equivalent `getDeviceList` function which returns an object interface instead of XML is easier to use.


### Fritz!DECT 200 and 210 outlet functions (includes FRITZ!Powerline 546E)

- Get list `getSwitchList`
- Get state `getSwitchState`
- Set on `setSwitchOn`
- Set off `setSwitchOff`
- Toggle `setSwitchToggle`
- Get power `getSwitchPower`
- Get energy `getSwitchEnergy`
- Get presence status `getSwitchPresence`
- Get name `getSwitchName`
- Get basic device stats as XML `getBasicDeviceStats` >Fritz!OS 7.0

For controlling AVM Fritz!DECT 200 devices the actuator identification number (AIN) is needed. The AIN can be obtained using `getSwitchList` which returns a list of AINs or the more general `getDeviceList` function which returns a verbose device list structure as JSON.


### Fritz!DECT 100 functions

The Fritz!DECT 100 DECT repeater AIN does only appear in the `getDeviceList` output. It supports retrieving the repeater's temperature.


### Fritz!DECT 300, 301 and CometDECT thermostat functions

Thermostat functions are only available as of Fritz!OS 6.36

- Get list `getThermostatList` - polyfill
- Set target temperature `setTempTarget`, supports 'ON'/'OFF' to enable/disable thermostat
- Get target temperature `getTempTarget`
- Get comfort temperature `getTempComfort`
- Get night temperature `getTempNight`
- Get battery charge `getBatteryCharge` (uses UI scraping, may be unstable)
- Get window open `getWindowOpen` (uses UI scraping, may be unstable)

### Fritz!DECT 500 and Telekom bulb functions

Bulb functions are only available as of Fritz!OS 7.20

- Get List of all bulbs `getBulbList`
- Get List of all bulbs supporting colors `getColorBulbList`
- Switch bulb on/off or toggle it `setSimpleOnOff`
- Dimm a bulb `setLevel`, 0 - 255
- Dimm a bulb `setLevelPercentage`, 0 - 100
- Set the color and saturation `setColor`, see note 1
- Set the color temperature `setColorTemperature`, see note 2

**Note 1**  
The color api calls of the FritzBox accept only a predefined set of values. 
To get easy access to the predefined values fritzapi accepts the following values as the color:  
`red, orange, yellow, lime, green, turquoise, cyan, lightblue, blue, purple, magenta, pink`  
The saturation can be `0, 1 or 2` to select one of the predefined saturation values for the color.

**Note 2**  
The color temperature api calls of the FritzBox accept only a predefined set of values. 
Valid values are `2700, 3000, 3400,3800, 4200, 4700, 5300, 5900 and 6500`.  
Other values are adjusted by fritzapi to one of the above values.

### WLAN functions

- Get the guest wlan settings `getGuestWlan`
- Set the guest wlan `setGuestWlan`

**Note**

`getGuestWlan` returns a structure containing all wifi settings found in the Fritz!Box UI. The `setGuestWlan` function accepts either a settings structure such as this or a single boolean value.

All functions have been tested on Fritz!OS 6.20/6.36/6.51 using the Fritz!Box 7390 and on Fritz!OS 6.50 on Fritz!Box 6490. The WLAN functions may be less stable.


## Installation

```bash
npm install fritzapi
```


## Usage

### Object-oriented interface

The object-oriented interface is the recommended way of using fritzapi.

Get the list of switch AINs using a customer Fritz!Box address:
```js
var Fritz = require('fritzapi').Fritz;

var f = new Fritz("user", "password", "http://192.168.178.1");

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

**Note** The functional interface may be deprecated in a future version of the library.


## Device details

Below is the output of `getDeviceList` for reference.

The list was produced for various Fritz devices I've had around. It might have changed in the meantime depending on device firmware or Fritz HTTP API version. 
These definitions remain cached by the Fritz!Box even if the device is no longer connected. The device presence is indicated by the `present` attribute.

### Powerline

    { identifier: '34:31:C4:DB:F6:C7',
      id: '20000',
      functionbitmask: '640',
      fwversion: '06.20',
      manufacturer: 'AVM',
      productname: 'FRITZ!Powerline 546E',
      present: '0',
      name: 'FRITZ!Powerline 546E',
      switch: { state: '', mode: '', lock: '' },
      powermeter: { power: '', energy: '' } }

### Outlets

    { identifier: '087610103568',
      id: '17',
      functionbitmask: '35712',
      fwversion: '04.16',
      manufacturer: 'AVM',
      productname: 'FRITZ!DECT 200',
      present: '1',
      name: 'FRITZ!DECT 200 #1',
      switch: { state: '', mode: '', lock: '', devicelock : '' },
      simpleonoff { state: '' },
      powermeter: { voltage: '', power: '', energy: '' }, 
      temperature: { celsius: '', offset: '' }
      }

    { identifier: '116570031825',    
      id: '18',
      functionbitmask: '640',
      fwversion: '03.67',
      manufacturer: 'AVM',
      productname: 'FRITZ!DECT 210',
      present: '0',
      name: 'FRITZ!DECT 210 #3',
      switch: { state: '', mode: '', lock: '' },
      powermeter: { power: '', energy: '' } }

### DECT Repeater

    { identifier: '116570002527',
      id: '20',
      functionbitmask: '1024',
      fwversion: '03.64',
      manufacturer: 'AVM',
      productname: 'FRITZ!DECT Repeater 100',
      present: '0',
      name: 'FRITZ!DECT Rep 100 #5' }

### Thermostats

    { identifier: '109710195784',
      id: '17',
      functionbitmask: '320',
      fwversion: '03.54',
      manufacturer: 'AVM',
      productname: 'Comet DECT',
      present: '1',
      txbusy: '0'
      name: 'Comet DECT',
      battery: '90'
      batterylow: '0'
      temperature: { celsius: '', offset: '' },
      hkr: { tist: '49', tsoll: '253', absenk: '32', komfort: '42', lock: '1', devicelock: '1', errorcode: '0',  
             windowopenactiv: '0', windowopenactiveendtime: '0', boostactive: '0', boostactiveendtime: '0', 
             battery: '90', batterylow: '0', summeractive: '1', holidayactive: '0',
             nextchange: { endperiod: '1598907600', tchange: '32' }} }

### HANFUN

As of Fritz!OS 7 the HANFUN devices have their own bitmask `1`:

    { identifier: '119340326786',
      id: '406',
      functionbitmask: '1',
      fwversion: '00.00',
      manufacturer: '0x0feb',
      productname: 'HAN-FUN',
      present: '1',
      name: 'HAN-FUN #1' }

HANFUN functions are accessible as "HANFUN unit" devices. Bitmask consists of HANFUN unit (bit 13) plus actual function (in this case ALARM, bit 3):

    { identifier: '119340326786-1',
      id: '2000',
      functionbitmask: '8208',
      fwversion: '0.0',
      manufacturer: '0x0feb',
      productname: 'HAN-FUN',
      present: '1',
      name: 'no name',
      etsiunitinfo: { etsideviceid: '406', unittype: '514', interfaces: '256' },
      alert: { state: '1' } }

or a color bulb:

    { identifier: '127010028190-1',
      id: '2000',
      functionbitmask: '237572',
      fwversion: '0.0',
      manufacturer: '0x319d',
      productname: 'HAN-FUN',
      present: '0',
      txbusy: '0'
      name: 'Bulb 1',
      simpleonoff { state: '1' },
      levelcontrol: { level: '255', levelpercentage: '100' },
      colorcontrol: { supported_modes: '5', current_mode: '1', hue: '35', saturation: '214', temperature: '' },
      etsiunitinfo: { etsideviceid: '406', unittype: '278', interfaces: '512,514,513' } }

## AHA HTTP Interface Documentation

http://avm.de/fileadmin/user_upload/Global/Service/Schnittstellen/AHA-HTTP-Interface.pdf

## Acknowledgements

Thanks to:

* AVM for providing free test devices and the AHA-HTTP interface document
* EUROtronic Technology GmbH for providing free CometDECT thermostat sample
* nischelwitzer for the basic js implementation (https://github.com/nischelwitzer/smartfritz)
* steffen.timm for the basic communication function
* thk4711 for the FRITZ!DECT 200 codes
