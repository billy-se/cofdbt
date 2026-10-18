import express, {Request, Response} from 'express';
import dotenv from 'dotenv';
import { connectDB, query } from './db';
import { calculateInitialCaffeine, calculateCaffeineDecay, calculateFatigueDebtIndex, generateTaperingPlan } from './utils/caffeineMath';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'cofdbt-backend' });
});

app.post('/api/logs', async (req: Request, res: Response) => {
  try {
    const { user_id, volume_tbsp_fraction, water_ratio_percent, work_intensity, ui_mode } = req.body;

    if (!user_id || volume_tbsp_fraction === undefined) {
      return res.status(400).json({ error: 'Missing required fields: user_id and volume_tbsp_fraction are required.' });
    }

    const waterRatio = water_ratio_percent || 100.0;

    const estimated_caffeine_mg = calculateInitialCaffeine(volume_tbsp_fraction, waterRatio);

    const sql = `
      INSERT INTO intake_logs (user_id, volume_tbsp_fraction, water_ratio_percent, estimated_caffeine_mg, work_intensity, ui_mode)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    
    const params = [
      user_id,
      volume_tbsp_fraction,
      water_ratio_percent || 100.0,
      estimated_caffeine_mg,
      work_intensity || 'medium_load',
      ui_mode || 'easy'
    ];

    const result = await query(sql, params);

    return res.status(201).json({
      message: 'Coffee intake logged successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error saving coffee log:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/caffeine/active/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const userResult = await query('SELECT half_life_hours FROM users WHERE id = $1', [userId]);
    const halfLifeHours = userResult.rows.length > 0 ? parseFloat(userResult.rows[0].half_life_hours) : 5.0;

    const logsQuery = `
      SELECT timestamp, estimated_caffeine_mg 
      FROM intake_logs 
      WHERE user_id = $1 AND timestamp >= NOW() - INTERVAL '24 hours'
      ORDER BY timestamp ASC;
    `;
    const logsResult = await query(logsQuery, [userId]);

    const now = new Date().getTime();
    let totalActiveCaffeineMg = 0;
    const breakdown = [];

    for (const log of logsResult.rows) {
      const logTime = new Date(log.timestamp).getTime();
      const hoursElapsed = (now - logTime) / (1000 * 60 * 60);

      if (hoursElapsed >= 0) {
        const remainingMg = calculateCaffeineDecay(parseFloat(log.estimated_caffeine_mg), hoursElapsed, halfLifeHours);
        
        totalActiveCaffeineMg += remainingMg;
        breakdown.push({
          logged_at: log.timestamp,
          initial_mg: parseFloat(log.estimated_caffeine_mg),
          hours_elapsed: Math.round(hoursElapsed * 100) / 100,
          active_mg: remainingMg
        });
      }
    }

    totalActiveCaffeineMg = Math.round(totalActiveCaffeineMg * 100) / 100;

    return res.status(200).json({
      user_id: userId,
      current_active_caffeine_mg: totalActiveCaffeineMg,
      half_life_used_hours: halfLifeHours,
      active_logs_count: breakdown.length,
      breakdown
    });

  } catch (error) {
    console.error('Error calculating active caffeine:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/checkins', async (req: Request, res: Response) => {
  try {
    const { user_id, check_in_date, sleep_hours, fatigue_score } = req.body;

    if (!user_id || sleep_hours === undefined || fatigue_score === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: user_id, sleep_hours, and fatigue_score are required.' 
      });
    }

    if (fatigue_score < 1 || fatigue_score > 5) {
      return res.status(400).json({ error: 'fatigue_score must be between 1 and 5.' });
    }

    const targetDate = check_in_date || new Date().toISOString().split('T')[0];

    let budgetModifier = 1.0;
    if (sleep_hours < 5.0) {
      budgetModifier = 0.70;
    } else if (sleep_hours >= 5.0 && sleep_hours < 7.0) {
      budgetModifier = 0.85;
    } else {
      budgetModifier = 1.00;
    }

    const sql = `
      INSERT INTO daily_checkins (user_id, check_in_date, sleep_hours, fatigue_score, caffeine_budget_modifier)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, check_in_date)
      DO UPDATE SET 
        sleep_hours = EXCLUDED.sleep_hours,
        fatigue_score = EXCLUDED.fatigue_score,
        caffeine_budget_modifier = EXCLUDED.caffeine_budget_modifier
      RETURNING *;
    `;

    const params = [user_id, targetDate, sleep_hours, fatigue_score, budgetModifier];
    const result = await query(sql, params);

    return res.status(201).json({
      message: 'Daily sleep and fatigue check-in recorded successfully',
      data: result.rows[0],
      advisory: budgetModifier < 1.0 
        ? 'Low sleep detected. Caffeine budget has been automatically reduced today to prevent burnout.' 
        : 'Sleep levels optimal. Standard caffeine budget active.'
    });

  } catch (error) {
    console.error('Error saving check-in:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/fdi/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const logsQuery = `
      SELECT estimated_caffeine_mg, timestamp 
      FROM intake_logs 
      WHERE user_id = $1 AND timestamp >= NOW() - INTERVAL '7 days';
    `;
    const logsResult = await query(logsQuery, [userId]);

    const checkinsQuery = `
      SELECT sleep_hours, fatigue_score, check_in_date 
      FROM daily_checkins 
      WHERE user_id = $1 AND check_in_date >= CURRENT_DATE - INTERVAL '7 days';
    `;
    const checkinsResult = await query(checkinsQuery, [userId]);

    const { fdiScore, riskTier } = calculateFatigueDebtIndex(logsResult.rows, checkinsResult.rows);

    let recommendation = 'Maintain current pacing. Rest and sleep levels are aligned with intake.';
    if (riskTier === 'MODERATE') {
      recommendation = 'Moderate tiredness debt detected. Consider lowering afternoon coffee volume tomorrow.';
    } else if (riskTier === 'HIGH') {
      recommendation = 'High burnout risk! Accumulated sleep deficit and heavy caffeine reliance. Recommended: initiate a 25% step-down tapering protocol.';
    } else if (riskTier === 'CRITICAL') {
      recommendation = 'CRITICAL FATIGUE DEBT. Immediate caffeine reset required. High probability of cognitive crash and severe tolerance lock.';
    }

    return res.status(200).json({
      user_id: userId,
      window_days: 7,
      fatigue_debt_index: fdiScore,
      risk_tier: riskTier,
      metrics_summary: {
        total_logs_analyzed: logsResult.rows.length,
        total_checkins_analyzed: checkinsResult.rows.length,
      },
      recommendation
    });

  } catch (error) {
    console.error('Error calculating FDI:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/tapering/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const logsQuery = `
      SELECT estimated_caffeine_mg, timestamp 
      FROM intake_logs 
      WHERE user_id = $1 AND timestamp >= NOW() - INTERVAL '7 days';
    `;
    const logsResult = await query(logsQuery, [userId]);

    const checkinsQuery = `
      SELECT sleep_hours, fatigue_score, check_in_date 
      FROM daily_checkins 
      WHERE user_id = $1 AND check_in_date >= CURRENT_DATE - INTERVAL '7 days';
    `;
    const checkinsResult = await query(checkinsQuery, [userId]);

    const { riskTier } = calculateFatigueDebtIndex(logsResult.rows, checkinsResult.rows);

    const totalMg = logsResult.rows.reduce((sum, log) => sum + Number(log.estimated_caffeine_mg), 0);
    const avgDailyMg = logsResult.rows.length > 0 ? totalMg / 7 : 150.0;

    const taperPlan = generateTaperingPlan(avgDailyMg, riskTier);

    return res.status(200).json({
      user_id: userId,
      current_risk_tier: riskTier,
      current_estimated_daily_avg_mg: Math.round(avgDailyMg),
      tapering_schedule: taperPlan
    });

  } catch (error) {
    console.error('Error generating tapering plan:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`cofdbt backend running on port ${PORT}`);
  });
};

startServer();