# Gazelle / Pon.Bike API Documentation

This document describes the reverse-engineered API used by the Gazelle Connected app.

## Base URL

```
https://app.connected.pon.bike/api/
```

## Authentication

The API uses Auth0 for authentication with PKCE flow.

### Auth0 Configuration

| Setting | Value |
|---------|-------|
| Domain | `consumer.login.pon.bike` |
| Client ID (iOS) | `AdsjTeHU8eK6NPRqrgKUZmpEaG3NkTbu` |
| Client ID (Android) | `Zb2Da9tJfsN4j4QrBfduSmdbeUA2XpIa` |
| Audience | `https://app.connected.pon.bike/` |
| Redirect URI (iOS) | `https://consumer.login.pon.bike/ios/nl.gazelle.gazelle-connect/callback` |

### Required Headers

All API requests require these headers:

```
Authorization: Bearer {access_token}
Accept: application/json
Accept-Language: nl
Manufacturer-Id: GZ
Client-Type: IOS
```

## Endpoints

### Bikes

#### Get all bikes
```
GET /v9/bikes
```

Returns array of bikes linked to the account.

#### Get bike details (recommended)
```
GET /v10/bikes/{bikeId}
```

Returns complete bike information including:
- `details`: model, nickname, frameNumber, pairedOn, protectionLevel
- `module`: firmware, lastOnline, autoChargeEnabled
- `telemetry`: battery, coordinate, odometer, range, assistLevel
- `dataSubscription`: subscription status and dates
- `insurance`: insurance status
- `notifications`: notification preferences

#### Get bike telemetry only
```
GET /v9/bikes/{bikeId}/telemetry
```

Returns:
```json
{
  "assistLevel": 4,
  "battery": {
    "charge": 91,
    "state": "NOT_CHARGING"  // or "CHARGING"
  },
  "coordinate": {
    "latitude": 52.123,
    "longitude": 4.567
  },
  "moduleCharge": 97,
  "odometer": 4785.74,
  "range": 39.0
}
```

#### Get bike by module ID
```
GET /v9/bikes/module/{moduleId}
```

### Activity & History

#### Get activity history
```
GET /v6/bikes/{bikeId}/activity/history?timeUnit={unit}&startDate={date}&cutoffDate={timestamp}
```

Parameters:
- `timeUnit`: `DAY`, `WEEK`, or `MONTH`
- `startDate`: ISO date string (e.g., `2024-01-01`)
- `cutoffDate`: Unix timestamp in milliseconds

Returns aggregated distance per period. Note: Only tracks rides recorded through the app, not total odometer.

### Actions

#### Flash lights
```
POST /v1/bikes/{bikeId}/flash-lights
```

Makes the bike lights flash. Returns 204 No Content on success.

#### Change nickname
```
PUT /v1/bikes/{bikeId}/nickname
```

Body: `{ "nickname": "My Bike" }`

### Settings

#### Enable setting
```
PUT /v2/bikes/{bikeId}/settings/{setting}/enable
```

#### Disable setting
```
PUT /v2/bikes/{bikeId}/settings/{setting}/disable
```

### Theft Protection

#### Report theft
```
POST /v4/bikes/{bikeId}/theft/report
```

#### Cancel theft report
```
POST /v1/bikes/{bikeId}/theft/cancel
```

#### Set theft detection mode
```
PUT /v1/bikes/{bikeId}/theft/detection/mode
```

### User

#### Get user preferences
```
GET /v9/user-preferences
```

#### Get notifications
```
GET /v4/notifications
```

#### Mark notifications as read
```
PUT /v7/notifications/mark-as-read
```

### Pairing

#### Pair a bike
```
POST /v6/bicycles/pairing
```

#### Unpair a bike
```
DELETE /v4/bicycles/{bikeId}/pairing
```

### Other

#### Get bike image
```
GET /v1/productionprofiles/{productionProfileId}/image
```

#### Get points of interest (dealers)
```
GET /v3/pois
```

#### Set preferred dealer
```
PUT /v3/dealers/{dealerId}/preferred
```

#### Remove preferred dealer
```
DELETE /v3/dealers/preferred
```

#### Health check
```
GET /health-watcher/v1/health
```

## Data Subscription

Bikes have a data subscription that determines API access. Check `dataSubscription.state` in the v10 response:
- `ACTIVE`: Full API access
- Other states may have limited functionality

## Rate Limiting

No specific rate limits documented. Polling every 5-15 minutes appears safe.

## Notes

- The `moduleCharge` is the battery level of the GPS/connectivity module, separate from the main bike battery
- `protectionLevel` can be `MOTION_SENSOR` for bikes with theft detection
- The API is used by multiple Pon.Bike brands (Gazelle, Kalkhoff, Focus, etc.) - `Manufacturer-Id` header determines the brand

## Disclaimer

This is an unofficial, reverse-engineered API. It may change without notice. Use at your own risk.
