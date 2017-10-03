"use strict";
/*
    testing of bitfunctions
    stub-test: static calls - no subbing
    live-test: <not required>

ALARM              === FUNCTION_ALARM               = 1 << 4;  // Alarm Sensor
THERMOSTAT         === FUNCTION_THERMOSTAT          = 1 << 6;  // Comet DECT, Heizkostenregler
ENERGYMETER        === FUNCTION_ENERGYMETER         = 1 << 7;  // Energie Messgerät
TEMPERATURESENSOR  === FUNCTION_TEMPERATURESENSOR   = 1 << 8;  // Temperatursensor
OUTLET             === FUNCTION_OUTLET              = 1 << 9;  // Schaltsteckdose
DECTREPEATER       === FUNCTION_DECTREPEATER        = 1 << 10; // AVM DECT Repeater    

*/

const chai = require('chai')
  ,expect = chai.expect;
  
const FritzF = require('../index'); //functional API
const FritzO = FritzF.Fritz; //object API

var fritzO; //object API test object instance

describe('bitfunctions', () => {
    describe('functional-api', () => {
        it('FUNCTION_ALARM', () => {
            expect(FritzF.FUNCTION_ALARM).to.be.a('Number');
            expect(FritzF.FUNCTION_ALARM).to.be.above(0);
        });
        it('FUNCTION_THERMOSTAT', () => {
            expect(FritzF.FUNCTION_THERMOSTAT).to.be.a('Number');
            expect(FritzF.FUNCTION_THERMOSTAT).to.be.above(0);
        });
        it('FUNCTION_ENERGYMETER', () => {
            expect(FritzF.FUNCTION_ENERGYMETER).to.be.a('Number');
            expect(FritzF.FUNCTION_ENERGYMETER).to.be.above(0);
        });
        it('FUNCTION_TEMPERATURESENSOR', () => {
            expect(FritzF.FUNCTION_TEMPERATURESENSOR).to.be.a('Number');
            expect(FritzF.FUNCTION_TEMPERATURESENSOR).to.be.above(0);
        });
        it('FUNCTION_OUTLET', () => {
            expect(FritzF.FUNCTION_OUTLET).to.be.a('Number');
            expect(FritzF.FUNCTION_OUTLET).to.be.above(0);
        });
        it('FUNCTION_DECTREPEATER', () => {
            expect(FritzF.FUNCTION_DECTREPEATER).to.be.a('Number');
            expect(FritzF.FUNCTION_DECTREPEATER).to.be.above(0);
        });
    });
    describe('oo-api', () => {
        beforeEach(() => {
            fritzO = new FritzF.Fritz("user","pwd","url");
        });
        afterEach(() => {
            fritzO = null;
        });
        it('ALARM', () => {
            expect(fritzO.ALARM).to.be.equal(FritzF.FUNCTION_ALARM);
            delete fritzO.ALARM; //delete is silent (no throw etc.) //reports no error... so next test will fail...
            expect(fritzO.ALARM).to.be.equal(FritzF.FUNCTION_ALARM);
            expect(() => {fritzO.ALARM = 42}).to.throw(TypeError); //should be readOnly
        });
        it('THERMOSTAT', () => {
            expect(fritzO.THERMOSTAT).to.be.equal(FritzF.FUNCTION_THERMOSTAT);
            delete fritzO.THERMOSTAT;
            expect(fritzO.THERMOSTAT).to.be.equal(FritzF.FUNCTION_THERMOSTAT);
            expect(() => {fritzO.THERMOSTAT = 42}).to.throw(TypeError);
        });
        it('ENERGYMETER', () => {
            expect(fritzO.ENERGYMETER).to.be.equal(FritzF.FUNCTION_ENERGYMETER);
            delete fritzO.ENERGYMETER;
            expect(fritzO.ENERGYMETER).to.be.equal(FritzF.FUNCTION_ENERGYMETER);
            expect(() => {fritzO.ENERGYMETER = 42}).to.throw(TypeError);
        });
        it('TEMPERATURESENSOR', () => {
            expect(fritzO.TEMPERATURESENSOR).to.be.equal(FritzF.FUNCTION_TEMPERATURESENSOR);
            delete fritzO.TEMPERATURESENSOR;
            expect(fritzO.TEMPERATURESENSOR).to.be.equal(FritzF.FUNCTION_TEMPERATURESENSOR);
            expect(() => {fritzO.TEMPERATURESENSOR = 42}).to.throw(TypeError);
        });
        it('OUTLET', () => {
            expect(fritzO.OUTLET).to.be.equal(FritzF.FUNCTION_OUTLET);
            delete fritzO.OUTLET;
            expect(fritzO.OUTLET).to.be.equal(FritzF.FUNCTION_OUTLET);
            expect(() => {fritzO.OUTLET = 42}).to.throw(TypeError);
        });
        it('DECTREPEATER', () => {
            expect(fritzO.DECTREPEATER).to.be.equal(FritzF.FUNCTION_DECTREPEATER);
            delete fritzO.DECTREPEATER;
            expect(fritzO.DECTREPEATER).to.be.equal(FritzF.FUNCTION_DECTREPEATER);
            expect(() => {fritzO.DECTREPEATER = 42}).to.throw(TypeError);
        });
    });
});