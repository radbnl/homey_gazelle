'use strict';

const fetch = require('node-fetch');
const crypto = require('crypto');

const AUTH0_DOMAIN = 'consumer.login.pon.bike';
const AUTH0_CLIENT_ID = 'AdsjTeHU8eK6NPRqrgKUZmpEaG3NkTbu';
const AUTH0_AUDIENCE = 'https://app.connected.pon.bike/';
const API_BASE_URL = 'https://app.connected.pon.bike/api/';

class GazelleApi {

  /**
   * Login with email/password using Resource Owner Password Grant
   * Falls back to authorization code flow if needed
   */
  async login(email, password) {
    // Try Resource Owner Password Grant first
    const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'password',
        client_id: AUTH0_CLIENT_ID,
        username: email,
        password: password,
        audience: AUTH0_AUDIENCE,
        scope: 'openid profile email offline_access',
      }),
    });

    if (response.ok) {
      const tokens = await response.json();
      tokens.expires_at = Date.now() + (tokens.expires_in * 1000);
      return tokens;
    }

    // If password grant is not allowed, we need browser-based auth
    // This will be handled differently in the pairing flow
    const error = await response.json();
    throw new Error(error.error_description || 'Authentication failed');
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken) {
    const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: AUTH0_CLIENT_ID,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const tokens = await response.json();
    tokens.expires_at = Date.now() + (tokens.expires_in * 1000);
    tokens.refresh_token = tokens.refresh_token || refreshToken;

    return tokens;
  }

  /**
   * Make API request
   */
  async request(accessToken, endpoint, method = 'GET') {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Accept-Language': 'nl',
        'Manufacturer-Id': 'GZ',
        'Client-Type': 'IOS',
      },
    });

    if (response.status === 401) {
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get all bikes
   */
  async getBikes(accessToken) {
    return this.request(accessToken, 'v9/bikes');
  }

  /**
   * Get bike details (v10 - more info)
   */
  async getBikeDetails(accessToken, bikeId) {
    return this.request(accessToken, `v10/bikes/${bikeId}`);
  }

  /**
   * Get bike telemetry (battery, location, etc.)
   */
  async getTelemetry(accessToken, bikeId) {
    // Use v10 for more complete data
    const details = await this.getBikeDetails(accessToken, bikeId);
    return details.telemetry;
  }

  /**
   * Flash bike lights
   */
  async flashLights(accessToken, bikeId) {
    return this.request(accessToken, `v1/bikes/${bikeId}/flash-lights`, 'POST');
  }

  /**
   * Get activity history
   */
  async getActivityHistory(accessToken, bikeId, timeUnit = 'MONTH', startDate = '2024-01-01') {
    const cutoffDate = Date.now();
    return this.request(accessToken, `v6/bikes/${bikeId}/activity/history?timeUnit=${timeUnit}&startDate=${startDate}&cutoffDate=${cutoffDate}`);
  }

}

module.exports = GazelleApi;
