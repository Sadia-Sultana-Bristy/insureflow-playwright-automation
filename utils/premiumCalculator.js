const { pricingRules } = require('../test-data/quotes.json');

const round2 = (value) => Math.round(value * 100) / 100;

/**
 * Independent implementation of the underwriting pricing rules (test oracle).
 * Tests compare the UI's premium against this calculation instead of hard-coding magic numbers.
 */
function calculateAnnualPremium({ productType, tier, coverage }) {
  const rate = pricingRules.rates[productType];
  const multiplier = pricingRules.tierMultipliers[tier];
  if (rate === undefined) throw new Error(`Unknown product type: ${productType}`);
  if (multiplier === undefined) throw new Error(`Unknown coverage tier: ${tier}`);
  return Math.max(pricingRules.minimumPremium, round2(coverage * rate * multiplier));
}

function calculateMonthlyPremium(annualPremium) {
  return round2(annualPremium / 12);
}

module.exports = { calculateAnnualPremium, calculateMonthlyPremium };
