# Mold Risk Detection

## Overview

FreshShield can estimate **mold growth risk** using the temperature and relative humidity already reported by the hardware.

This feature is an **environmental risk estimator**. It does **not directly detect mold spores, colonies, or species**.

The current hardware provides:

- Temperature
- Relative humidity
- MQ135 raw air-quality value
- Target temperature
- Stock/app mode

For mold-risk estimation, only **temperature**, **relative humidity**, and **duration of exposure** are required.

The mold-risk calculation should run entirely inside the mobile app. No mold-specific POST request or firmware change is required unless the hardware team later decides to move this logic onto the Pico W.

---

## Why Mold Risk Is Calculated in the App

The hardware already exposes:

```json
{
  "temperature": 27.2,
  "humidity": 81.4
}
```

The app can use those values to calculate:

```json
{
  "score": 71,
  "level": "high",
  "favorableForGrowth": true
}
```

Recommended data flow:

```text
Pico W
  ↓
GET /
  ↓
temperature + humidity
  ↓
FreshShield App
  ↓
track exposure duration
  ↓
calculate mold risk
  ↓
display warning / notification
```

This keeps the hardware API simple and allows the mold-risk algorithm to be improved later without reflashing the Pico W.

---

## Important Terminology

The app should use:

> Mold Risk

or:

> Mold Growth Risk

Do **not** use:

> Mold Detected

The DHT22 measures temperature and relative humidity. These measurements can indicate whether environmental conditions are favorable for mold growth, but they do not directly detect mold.

---

## Research Basis

Mold growth does not begin at one universal humidity threshold.

Risk depends on several factors, including:

- Relative humidity
- Surface moisture
- Temperature
- Duration of exposure
- Material type
- Previous moisture history
- Mold species

Useful guidance from building-science and public-health sources includes:

- The U.S. EPA recommends keeping indoor relative humidity below **60%**, ideally around **30–50%**, for moisture and mold prevention.
- The CDC recommends keeping indoor humidity no higher than about **50%** when practical.
- Building-science literature commonly identifies sustained conditions around **70–80% RH and above** as increasingly favorable for mold growth.
- ASHRAE discusses approximately **80% surface relative humidity** as an important mold-control design criterion.
- Some susceptible building materials can support growth at around **75% RH**, while less susceptible materials may require higher humidity.
- Exposure duration matters. A brief humidity spike should not be treated the same as hours or days of persistent dampness.

Because FreshShield measures room air rather than surface moisture, the result should be treated as a **risk estimate**, not a laboratory-grade mold prediction.

---

## Philippine Climate Considerations

FreshShield is intended for use in the Philippines, where high ambient humidity is normal.

PAGASA describes the Philippines as having a **tropical and maritime climate** with generally high relative humidity. According to PAGASA, average monthly relative humidity across the country ranges from approximately **71% in March to 85% in September**.

Source:

https://www.pagasa.dost.gov.ph/information/climate-philippines

This does **not** mean that FreshShield should raise the biological mold-risk thresholds to match outdoor Philippine humidity.

The recommended indoor moisture-control guidance still remains useful:

- **Below 50% RH** — ideal / very low moisture risk when practical
- **50–59% RH** — generally acceptable
- **60–69% RH** — elevated moisture; monitor conditions
- **70–79% RH** — increasingly favorable for mold growth if sustained
- **80% RH and above** — strongly favorable for mold growth if sustained
- **85–90%+ RH** — very high concern when maintained for hours or days

The U.S. EPA recommends keeping indoor RH below **60%**, ideally **30–50%**, when possible. In the Philippines, reaching the ideal range may be more difficult because outdoor air can already be very humid. The application should therefore avoid treating one high reading as immediate evidence of severe mold risk.

Instead, FreshShield should account for **persistence**:

```text
Philippine humid condition

Temperature: 28°C
Humidity: 72%
Duration: 5 minutes
→ Monitor only; do not immediately classify as severe risk

Temperature: 28°C
Humidity: 72%
Duration: 12 hours
→ Risk should progressively increase
```

This is one of the main reasons the FreshShield model uses:

```text
Temperature
     +
Relative Humidity
     +
Exposure Duration
     ↓
Mold Growth Risk
```

rather than:

```text
Humidity >= 70%
     ↓
Mold detected
```

### Why Duration Matters More in the Philippines

A humidity value above 70% can occur frequently in a tropical climate.

If FreshShield generated a severe warning every time room humidity briefly crossed 70%, users could receive too many false or low-value alerts.

The duration component helps distinguish:

```text
Brief tropical humidity spike
```

from:

```text
Persistent damp indoor environment
```

The second condition is much more important for mold-growth risk.

### Indoor vs Outdoor Humidity

PAGASA's 71–85% figures describe the **general atmospheric climate of the Philippines**, not a recommended indoor humidity target.

FreshShield should therefore:

1. Use PAGASA data to explain why high humidity is common locally.
2. Continue using indoor moisture-control guidance for risk interpretation.
3. Increase risk gradually when elevated humidity persists.
4. Avoid changing the core mold-risk model solely because the device is located in the Philippines.
5. Encourage moisture reduction, ventilation, air conditioning, or dehumidification when indoor humidity remains persistently high.

### Recommended FreshShield Interpretation for Philippine Use

| Indoor RH | FreshShield Interpretation |
|---:|---|
| **<50%** | Ideal / very low moisture risk |
| **50–59%** | Good |
| **60–69%** | Elevated — monitor |
| **70–79%** | Mold-favorable if sustained |
| **80–84%** | High risk if sustained |
| **≥85%** | Very high concern if persistent |

These ranges are **application risk categories**, not direct mold measurements.

They should always be interpreted together with:

- Temperature
- Exposure duration
- Signs of condensation
- Damp or wet materials
- Sensor placement

---

## Design Goals

The FreshShield mold-risk model should:

1. Use both temperature and relative humidity.
2. Give humidity the strongest influence.
3. Consider how long favorable conditions persist.
4. Avoid alarming the user because of a brief humidity spike.
5. Produce a simple 0–100 risk score.
6. Convert that score into understandable risk levels.
7. Support configurable warning sensitivity.
8. Continue working without changing the Pico W API.
9. Clearly state that the result is an estimate.

---

## Risk Levels

FreshShield uses five risk levels:

| Score | Level | Meaning |
|---|---|---|
| 0–24 | Low | Conditions are currently unfavorable for mold growth. |
| 25–44 | Elevated | Conditions are becoming more favorable and should be monitored. |
| 45–64 | Moderate | Persistent moisture may support mold growth. |
| 65–79 | High | Conditions are strongly favorable for mold growth. |
| 80–100 | Very High | Prolonged damp conditions indicate very high mold-growth risk. |

These levels are an application-level interpretation and should not be presented as medical or laboratory measurements.

---

## Inputs

The calculation accepts:

```ts
export interface MoldRiskInput {
  temperatureC: number;
  humidity: number;
  exposureMinutes: number;
  sensitivity?: number;
}
```

### `temperatureC`

Current air temperature in degrees Celsius.

Example:

```ts
temperatureC: 27.2
```

### `humidity`

Current relative humidity percentage.

Example:

```ts
humidity: 81.4
```

### `exposureMinutes`

How long conditions have continuously remained favorable for mold growth.

Example:

```ts
exposureMinutes: 240
```

means the environment has remained favorable for approximately four hours.

### `sensitivity`

Optional user-configurable warning sensitivity.

Recommended range:

```text
-10 to +10
```

Meaning:

```text
-10 = less sensitive
  0 = normal
+10 = more sensitive
```

Sensitivity changes when the app warns the user without changing the raw sensor data.

---

# TypeScript Implementation

Recommended file:

```text
services/moldRisk.ts
```

```ts
export type MoldRiskLevel =
  | 'low'
  | 'elevated'
  | 'moderate'
  | 'high'
  | 'very_high';

export interface MoldRiskInput {
  temperatureC: number;
  humidity: number;

  /**
   * Number of minutes conditions have continuously
   * remained favorable for mold growth.
   */
  exposureMinutes: number;

  /**
   * User warning sensitivity.
   *
   * -10 = less sensitive
   *   0 = normal
   * +10 = more sensitive
   */
  sensitivity?: number;
}

export interface MoldRiskResult {
  score: number;
  level: MoldRiskLevel;
  message: string;

  humidityScore: number;
  temperatureScore: number;
  exposureScore: number;

  favorableForGrowth: boolean;
}

/**
 * Estimates environmental mold-growth risk using
 * temperature, relative humidity, and exposure duration.
 *
 * This does NOT detect mold directly.
 */
export function calculateMoldRisk({
  temperatureC,
  humidity,
  exposureMinutes,
  sensitivity = 0,
}: MoldRiskInput): MoldRiskResult {
  const rh = clamp(humidity, 0, 100);
  const temp = temperatureC;
  const minutes = Math.max(0, exposureMinutes);
  const userSensitivity = clamp(sensitivity, -10, 10);

  // -------------------------------------------------
  // 1. HUMIDITY COMPONENT
  // -------------------------------------------------

  let humidityScore: number;

  if (rh < 50) {
    humidityScore = 0;
  } else if (rh < 55) {
    humidityScore = interpolate(rh, 50, 55, 0, 5);
  } else if (rh < 60) {
    humidityScore = interpolate(rh, 55, 60, 5, 15);
  } else if (rh < 65) {
    humidityScore = interpolate(rh, 60, 65, 15, 30);
  } else if (rh < 70) {
    humidityScore = interpolate(rh, 65, 70, 30, 45);
  } else if (rh < 75) {
    humidityScore = interpolate(rh, 70, 75, 45, 60);
  } else if (rh < 80) {
    humidityScore = interpolate(rh, 75, 80, 60, 75);
  } else if (rh < 85) {
    humidityScore = interpolate(rh, 80, 85, 75, 88);
  } else if (rh < 90) {
    humidityScore = interpolate(rh, 85, 90, 88, 95);
  } else {
    humidityScore = interpolate(rh, 90, 100, 95, 100);
  }

  // -------------------------------------------------
  // 2. TEMPERATURE COMPONENT
  // -------------------------------------------------

  let temperatureScore: number;

  if (temp <= 4) {
    temperatureScore = 0;
  } else if (temp < 10) {
    temperatureScore = interpolate(temp, 4, 10, 0, 25);
  } else if (temp < 15) {
    temperatureScore = interpolate(temp, 10, 15, 25, 50);
  } else if (temp < 20) {
    temperatureScore = interpolate(temp, 15, 20, 50, 80);
  } else if (temp <= 30) {
    temperatureScore = 100;
  } else if (temp <= 35) {
    temperatureScore = interpolate(temp, 30, 35, 100, 70);
  } else if (temp <= 40) {
    temperatureScore = interpolate(temp, 35, 40, 70, 20);
  } else {
    temperatureScore = 0;
  }

  // -------------------------------------------------
  // 3. EXPOSURE DURATION COMPONENT
  // -------------------------------------------------

  let exposureScore: number;

  if (minutes < 15) {
    exposureScore = interpolate(minutes, 0, 15, 0, 5);
  } else if (minutes < 60) {
    exposureScore = interpolate(minutes, 15, 60, 5, 15);
  } else if (minutes < 180) {
    exposureScore = interpolate(minutes, 60, 180, 15, 30);
  } else if (minutes < 360) {
    exposureScore = interpolate(minutes, 180, 360, 30, 45);
  } else if (minutes < 720) {
    exposureScore = interpolate(minutes, 360, 720, 45, 60);
  } else if (minutes < 1440) {
    exposureScore = interpolate(minutes, 720, 1440, 60, 75);
  } else if (minutes < 2880) {
    exposureScore = interpolate(minutes, 1440, 2880, 75, 90);
  } else {
    exposureScore = 100;
  }

  // -------------------------------------------------
  // 4. COMBINE COMPONENTS
  // -------------------------------------------------

  let score =
    humidityScore * 0.60 +
    temperatureScore * 0.15 +
    exposureScore * 0.25;

  // Safeguards for relatively dry conditions.
  if (rh < 55) {
    score = Math.min(score, 20);
  }

  if (rh < 60) {
    score = Math.min(score, 30);
  }

  // Escalate persistent very-high-humidity conditions.
  if (rh >= 80 && minutes >= 60) {
    score = Math.max(score, 65);
  }

  if (rh >= 85 && minutes >= 180) {
    score = Math.max(score, 80);
  }

  if (rh >= 90 && minutes >= 360) {
    score = Math.max(score, 90);
  }

  // Apply user warning sensitivity.
  score += userSensitivity;

  score = clamp(score, 0, 100);

  const level = riskLevel(score);

  const favorableForGrowth =
    rh >= 70 &&
    temp > 5 &&
    temp < 40;

  return {
    score: Math.round(score),
    level,
    message: riskMessage(level),
    humidityScore: Math.round(humidityScore),
    temperatureScore: Math.round(temperatureScore),
    exposureScore: Math.round(exposureScore),
    favorableForGrowth,
  };
}

function riskLevel(score: number): MoldRiskLevel {
  if (score < 25) return 'low';
  if (score < 45) return 'elevated';
  if (score < 65) return 'moderate';
  if (score < 80) return 'high';
  return 'very_high';
}

function riskMessage(level: MoldRiskLevel): string {
  switch (level) {
    case 'low':
      return 'Conditions are currently unfavorable for mold growth.';

    case 'elevated':
      return 'Humidity is becoming favorable for mold growth. Monitor conditions.';

    case 'moderate':
      return 'Persistent moisture may support mold growth. Consider reducing humidity.';

    case 'high':
      return 'Conditions are strongly favorable for mold growth. Reduce moisture and inspect damp areas.';

    case 'very_high':
      return 'Prolonged damp conditions indicate a very high mold-growth risk.';
  }
}

function interpolate(
  value: number,
  min: number,
  max: number,
  outputMin: number,
  outputMax: number,
): number {
  if (max === min) return outputMin;

  const ratio = clamp(
    (value - min) / (max - min),
    0,
    1,
  );

  return outputMin + ratio * (outputMax - outputMin);
}

function clamp(
  value: number,
  min: number,
  max: number,
): number {
  return Math.min(max, Math.max(min, value));
}
```

---

# Exposure Tracking

Exposure duration is important.

A humidity reading of 82% for a few seconds should not be treated the same as 82% humidity maintained for many hours.

Recommended file:

```text
services/moldExposure.ts
```

Basic implementation:

```ts
let moldExposureStartedAt: number | null = null;

export function updateMoldExposure(
  humidity: number,
  temperatureC: number,
): number {
  const favorable =
    humidity >= 70 &&
    temperatureC > 5 &&
    temperatureC < 40;

  if (favorable) {
    if (moldExposureStartedAt === null) {
      moldExposureStartedAt = Date.now();
    }

    return (
      Date.now() - moldExposureStartedAt
    ) / 60_000;
  }

  moldExposureStartedAt = null;
  return 0;
}
```

Usage:

```ts
const exposureMinutes = updateMoldExposure(
  status.humidity,
  status.temperature,
);

const moldRisk = calculateMoldRisk({
  temperatureC: status.temperature,
  humidity: status.humidity,
  exposureMinutes,
});
```

---

## Persistent Exposure Tracking

The simple example above loses exposure history when the app closes.

For production, FreshShield should persist:

```ts
interface MoldExposureState {
  startedAt: number | null;
  lastTemperature: number | null;
  lastHumidity: number | null;
}
```

This can be stored with AsyncStorage.

Example key:

```text
freshshield:mold-exposure
```

When the app starts again:

1. Load the stored exposure state.
2. Check the current sensor conditions.
3. Continue the exposure timer if conditions are still favorable.
4. Reset the timer if conditions have returned to safer levels.

---

# Manual Threshold / Sensitivity

## Recommended Approach

Instead of letting the user redefine what humidity scientifically supports mold growth, FreshShield should expose a **warning sensitivity control**.

Example UI:

```text
Mold Alert Sensitivity

Less Sensitive     Normal     More Sensitive
      -10             0             +10
```

Recommended setting:

```ts
interface MoldSettings {
  sensitivity: number;
}
```

Recommended limits:

```ts
const sensitivity = clamp(value, -10, 10);
```

This value is added to the calculated risk score.

Example:

```text
Calculated score: 58
Sensitivity: +5

Final score: 63
```

This allows users to receive warnings earlier without changing the underlying environmental model.

---

## Alternative: Manual Humidity Threshold

If the project specifically requires a manual mold threshold expressed as humidity, use:

```ts
interface MoldSettings {
  warningHumidityThreshold: number;
}
```

Recommended allowed range:

```text
60% to 80%
```

Example:

```ts
const threshold = clamp(
  userThreshold,
  60,
  80,
);
```

This threshold should control when the app begins warning the user.

It should **not replace the entire mold-risk model**.

Example:

```ts
const shouldWarn =
  moldRisk.level === 'high' ||
  moldRisk.level === 'very_high' ||
  humidity >= settings.warningHumidityThreshold;
```

This preserves the temperature and duration calculation while still giving the user a manual threshold.

---

# Suggested FreshShield UI

## Dashboard Card

```text
Mold Risk

HIGH
71 / 100

Humidity: 81%
Exposure: 4 h

Conditions are strongly favorable for mold growth.
```

---

## Low Risk

```text
Mold Risk

LOW
18 / 100

Current conditions are unfavorable for mold growth.
```

---

## Warning Banner

When risk becomes high:

```text
High Mold Risk

Humidity has remained elevated for several hours.
Reduce moisture and inspect damp areas.
```

---

## Settings

Recommended:

```text
Mold Monitoring

Alert Sensitivity
[ Less ]────●────[ More ]

Notifications
[ ON ]

High Risk Alerts
[ ON ]
```

Alternative if a percentage threshold is required:

```text
Mold Monitoring

Warning Humidity Threshold
[ - ] 70% [ + ]

High Risk Alerts
[ ON ]
```

---

# Notifications

FreshShield should avoid sending repeated notifications every sensor refresh.

Recommended notification behavior:

```text
Low → Moderate
No critical notification

Moderate → High
Send warning

High → Very High
Send stronger warning

High → High
Do not repeatedly notify

Very High → Very High
Do not repeatedly notify
```

A cooldown can also be used.

Example:

```ts
const MOLD_NOTIFICATION_COOLDOWN_MS =
  60 * 60 * 1000;
```

This allows at most one repeated warning per hour unless the risk level increases.

---

# Example Calculations

## Example 1 — Normal Room

```text
Temperature: 25°C
Humidity: 48%
Exposure: 0 minutes
```

Expected result:

```text
Risk: Low
```

Reason:

Humidity is below the range generally associated with persistent mold-growth risk.

---

## Example 2 — Brief Humidity Spike

```text
Temperature: 27°C
Humidity: 82%
Exposure: 5 minutes
```

Expected result:

```text
Risk: Elevated to Moderate
```

The humidity is high, but the duration is short.

FreshShield should monitor rather than immediately claim severe risk.

---

## Example 3 — Persistent Damp Conditions

```text
Temperature: 27°C
Humidity: 82%
Exposure: 4 hours
```

Expected result:

```text
Risk: High
```

The combination of warm temperature, high humidity, and prolonged exposure creates favorable conditions for mold growth.

---

## Example 4 — Severe Persistent Dampness

```text
Temperature: 26°C
Humidity: 91%
Exposure: 8 hours
```

Expected result:

```text
Risk: Very High
```

This should trigger a strong warning.

---

# Integration With Existing Pico Data

The current hardware API can remain unchanged.

Example hardware response:

```json
{
  "status": "ok",
  "temperature": 27.2,
  "humidity": 81.4,
  "gas_level_raw": 12120,
  "target_temp": 25.0,
  "is_stock_mode": false
}
```

FreshShield derives additional local state:

```json
{
  "mold_score": 71,
  "mold_risk": "high",
  "mold_exposure_minutes": 240
}
```

These fields do not need to be returned by the Pico W.

---

# Recommended App Architecture

```text
Pico W
│
│ GET /
│
▼
services/pico.ts
│
│ temperature
│ humidity
│
▼
services/moldExposure.ts
│
│ exposureMinutes
│
▼
services/moldRisk.ts
│
│ score
│ level
│ message
│
▼
useFreshShield / application state
│
├── Dashboard Mold Risk Card
├── Warning Banner
├── Notifications
└── Settings / Sensitivity
```

---

# API Requirements

No additional mold endpoint is required.

Existing:

```text
GET /
```

is enough as long as the response contains:

```json
{
  "temperature": 25.0,
  "humidity": 60.0
}
```

No endpoint such as:

```text
POST /set_mold_threshold
```

is necessary if the threshold only changes FreshShield's warnings.

The setting should remain local to the app.

---

# Recommended Local Settings

```ts
export interface MoldSettings {
  enabled: boolean;
  sensitivity: number;
  notificationsEnabled: boolean;
}
```

Example:

```ts
const DEFAULT_MOLD_SETTINGS: MoldSettings = {
  enabled: true,
  sensitivity: 0,
  notificationsEnabled: true,
};
```

If the project requires a percentage threshold:

```ts
export interface MoldSettings {
  enabled: boolean;
  warningHumidityThreshold: number;
  notificationsEnabled: boolean;
}

const DEFAULT_MOLD_SETTINGS: MoldSettings = {
  enabled: true,
  warningHumidityThreshold: 70,
  notificationsEnabled: true,
};
```

---

# Validation

Always validate sensor values before calculating risk.

Example:

```ts
export function isValidEnvironmentReading(
  temperatureC: number,
  humidity: number,
): boolean {
  return (
    Number.isFinite(temperatureC) &&
    Number.isFinite(humidity) &&
    temperatureC >= -40 &&
    temperatureC <= 80 &&
    humidity >= 0 &&
    humidity <= 100
  );
}
```

If the reading is invalid:

```text
Mold Risk
Unavailable

Waiting for valid environmental sensor data.
```

Do not display a fake risk score.

---

# Limitations

## Air RH Is Not Surface RH

FreshShield receives room-air relative humidity.

Actual mold commonly develops on:

- Walls
- Ceilings
- Wood
- Fabric
- Insulation
- Cold surfaces
- Areas around condensation

The surface may have significantly higher relative humidity than the surrounding room air.

Because of this, FreshShield may underestimate risk near cold or damp surfaces.

---

## Material Type Is Unknown

Different materials have different mold susceptibility.

For example:

- Paper
- Wood
- Gypsum board
- Fabric

may behave differently from:

- Glass
- Metal
- Plastic

FreshShield currently does not know what material is present near the sensor.

---

## No Direct Mold Sensor

The system does not measure:

- Mold spores
- Colony growth
- Mold species
- Mycotoxins

Therefore:

```text
Mold Risk: High
```

means:

> Environmental conditions are strongly favorable for mold growth.

It does not mean:

> Mold has been physically detected.

---

## Sensor Placement Matters

A sensor located in the center of a room may not represent conditions:

- Behind furniture
- Inside cabinets
- Near windows
- On cold exterior walls
- Near plumbing
- Under sinks
- Inside wall cavities

Users should inspect damp areas when FreshShield reports persistent high risk.

---

# Future Improvements

Possible future improvements include:

## Dew Point

Calculate dew point to identify condensation risk.

## Surface Temperature Sensor

Adding a surface-temperature sensor would allow FreshShield to estimate surface relative humidity more accurately.

## Historical Risk

Store mold-risk scores over time and display:

```text
Last 24 Hours
Last 7 Days
Last 30 Days
```

## Humidity Recovery

Instead of immediately resetting exposure to zero when humidity drops slightly, gradually reduce accumulated exposure.

## Material Profiles

Future versions could support:

```text
General
Wood
Paper / Cardboard
Fabric
Drywall
```

Each material profile could use different susceptibility parameters.

## Full VTT-Style Model

A future research-focused implementation could evaluate a validated VTT mold-growth model.

This would require more detailed assumptions about:

- Material sensitivity
- Surface temperature
- Moisture history
- Exposure duration

The current FreshShield model intentionally remains simpler and suitable for a consumer monitoring application.

---

# Research References

## Philippine Atmospheric, Geophysical and Astronomical Services Administration (PAGASA)

**Climate of the Philippines**

PAGASA describes the Philippines as having high relative humidity because of its warm temperatures and surrounding bodies of water. Average monthly relative humidity ranges from approximately 71% in March to 85% in September.

https://www.pagasa.dost.gov.ph/information/climate-philippines

---

## U.S. Environmental Protection Agency

**Mold Course Chapter 9 / A Brief Guide to Mold, Moisture and Your Home**

EPA recommends maintaining indoor relative humidity below 60%, ideally between 30% and 50%, as part of mold and moisture control.

https://www.epa.gov/mold/mold-course-chapter-9

https://www.epa.gov/mold/brief-guide-mold-moisture-and-your-home

---

## Centers for Disease Control and Prevention

**About Mold**

CDC recommends controlling indoor humidity and keeping it no higher than about 50% when practical.

https://www.cdc.gov/mold-health/about/index.html

---

## ASHRAE Handbook

ASHRAE building-science guidance discusses surface relative humidity and moisture-duration conditions associated with mold growth.

https://handbook.ashrae.org/

---

## Building and Environment — Mold Prediction Research

Research literature on indoor mold prediction evaluates the importance of relative humidity, temperature, material properties, and exposure duration.

https://www.sciencedirect.com/science/article/pii/S0360132321009756

---

## Mold Prediction Model Comparison

Research comparing mold-growth models demonstrates that different prediction models can produce different results and that no single universal relative-humidity threshold applies to every material and condition.

https://www.sciencedirect.com/science/article/pii/S0360132311003830

---

# Final Recommendation

FreshShield should calculate mold risk locally using:

```text
Relative Humidity
      +
Temperature
      +
Exposure Duration
      ↓
Mold Risk Score
      ↓
Low / Elevated / Moderate / High / Very High
```

Recommended responsibilities:

```text
Hardware:
- Measure temperature
- Measure humidity
- Send readings to the app

FreshShield App:
- Track exposure duration
- Calculate mold risk
- Store sensitivity setting
- Display mold-risk level
- Warn the user
- Send notifications
```

No mold-specific POST request is necessary unless a future version requires the hardware itself to react to mold-risk settings.

---

## Disclaimer

FreshShield's mold-risk feature is an environmental monitoring aid.

It should not be represented as a certified mold detector, medical device, laboratory measurement, or substitute for professional inspection.
