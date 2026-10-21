export const calculateInitialCaffeine = (tbspFraction: number, waterRatioPercent: number = 100): number => {
  const BASE_MG_PER_TBSPOON = 120.0; //anticipating baseline mg
  
  let concentrationMultiplier = 1.0;
  if (waterRatioPercent < 50) {
    concentrationMultiplier = 1.15;
  }

  const calculatedMg = tbspFraction * BASE_MG_PER_TBSPOON * concentrationMultiplier;
  
  return Math.round(calculatedMg * 100) / 100;
};

export const calculateCaffeineDecay = (
  initialDoseMg: number, 
  hoursElapsed: number, 
  halfLifeHours: number = 5.0
): number => {
  if (hoursElapsed <= 0) return initialDoseMg;
  if (initialDoseMg <= 0) return 0;

  const remainingCaffeine = initialDoseMg * Math.pow(0.5, hoursElapsed / halfLifeHours);
  
  return Math.round(remainingCaffeine * 100) / 100;
};

export const calculateFatigueDebtIndex = (
  weeklyLogs: { estimated_caffeine_mg: number; timestamp: string }[],
  weeklyCheckins: { sleep_hours: number; fatigue_score: number; check_in_date: string }[]
): { fdiScore: number; riskTier: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' } => {
  const BASELINE_SLEEP_HOURS = 7.5;
  const daysCount = Math.max(weeklyCheckins.length, 1);
  
  const totalCaffeineMg = weeklyLogs.reduce((sum, log) => sum + Number(log.estimated_caffeine_mg), 0);
  const avgDailyCaffeine = totalCaffeineMg / daysCount;

  const avgFatigue = weeklyCheckins.length > 0
    ? weeklyCheckins.reduce((sum, chk) => sum + Number(chk.fatigue_score), 0) / weeklyCheckins.length
    : 3.0;

  const totalSleepDeficit = weeklyCheckins.reduce((sum, chk) => {
    const deficit = BASELINE_SLEEP_HOURS - Number(chk.sleep_hours);
    return sum + (deficit > 0 ? deficit : 0);
  }, 0);
  const avgDailySleepDeficit = totalSleepDeficit / daysCount;

  const fatigueMultiplier = 0.5 + (avgFatigue / 5.0) * 1.5;
  const rawFdi = (avgDailyCaffeine * 0.08) * fatigueMultiplier + (avgDailySleepDeficit * 12);
  
  const fdiScore = Math.round(rawFdi * 100) / 100;

  let riskTier: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (fdiScore > 85) {
    riskTier = 'CRITICAL';
  } else if (fdiScore > 60) {
    riskTier = 'HIGH';
  } else if (fdiScore > 35) {
    riskTier = 'MODERATE';
  } else {
    riskTier = 'LOW';
  }

  return { fdiScore, riskTier };
};

export const generateTaperingPlan = (
  currentAvgDailyMg: number,
  riskTier: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
): { week: number; targetMaxDailyMg: number; targetTbspFraction: number; guidance: string }[] => {
  if (currentAvgDailyMg <= 50) {
    return [{
      week: 1,
      targetMaxDailyMg: currentAvgDailyMg,
      targetTbspFraction: 0.5,
      guidance: 'Intake is already at a healthy baseline. Maintain current habits.'
    }];
  }

  let weeklyReductionPercent = 0.15;
  if (riskTier === 'CRITICAL' || riskTier === 'HIGH') {
    weeklyReductionPercent = 0.20;
  }

  const plan = [];
  let currentTarget = currentAvgDailyMg;
  const totalWeeks = 4;

  for (let week = 1; week <= totalWeeks; week++) {
    currentTarget = currentTarget * (1 - weeklyReductionPercent);
    if (currentTarget < 30) currentTarget = 30;

    const targetTbsp = Math.round((currentTarget / 75.0) * 100) / 100;
    
    let guidance = `Week ${week}: Step down intake to manage tolerance backlog.`;
    if (week === 1) guidance = 'Phase 1 stabilization: Cut out late-afternoon extra cups. Focus on morning dose only.';
    if (week === 2) guidance = 'Phase 2 reduction: Reduce morning dose by shortening brew time or using fraction steps.';
    if (week === 3) guidance = 'Phase 3 stabilization: Allow adenosine receptors to upregulate. Expect mild grogginess fading by day 4.';
    if (week === 4) guidance = 'Phase 4 target lock: Establish new baseline maintenance budget.';

    plan.push({
      week,
      targetMaxDailyMg: Math.round(currentTarget),
      targetTbspFraction: targetTbsp,
      guidance
    });
  }

  return plan;
};