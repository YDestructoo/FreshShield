# FreshShield Mobile App

FreshShield is a local-first Expo mobile app for monitoring and setting the cooling target of a Raspberry Pi Pico W. It has no cloud service, account system, or remote database.

## Architecture

```text
Expo / React Native app
  ├─ Dashboard: current readings, target control, session charts
  ├─ Settings: Pico W address
  ├─ AsyncStorage: saved address only
  └─ HTTP + JSON over local Wi-Fi
              │
              ▼
Raspberry Pi Pico W
  ├─ Sensors: DHT22 and MQ135
  ├─ Control: BTS7960 and Peltier
  ├─ GET /
  └─ POST /set_target
```

The Pico W owns all hardware control and fallback behavior. The app only presents readings and sends the target temperature; it never drives the Peltier directly.

## App behavior

- The device address is entered in **Settings** and saved locally after a successful connection.
- A shared `FreshShieldProvider` keeps one device state for the Dashboard and Settings tabs.
- While an address is configured, the app fetches device status immediately and then every 2 seconds.
- A failed request marks the device disconnected and shows an error. Requests time out after 5 seconds.
- Applying a target sends it to the Pico W and displays the status returned by the Pico as the source of truth.
- `EXPO_PUBLIC_DEMO_MODE=true` uses a simulated local device for development. Set it to `false` to use hardware, then restart Expo.

## Screens

### Dashboard

- Connection state and last-update time
- Current temperature and difference from the target
- Target-temperature controls
- Humidity (5-minute session average), raw gas reading, and current target
- Interactive temperature timeline using 15-minute session averages

Chart readings stay in memory and are discarded when the app restarts.

### Settings

- Pico W address input (`host` or `host:port`)
- Save-and-reconnect action
- Local-network-only notice

## Code layout

```text
app/
  _layout.tsx       # shared provider and native tabs
  dashboard.tsx     # monitoring and charts
  settings.tsx      # device connection
components/         # reusable dashboard UI
hooks/useFreshShield.ts  # connection, polling, and device state
services/pico.ts    # HTTP requests and response validation
storage/settings.ts # saved Pico address
constants/config.ts # polling and timeout values
docs/device-api.md  # Pico W protocol
```

## Device contract

The Pico W must be reachable on the phone's local network and implement the protocol in [device-api.md](./device-api.md). Both endpoints return the complete current status object. Browser testing may require Pico-side CORS headers; native Android and iOS requests do not.

## Out of scope

Cloud synchronization, authentication, remote control, persistent sensor history, notifications, Redux, Zustand, and a separate backend are not part of this app.
