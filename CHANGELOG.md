## 0.9.0

- **Breaking change**: SSL certificate check is now strict. This will break self-signed certificates that are typically used by AVM Fritz!Box. To connect via HTTPS to such a Fritz!Box add the `strictSSL: false` option:

		fritz.getSessionID(username, password, {
		    url: "https://...",
		    strictSSL: false
		}).then(function(sid) {
			// ...
		});

- changed `getSwitchPower` and `getBatteryCharge` to return `null` instead of 0 or empty if device is not connected

## 0.8.0

- added object interface
