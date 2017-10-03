## 0.9.6 
- bugfixed OO bitfunctions in object

- moved jslint to pretest
- added first testcase (mocha+chai based)
- added testdir ./test
- npm test testcase look up

- travis workflow: before_install: jslint, before_script: npm test, after_sucess: istanbul coverage
- added istanbul cover (npm run coverage)

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
