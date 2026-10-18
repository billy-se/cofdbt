# cofdbt

> **cofdbt** is a scalable, time-series backend system and web application that tracks ground coffee volume, models biological caffeine decay ($t_{1/2}$), factors in sleep hours and work load, and calculates fatigue debt to automate tolerance tapering and prevent developer burnout.

---

## Problem Statement
During intense cognitive work, engineers often rely on caffeine to sustain focus. However, caffeine does not generate energy; it blocks adenosine receptors (the brain's built-in tiredness alarms), effectively borrowing energy from the future.

Continuous over-consumption builds up **"tiredness debt"** (an accumulated adenosine backlog masked by caffeine). When combined with poor sleep, tolerance spikes, forcing higher intake. When tolerance peaks, cognitive stamina collapses—making even reading simple code an exhausting task. 

**cofdbt** quantifies this debt using real-time decay models, sleep quality inputs, and workload context to automate tapering and keep developers at peak performance without burnout.

---

## User Experience and Core Features

### 1. Adaptive Onboarding and UX Modes
- **Easy UI (Default):** Designed for quick daily use without precision tools. Intake is logged using tablespoon fractions (25%, 50%, 75%, 100%, 150%+) and a water concentration percentage slider (e.g., 20% water for strong espresso-like brews).
- **Hard UI (Pro Mode):** Designed for precision tracking using exact bean mass in grams ($g$), extraction yield, liquid volume in milliliters ($ml$), and custom biological half-life settings.
- **User Personas:** Tailors recommendations based on whether the user is a casual coffee drinker, an active knowledge worker, a heavy consumer facing burnout, or someone in active caffeine withdrawal.

### 2. Workload and Sleep-Aware Balancing
- **Sleep Integration:** Sleep is the only process that clears adenosine backlog. The system prompts for nightly sleep hours and dynamically caps caffeine budgets on low-sleep days.
- **Work Intensity Context:** Users categorize their day into Low Load (administrative), Medium Load (regular coding), or High Stakes (crunch mode/debugging). The system dynamically adjusts daily budgets and enforces lower intake on subsequent rest days to pay off tiredness debt.
- **Coffee Bag Inventory Tracking:** Tracks bag size (e.g., 200g) and calculates estimated depletion dates based on daily tablespoon usage.

### 3. Visual Analytics and Alerts
- **Progress Calendar & Heatmap:** Displays green, yellow, and red risk days based on accumulated fatigue debt and late-day caffeine cutoff times.
- **Proactive Notifications:** Alerts users when late-afternoon consumption threatens nighttime sleep quality or when consecutive heavy days require a tapering intervention.

---

## System Architecture & Scalability

Designed to handle high throughput, multi-user logging, and time-series decay calculations across daily coffee events.

```text
                  +-----------------------------------+
                  |        Frontend Client            |
                  |  (Easy UI / Hard UI / Dashboard)  |
                  +-----------------+-----------------+
                                    |
                                    v REST / gRPC
                  +-----------------+-----------------+
                  |          API Gateway              |
                  |     (Rate Limiting & Auth)        |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------+-----------------+
                  |        cofdbt Core Service        |
                  |  - Intake & Volume Conversion     |
                  |  - Sleep & Workload Logic Engine  |
                  |  - Tapering Schedule Generator    |
                  +--------+----------------+---------+
                           |                |
                           v                v
             +-------------+--+          +--+-------------+
             | Redis Cache    |          | PostgreSQL /   |
             | (Active Blood  |          | TimescaleDB    |
             |  Caffeine)     |          | (User Logs)    |
             +----------------+          +----------------+
```
### Key Engineering Decisions:
1. **Time-Series Storage:** Coffee intake, sleep hours, and self-reported fatigue scores are time-series events indexed for range queries and trend analysis.
2. **In-Memory Active Decay Cache:** Active caffeine levels for live user dashboards are calculated and cached in Redis with TTLs to prevent database recalculations on every request.
3. **Stateless Logic Engine:** Mathematical decay and fatigue index formulas are pure functions, allowing horizontal scaling behind load balancers.

---

## Mathematical Model

### 1. Caffeine Metabolic Decay
Active blood-caffeine levels $C(t)$ in milligrams ($mg$) at time $t$ (hours elapsed since consumption):

$$C(t) = C_0 \cdot \left(\frac{1}{2}\right)^{\frac{t}{t_{1/2}}}$$

Where:
- $C_0$ = Initial caffeine dose ($mg$), derived from ground coffee volume (tablespoons or grams).
- $t_{1/2}$ = Biological half-life of caffeine ($\approx 5.0$ hours default, configurable per user).
- $t$ = Elapsed time in hours ($t \ge 0$).

### 2. Fatigue Debt Index (FDI)
The Fatigue Debt Index measures cumulative adenosine backlog by correlating active caffeine level, self-reported fatigue $F \in [1, 5]$, and sleep deficit $S_{\text{deficit}}$ over a rolling 7-day window $W$:

$$\text{FDI} = \frac{\sum_{i \in W} (\text{Dose}_i \cdot F_i) + (S_{\text{baseline}} - S_i)}{\text{Baseline Threshold}}$$

When $\text{FDI}$ exceeds safety thresholds, the engine triggers an automated tapering schedule.

---

## Data Model Schemas

### Coffee Intake Event Schema (`json`) / will change later if possible
```json
{
  "id": "evt_8f3a91bc",
  "user_id": "usr_109283",
  "timestamp": "2026-10-17T14:30:00Z",
  "volume_tbsp_fraction": 1.0,
  "water_ratio_percent": 20.0,
  "estimated_caffeine_mg": 75.0,
  "work_intensity": "high_stakes",
  "ui_mode": "easy"
}
```
### Daily Sleep and Check-In Schema (`json`) / also this will change later
```json
{
  "id": "chk_9921ab",
  "user_id": "usr_109283",
  "date": "2026-10-17",
  "sleep_hours": 5.5,
  "fatigue_score": 4,
  "caffeine_budget_modifier": 0.75
}
```
## API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/api/logs` | Log a new coffee intake event (tbsp fraction, water ratio, work load). |
| **GET** | `/api/caffeine/active/:userId` | Calculate real-time active blood-caffeine levels using half-life decay. |
| **POST** | `/api/checkins` | Record daily sleep hours and fatigue score to update budget modifiers. |
| **GET** | `/api/fdi/:userId` | Calculate 7-day Fatigue Debt Index and Burnout Risk Tier. |
| **GET** | `/api/tapering/:userId` | Generate an automated 4-week step-down tapering schedule. |

## Roadmap

### Phase 1: Core Engine & Data Structures
- [x] Implement tablespoon fraction to estimated caffeine ($mg$) conversion functions.
- [x] Implement pure functions for exponential caffeine decay $C(t)$ and sleep-adjusted FDI calculations.
- [x] Write unit test suite for core calculations.

### Phase 2: Backend API & Data Persistence
- [x] Build REST API endpoints for user authentication, intake logging, and daily sleep check-ins.
- [x] Implement database schema optimized for time-series range queries.
- [ ] Integrate Redis caching for active caffeine levels.

### Phase 3: Adaptive Logic & Tapering Generator
- [x] Implement automated tapering step-down generator.
- [ ] Build notification trigger logic for late-day caffeine cutoffs and sleep deficit warnings.
- [ ] Add coffee bag weight tracking and depletion estimation.

### Phase 4: Frontend UI
- [ ] Build Easy UI mode with tablespoon sliders and water concentration controls.
- [ ] Build Hard UI mode for precise gram and milliliter inputs.
- [ ] Implement interactive decay charts and risk calendar heatmaps.
