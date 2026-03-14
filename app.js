'use strict';

const Homey = require('homey');
const GazelleApi = require('./lib/GazelleApi');

class GazelleApp extends Homey.App {

  async onInit() {
    this.log('Gazelle Connected app is running');

    // Initialize API client
    this.api = new GazelleApi(this.homey);

    // Register flow cards
    this._registerFlowCards();
  }

  _registerFlowCards() {
    // Condition: is charging
    this.homey.flow.getConditionCard('is_charging')
      .registerRunListener(async (args) => {
        return args.device.getCapabilityValue('charging_state') === true;
      });

    // Condition: battery above
    this.homey.flow.getConditionCard('battery_above')
      .registerRunListener(async (args) => {
        const battery = args.device.getCapabilityValue('measure_battery');
        return battery > args.percentage;
      });
  }

  /**
   * Get the API client
   */
  getApi() {
    return this.api;
  }

}

module.exports = GazelleApp;
