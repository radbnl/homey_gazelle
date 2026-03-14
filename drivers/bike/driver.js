'use strict';

const Homey = require('homey');
const GazelleApi = require('../../lib/GazelleApi');

class BikeDriver extends Homey.Driver {

  async onInit() {
    this.log('Gazelle Bike driver initialized');
  }

  async onPair(session) {
    let tokens = null;

    // Handle token input from custom view
    session.setHandler('token', async (tokenData) => {
      this.log('Received token data');

      try {
        // Validate token by making an API call
        const api = new GazelleApi();
        const bikes = await api.getBikes(tokenData.access_token);

        if (!bikes || bikes.length === 0) {
          throw new Error('Geen fietsen gevonden');
        }

        // Store tokens for list_devices
        tokens = tokenData;
        tokens.expires_at = tokens.expires_at || (Date.now() + 86400000);

        this.log(`Found ${bikes.length} bike(s)`);
        return true;

      } catch (error) {
        this.error('Token validation failed:', error.message);
        throw new Error('Token validatie mislukt: ' + error.message);
      }
    });

    // List available bikes
    session.setHandler('list_devices', async () => {
      if (!tokens) {
        throw new Error('Geen token. Ga terug en voer een token in.');
      }

      try {
        const api = new GazelleApi();
        const bikes = await api.getBikes(tokens.access_token);

        return bikes.map(bike => ({
          name: bike.nickname || bike.details?.model || 'Gazelle E-Bike',
          data: {
            id: bike.id,
          },
          store: {
            tokens: tokens,
          },
        }));

      } catch (error) {
        this.error('Failed to list bikes:', error);
        throw new Error('Kon fietsen niet ophalen: ' + error.message);
      }
    });
  }

}

module.exports = BikeDriver;
