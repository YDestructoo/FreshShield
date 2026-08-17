# FreshShield Pico W API

FreshShield connects directly to a Pico W over local Wi-Fi. The app uses HTTP (not HTTPS) and accepts a host or `host:port` in Settings, for example `192.168.1.50` or `192.168.1.50:8080`.

For a physical Pico, set `EXPO_PUBLIC_DEMO_MODE=false` in `.env.local`, then restart Expo.

## Polling

The app requests the current device state every 2 seconds while a device address is configured:

```http
GET http://<pico-address>/
Accept: application/json
```

The Pico must return HTTP `200` with this JSON object:

```json
{
  "temperature": 3.8,
  "humidity": 76.4,
  "gas_level_raw": 132,
  "target_temp": 4.0,
  "is_stock_mode": false
}
```

| Field | Type | Meaning |
| --- | --- | --- |
| `temperature` | number | Current measured temperature in °C. |
| `humidity` | number | Current relative humidity in percent. |
| `gas_level_raw` | number | Raw gas-sensor reading. It is displayed as `132raw`; it is not converted to a unit. |
| `target_temp` | number | Active cooling target in °C. |
| `is_stock_mode` | boolean | `true` when the Pico is using its stock/automatic mode. The app accepts this field even though it is not shown as a dashboard card. |

All five fields are required. A missing field, wrong JSON type, non-200 response, or request that exceeds five seconds is treated as an offline/error state.

## Changing the target temperature

When **Apply target** is tapped, the app sends:

```http
POST http://<pico-address>/set_target
Content-Type: application/json

{"target_temp":4}
```

`target_temp` must be a finite JSON number. The endpoint must return the same complete status JSON object described above; the app immediately uses that response as the current reading.

## Chart aggregation

The dashboard keeps incoming readings in memory for the current app session:

- Humidity chart: readings are averaged into 5-minute buckets, showing up to 12 buckets (one hour).
- Temperature timeline: readings are averaged into 15-minute buckets, showing up to 12 buckets (three hours).

The large current-temperature value remains the latest reading, rather than a chart average.

## Pico implementation checklist

- Serve the endpoints on the same local network as the phone.
- Add CORS headers if testing the app in a web browser; native Android/iOS requests do not need browser CORS.
- Keep response field names and JSON types exactly as listed.
- Return the full status object from both `GET /` and `POST /set_target`.
