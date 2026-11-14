const { daysFromToday } = require('./dateUtils');

const pick = (items) => items[Math.floor(Math.random() * items.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const uniqueSuffix = () => `${Date.now().toString(36)}${randomInt(100, 999)}`;

const VEHICLES = ['Toyota Camry', 'Honda Accord', 'Mazda CX-5', 'Hyundai Tucson', 'Ford Ranger'];

/**
 * Builds valid quote input. Override any field to create edge-case or negative data.
 * A unique insured item makes the created policy easy to find in later steps.
 */
function buildQuote(overrides = {}) {
  return {
    productType: 'auto',
    tier: 'standard',
    insuredItem: `${randomInt(2018, 2025)} ${pick(VEHICLES)} #${uniqueSuffix()}`,
    coverage: randomInt(10, 60) * 1000,
    startDate: daysFromToday(0),
    ...overrides,
  };
}

/** Builds a valid claim for the given policy. */
function buildClaim(overrides = {}) {
  return {
    policyNumber: undefined,
    incidentType: 'Collision',
    incidentDate: daysFromToday(0),
    amount: randomInt(5, 40) * 100,
    description: `Vehicle was hit while parked in a shopping mall car park. Ref ${uniqueSuffix()}.`,
    ...overrides,
  };
}

module.exports = { buildQuote, buildClaim, uniqueSuffix };
