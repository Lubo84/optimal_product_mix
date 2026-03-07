export interface ILAInputs {
    purchasePrice: number;
    purchaseAge: number;
    hurdleRate: number; // e.g. 0.035 for 3.5%
    guaranteePeriod: number; // 0, 5, 10, 15, 20
    gender: 'Male' | 'Female'; // Usually input, but assumed Male/Female adjusting
    participationFactor?: number; // Default 1.0
}

// Indicative Starting Income Rates (% of purchase price)
// Rows: Age at Purchase
// Cols: Hurdle Rate (0%, 2%, 3.5%, 5%)
const STARTING_INCOME_RATES = {
    60: { 0.0: 0.065, 0.02: 0.055, 0.035: 0.048, 0.05: 0.040 },
    65: { 0.0: 0.075, 0.02: 0.063, 0.035: 0.055, 0.05: 0.046 },
    67: { 0.0: 0.080, 0.02: 0.068, 0.035: 0.059, 0.05: 0.050 },
    70: { 0.0: 0.090, 0.02: 0.075, 0.035: 0.065, 0.05: 0.055 },
    75: { 0.0: 0.105, 0.02: 0.090, 0.035: 0.078, 0.05: 0.065 }
};

// Simple interpolator for hurdle rates between predefined buckets
function interpolateStartingRate(age: number, hurdleRate: number): number {
    // Find closest age bucket (round down)
    const ages = Object.keys(STARTING_INCOME_RATES).map(Number).sort((a, b) => a - b);
    let closestAge = ages[0];
    for (const a of ages) {
        if (a <= age) closestAge = a;
    }

    // Actually, let's just use linear interpolation for age and hurdle
    // For simplicity, find the exact age bracket or closest
    // A robust approach creates a 2D interpolation, but for this model, we'll snap to age then interpolate hurdle.

    const ratesObj = STARTING_INCOME_RATES[closestAge as keyof typeof STARTING_INCOME_RATES];
    const hurdles = Object.keys(ratesObj).map(Number).sort((a, b) => a - b);

    if (hurdleRate <= hurdles[0]) return ratesObj[hurdles[0] as keyof typeof ratesObj];
    if (hurdleRate >= hurdles[hurdles.length - 1]) return ratesObj[hurdles[hurdles.length - 1] as keyof typeof ratesObj];

    let lowerHurdle = hurdles[0];
    let upperHurdle = hurdles[hurdles.length - 1];

    for (let i = 0; i < hurdles.length - 1; i++) {
        if (hurdleRate >= hurdles[i] && hurdleRate <= hurdles[i + 1]) {
            lowerHurdle = hurdles[i];
            upperHurdle = hurdles[i + 1];
            break;
        }
    }

    const rateRange = ratesObj[upperHurdle as keyof typeof ratesObj] - ratesObj[lowerHurdle as keyof typeof ratesObj];
    const hurdleRange = upperHurdle - lowerHurdle;
    const hurdleDiff = hurdleRate - lowerHurdle;

    return ratesObj[lowerHurdle as keyof typeof ratesObj] + (rateRange * (hurdleDiff / hurdleRange));
}

export function calculateILAStartingIncome(inputs: ILAInputs): number {
    let baseRate = interpolateStartingRate(inputs.purchaseAge, inputs.hurdleRate);

    // Adjustment factors
    if (inputs.gender === 'Female') {
        baseRate *= 0.95;
    }

    if (inputs.guaranteePeriod === 5) baseRate *= 0.97;
    else if (inputs.guaranteePeriod === 10) baseRate *= 0.94;
    else if (inputs.guaranteePeriod === 15) baseRate *= 0.90;
    else if (inputs.guaranteePeriod === 20) baseRate *= 0.85;

    return inputs.purchasePrice * baseRate;
}

export function calculateNextYearILAIncome(
    currentIncome: number,
    actualReturn: number,
    hurdleRate: number,
    participationFactor: number = 1.0
): number {
    const adjustment = (actualReturn - hurdleRate) * participationFactor;
    let nextIncome = currentIncome * (1 + adjustment);
    return Math.max(0, nextIncome); // Income floor = $0
}

// ILA Death Benefit
export function getDeathBenefit(
    purchasePrice: number,
    incomeReceivedToDate: number,
    yearsSincePurchase: number,
    guaranteePeriod: number
): number {
    if (yearsSincePurchase < guaranteePeriod) {
        return Math.max(0, purchasePrice - incomeReceivedToDate);
    }
    return 0; // After guarantee period, no death benefit
}
