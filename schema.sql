CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    half_life_hours NUMERIC(3, 1) DEFAULT 5.0,
    daily_caffeine_target_mg NUMERIC(6, 2) DEFAULT 200.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE daily_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    sleep_hours NUMERIC(3, 1) NOT NULL,
    fatigue_score SMALLINT CHECK (fatigue_score BETWEEN 1 AND 5),
    caffeine_budget_modifier NUMERIC(3, 2) DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, check_in_date)
);

CREATE TABLE intake_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    volume_tbsp_fraction NUMERIC(4, 2) NOT NULL,
    water_ratio_percent NUMERIC(5, 2) NOT NULL,
    estimated_caffeine_mg NUMERIC(6, 2) NOT NULL,
    work_intensity VARCHAR(32) CHECK (work_intensity IN ('low_load', 'medium_load', 'high_stakes')),
    ui_mode VARCHAR(16) CHECK (ui_mode IN ('easy', 'hard')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_intake_logs_user_timestamp ON intake_logs (user_id, timestamp DESC);
CREATE INDEX idx_daily_checkins_user_date ON daily_checkins (user_id, check_in_date DESC);