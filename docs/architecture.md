# FreshShield Mobile App Architecture

## 1. Overview

FreshShield is a local-first mobile application that monitors and controls the existing FreshShield Raspberry Pi Pico W system.

The Pico W remains responsible for the actual hardware control. The mobile app acts as the user interface for:

- viewing live temperature,
- viewing humidity,
- viewing air-quality/gas sensor data,
- viewing the current target temperature,
- changing the target temperature,
- showing whether the device is connected,
- showing whether the Pico is in APP mode or stock/automatic mode,

No cloud backend, authentication system, or remote database is required.

---

## 2. System Architecture

```text
┌───────────────────────────────┐
│      FreshShield Mobile       │
│      Expo + React Native      │
│                               │
│  Connect                      │
│  Dashboard                    │
│  Settings                     │
│                               │
│  AsyncStorage (Pico IP)       │
└───────────────┬───────────────┘
                │
          HTTP + JSON
          Local Wi-Fi
                │
                ▼
┌───────────────────────────────┐
│      Raspberry Pi Pico W      │
│         MicroPython           │
│                               │
│  GET /                        │
│  POST /set_target             │
│                               │
│  Sensor Reading               │
│  Temperature Control Loop     │
│  Stock Mode Fallback          │
└───────────────┬───────────────┘
                │
        ┌───────┴────────┐
        ▼                ▼
      Sensors          BTS7960
   DHT22 / MQ135          │
                          ▼
                       Peltier
```

---

## 3. Tech Stack

### Mobile App

- Expo
- React Native
- TypeScript
- Expo Router
- NativeWind
- AsyncStorage
- Built-in `fetch()`
- `@expo/vector-icons`


### Existing Hardware

- Raspberry Pi Pico W
- DHT22
- MQ135
- BTS7960
- Peltier module
- SSD1306 OLED

No hardware changes are required.

---

## 4. App Responsibilities

The mobile app should:

1. Connect to the Pico W using its local IP address.
2. Save the Pico IP locally.
3. Poll the Pico for live device data.
4. Display:
   - temperature,
   - humidity,
   - gas/air-quality reading,
   - target temperature,
   - connection state,
   - stock/app mode.
5. Allow the user to set a new target temperature.
6. Keep the app-control heartbeat active while connected.
7. Handle connection failures without crashing.

The app must not directly control the Peltier or recreate the Pico control algorithm.

---

## 5. Pico W Responsibilities

The Pico W should remain responsible for:

- reading the DHT22,
- reading the MQ135,
- controlling the Peltier,
- calculating output power,
- running the control loop,
- exposing the local HTTP API,
- reverting to stock mode when the app stops communicating,
- displaying device information on the OLED.

---

## 6. API

### GET `/`

Fetch the current FreshShield status.

Example response:

```json
{
  "status": "ok",
  "temperature": 24.5,
  "humidity": 55.2,
  "gas_level_raw": 12500,
  "target_temp": 22.0,
  "is_stock_mode": false
}
```

---

### POST `/set_target`

Set the desired target temperature.

Request:

```json
{
  "target_temp": 22.5
}
```

Example flow:

```text
User changes target
        │
        ▼
FreshShield App
        │
 POST /set_target
        │
        ▼
      Pico W
        │
        ▼
Existing control loop
        │
        ▼
      Peltier
```

---

## 7. Polling and Heartbeat

The Pico W returns to its stock temperature profile if it does not receive an app request for 60 seconds.

Recommended app behavior:

```text
Connected
   │
   ├── GET / every ~5 seconds
   │
   ├── Update device state
   │
   └── Keep APP mode active
```

If communication fails:

```text
Request fails
   │
   ▼
Set app state to Disconnected
   │
   ▼
Stop assuming app control
   │
   ▼
Pico handles fallback itself
```

The app should never show the device as actively controlled if requests are failing.

---

## 8. Screens

### Connect

Used for initial device connection.

Contains:

- FreshShield name/logo
- Pico IP address input
- Connect button
- connection status

The IP should be stored locally after a successful connection.

---

### Dashboard

Main app screen.

Displays:

- connection status,
- current temperature,
- humidity,
- air-quality/gas value,
- current target temperature,
- APP/stock mode.

Controls:

- decrease target temperature,
- increase target temperature,
- apply target temperature.

Optional:

- temperature presets.

---

---

### Settings

Contains:

- current Pico IP,
- reconnect/change IP,
- auto-reconnect option,
- temperature alert preferences,
- app version/about section.

---

## 9. Recommended Project Structure

```text
freshshield/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── dashboard.tsx
│   └── settings.tsx
│
├── components/
│   ├── SensorCard.tsx
│   ├── ConnectionStatus.tsx
│   ├── TemperatureControl.tsx
│   └── ScreenContainer.tsx
│
├── hooks/
│   └── useFreshShield.ts
│
├── services/
│   └── pico.ts
│
├── storage/
│   └── settings.ts
│
├── types/
│   └── freshshield.ts
│
├── constants/
│   └── config.ts
│
└── assets/
```

---

## 10. Networking Layer

All Pico communication should be handled inside:

```text
services/pico.ts
```

Suggested functions:

```ts
getDeviceStatus(ip)
setTargetTemperature(ip, temperature)
```

UI components should not contain duplicated raw `fetch()` logic.

---

## 11. Device State

Use:

```text
hooks/useFreshShield.ts
```

Suggested state:

```ts
temperature
humidity
gasLevel
targetTemperature
isStockMode
isConnected
lastUpdated
error
```

The hook should manage:

- polling,
- refresh,
- connection state,
- network errors,
- target-temperature updates.

No Redux or Zustand is required.

---

## 12. Local Storage

Use AsyncStorage for:

- Pico IP address,
- auto-connect preference,
- simple app settings,
- alert preferences.

Do not continuously write live sensor readings to AsyncStorage.

Live chart readings remain in memory for the active app session. See [device-api.md](./device-api.md) for the device protocol and chart aggregation.

---

## 13. Error Handling

The app should handle:

- invalid IP address,
- Pico offline,
- phone on a different Wi-Fi network,
- request timeout,
- malformed response,
- failed target-temperature update.

Suggested user-facing states:

```text
Connecting...
Connected
Disconnected
Device Not Found
Request Failed
```

---

## 14. Version 1 Scope

Implement first:

- Connect screen
- Dashboard
- live sensor values
- target-temperature control
- connection state
- APP/stock mode indicator
- polling
- saved Pico IP
- basic settings

---

## 15. Optional Later Features

- sensor history
- graphs
- local notifications
- temperature presets
- air-quality status labels
- reconnect improvements

---

## 16. Out of Scope

Do not add unless required by the research:

- Firebase
- Supabase
- user accounts
- authentication
- cloud database
- Node.js backend
- remote internet control
- Redux
- Zustand
- unnecessary hardware changes
- unnecessary microservices

The goal is to keep FreshShield simple, reliable, local-first, and easy to develop for a research project.
