'use strict';

const Homey = require('homey');

const DEFAULT_POLL_INTERVAL = 15; // minutes
const LOW_BATTERY_THRESHOLD = 20;

class BikeDevice extends Homey.Device {

  async onInit() {
    this.log('Gazelle Bike device initialized:', this.getName());

    // Get API reference
    this.api = this.homey.app.getApi();

    // Get stored tokens
    this.tokens = this.getStoreValue('tokens');

    if (!this.tokens) {
      this.setUnavailable(this.homey.__('errors.not_authenticated'));
      return;
    }

    // Register capability listeners
    this._registerCapabilityListeners();

    // Start polling
    this._startPolling();

    // Initial update
    await this._updateTelemetry();
  }

  async onDeleted() {
    this._stopPolling();
    this.log('Gazelle Bike device deleted');
  }

  async onSettings({ oldSettings, newSettings, changedKeys }) {
    if (changedKeys.includes('poll_interval')) {
      this._stopPolling();
      this._startPolling();
    }
  }

  _registerCapabilityListeners() {
    // Register flow triggers
    this.batteryChangedTrigger = this.homey.flow.getDeviceTriggerCard('battery_changed');
    this.chargingStartedTrigger = this.homey.flow.getDeviceTriggerCard('charging_started');
    this.chargingStoppedTrigger = this.homey.flow.getDeviceTriggerCard('charging_stopped');
    this.batteryLowTrigger = this.homey.flow.getDeviceTriggerCard('battery_low');
  }

  _startPolling() {
    const interval = this.getSetting('poll_interval') || DEFAULT_POLL_INTERVAL;
    this.log(`Starting polling every ${interval} minutes`);

    this.pollInterval = this.homey.setInterval(async () => {
      await this._updateTelemetry();
    }, interval * 60 * 1000);
  }

  _stopPolling() {
    if (this.pollInterval) {
      this.homey.clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Ensure we have a valid access token
   */
  async _getValidToken() {
    // Check if token is expired (with 5 min margin)
    if (this.tokens.expires_at && this.tokens.expires_at > Date.now() + 300000) {
      return this.tokens.access_token;
    }

    // Refresh token
    this.log('Refreshing access token');
    try {
      this.tokens = await this.api.refreshAccessToken(this.tokens.refresh_token);
      await this.setStoreValue('tokens', this.tokens);
      return this.tokens.access_token;
    } catch (error) {
      this.error('Failed to refresh token:', error);
      this.setUnavailable(this.homey.__('errors.token_refresh_failed'));
      throw error;
    }
  }

  /**
   * Update telemetry from API
   */
  async _updateTelemetry() {
    try {
      const accessToken = await this._getValidToken();
      const bikeId = this.getData().id;

      const telemetry = await this.api.getTelemetry(accessToken, bikeId);

      // Store previous values for triggers
      const prevBattery = this.getCapabilityValue('measure_battery');
      const prevCharging = this.getCapabilityValue('charging_state');

      // Update capabilities
      if (telemetry.battery) {
        const batteryPercentage = Math.round(telemetry.battery.charge);
        const isCharging = telemetry.battery.state === 'CHARGING';

        await this.setCapabilityValue('measure_battery', batteryPercentage);
        await this.setCapabilityValue('charging_state', isCharging);
        await this.setCapabilityValue('alarm_battery', batteryPercentage < LOW_BATTERY_THRESHOLD);

        // Trigger: battery changed
        if (prevBattery !== batteryPercentage) {
          await this.batteryChangedTrigger.trigger(this, { percentage: batteryPercentage });
        }

        // Trigger: charging started
        if (!prevCharging && isCharging) {
          await this.chargingStartedTrigger.trigger(this);
        }

        // Trigger: charging stopped
        if (prevCharging && !isCharging) {
          await this.chargingStoppedTrigger.trigger(this);
        }

        // Trigger: battery low
        if (prevBattery >= LOW_BATTERY_THRESHOLD && batteryPercentage < LOW_BATTERY_THRESHOLD) {
          await this.batteryLowTrigger.trigger(this);
        }
      }

      if (telemetry.range !== undefined) {
        await this.setCapabilityValue('meter_range', Math.round(telemetry.range));
      }

      if (telemetry.odometer !== undefined) {
        await this.setCapabilityValue('meter_odometer', Math.round(telemetry.odometer * 10) / 10);
      }

      if (telemetry.assistLevel !== undefined) {
        await this.setCapabilityValue('assist_level', telemetry.assistLevel);
      }

      if (telemetry.coordinate) {
        await this.setCapabilityValue('location_latitude', telemetry.coordinate.latitude);
        await this.setCapabilityValue('location_longitude', telemetry.coordinate.longitude);
      }

      // Mark as available
      await this.setAvailable();

      this.log('Telemetry updated successfully');

    } catch (error) {
      this.error('Failed to update telemetry:', error);

      if (error.message === 'Unauthorized') {
        this.setUnavailable(this.homey.__('errors.unauthorized'));
      }
    }
  }

  /**
   * Force refresh (can be called from flow action)
   */
  async refresh() {
    await this._updateTelemetry();
  }

  /**
   * Flash the bike lights
   */
  async flashLights() {
    try {
      const accessToken = await this._getValidToken();
      const bikeId = this.getData().id;
      await this.api.flashLights(accessToken, bikeId);
      this.log('Flash lights command sent');
      return true;
    } catch (error) {
      this.error('Failed to flash lights:', error);
      throw error;
    }
  }

}

module.exports = BikeDevice;
