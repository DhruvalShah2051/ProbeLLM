// src/utils/metrics.js

export function calculateMetrics(attacks = []) {
  if (!Array.isArray(attacks) || attacks.length === 0) {
    return {
      totalAttacks: 0,
      success: 0,
      failed: 0,
      successRate: 0,
      failureRate: 0,
    };
  }

  const totalAttacks = attacks.length;

  const success = attacks.filter(a => a.success === true || a.success === "success").length;
  const failed = attacks.filter(a => a.success === false || a.success === "fail").length;

  const successRate = ((success / totalAttacks) * 100).toFixed(2);
  const failureRate = ((failed / totalAttacks) * 100).toFixed(2);

  return {
    totalAttacks,
    success,
    failed,
    successRate,
    failureRate,
  };
}