import type { UserInputs } from './types';

// Exported standard 20 March 2026 Age Pension Parameters
export const AP_PARAMS = {
    maxRateSingle: 1200.90 * 26, // Annualised
    maxRateCoupleCombined: 1810.40 * 26, // Annualised

    // Assets Test Lower Threshold (Full Pension)
    assetThresholdSingleHomeowner: 321500,
    assetThresholdSingleNonHomeowner: 579500,
    assetThresholdCoupleHomeowner: 481500,
    assetThresholdCoupleNonHomeowner: 739500,

    // Fortnightly Asset Test Taper (per $1000)
    assetTaperFortnightly: 3.00,

    // Income Test Free Area (per fortnight) -> Annualised
    incomeFreeAreaSingle: 218.00 * 26,
    incomeFreeAreaCoupleCombined: 380.00 * 26,

    // Income Test Taper (Annual)
    incomeTaperSingle: 0.50,
    incomeTaperCoupleCombined: 0.50, // 0.25 each * 2 = 0.50 combined

    // Deeming
    deemingThresholdSingle: 64200,
    deemingThresholdCoupleCombined: 106200,
    deemingRateLower: 0.0125,
    deemingRateUpper: 0.0325,

    // Rent Assistance (Fortnightly -> Annualised)
    rentThresholdSingle: 152.00 * 26,
    rentMaxRateSingle: 215.40 * 26,
    rentThresholdCoupleCombined: 246.20 * 26,
    rentMaxRateCoupleCombined: 203.00 * 26,
    rentTaper: 0.75, // per $1 of rent above threshold
};

// Evaluate Assessable Assets
export function calculateAssessableAssets(
    inputs: UserInputs,
    abpBalance: number,
    ilaPurchasePrice: number,
    yearsSincePurchase: number,
    currentAge: number,
    spouseSuperBalance: number
): number {
    const purchaseAge = currentAge - yearsSincePurchase;
    const thresholdAge = Math.max(84, purchaseAge + 5);
    const isPastThresholdDay = currentAge >= thresholdAge;

    const ilaAssessmentRate = isPastThresholdDay ? 0.30 : 0.60;
    let assessableILA = ilaPurchasePrice * ilaAssessmentRate;

    let baseAssets = abpBalance + assessableILA + inputs.financialAssets + inputs.nonFinancialAssets;

    if (inputs.coupleStatus === 'Couple') {
        baseAssets += spouseSuperBalance; // For simplicity, spouse super assumed 100% ABP
    }

    return baseAssets;
}

// Evaluate Deemed Income
export function calculateDeemedIncome(
    inputs: UserInputs,
    abpBalance: number,
    spouseSuperBalance: number
): number {
    let deemedAssets = abpBalance + inputs.financialAssets;
    if (inputs.coupleStatus === 'Couple') {
        deemedAssets += spouseSuperBalance;
    }

    const threshold = inputs.coupleStatus === 'Single' ? AP_PARAMS.deemingThresholdSingle : AP_PARAMS.deemingThresholdCoupleCombined;

    if (deemedAssets <= threshold) {
        return deemedAssets * AP_PARAMS.deemingRateLower;
    } else {
        return (threshold * AP_PARAMS.deemingRateLower) + ((deemedAssets - threshold) * AP_PARAMS.deemingRateUpper);
    }
}

// Evaluate Total Assessable Income
export function calculateAssessableIncome(
    inputs: UserInputs,
    deemedIncome: number,
    ilaIncome: number
): number {
    let assessableILAIncome = ilaIncome * 0.60;
    let otherIncome = inputs.otherIncomeFromDeemed ? 0 : inputs.otherIncome;
    return deemedIncome + assessableILAIncome + otherIncome;
}

// Assets Test Reduction (Annualised)
export function getAssetsTestReduction(inputs: UserInputs, assessableAssets: number, inflationFactor: number): number {
    let threshold = 0;
    if (inputs.coupleStatus === 'Single') {
        threshold = inputs.homeowner === 'Yes' ? AP_PARAMS.assetThresholdSingleHomeowner : AP_PARAMS.assetThresholdSingleNonHomeowner;
    } else {
        threshold = inputs.homeowner === 'Yes' ? AP_PARAMS.assetThresholdCoupleHomeowner : AP_PARAMS.assetThresholdCoupleNonHomeowner;
    }

    // Inflation adjustment of threshold
    threshold *= inflationFactor;

    if (assessableAssets <= threshold) return 0;

    const excess = assessableAssets - threshold;
    // $3.00 reduction per fortnight per $1000 of excess -> Annualised: (Excess / 1000) * 3.00 * 26
    return Math.floor(excess / 1000) * AP_PARAMS.assetTaperFortnightly * 26;
}

// Income Test Reduction (Annualised)
export function getIncomeTestReduction(inputs: UserInputs, assessableIncome: number, inflationFactor: number): number {
    let freeArea = inputs.coupleStatus === 'Single' ? AP_PARAMS.incomeFreeAreaSingle : AP_PARAMS.incomeFreeAreaCoupleCombined;
    let taper = inputs.coupleStatus === 'Single' ? AP_PARAMS.incomeTaperSingle : AP_PARAMS.incomeTaperCoupleCombined;

    // Inflation adjustment of threshold
    freeArea *= inflationFactor;

    if (assessableIncome <= freeArea) return 0;

    const excess = assessableIncome - freeArea;
    return excess * taper;
}

export interface AgePensionResult {
    pensionPayable: number;
    assetsTestReduction: number;
    incomeTestReduction: number;
    bindingTest: 'Assets' | 'Income' | 'None';
}

export function calculateAgePension(
    inputs: UserInputs,
    assessableAssets: number,
    assessableIncome: number,
    inflationFactor: number
): AgePensionResult {

    let maxPension = inputs.coupleStatus === 'Single' ? AP_PARAMS.maxRateSingle : AP_PARAMS.maxRateCoupleCombined;
    maxPension *= inflationFactor; // Pension indexed

    const assetsReduction = getAssetsTestReduction(inputs, assessableAssets, inflationFactor);
    const incomeReduction = getIncomeTestReduction(inputs, assessableIncome, inflationFactor);

    let bindingTest: 'Assets' | 'Income' | 'None' = 'None';
    let greaterReduction = 0;

    if (assetsReduction > 0 || incomeReduction > 0) {
        if (assetsReduction >= incomeReduction) {
            bindingTest = 'Assets';
            greaterReduction = assetsReduction;
        } else {
            bindingTest = 'Income';
            greaterReduction = incomeReduction;
        }
    }

    let pensionPayable = Math.max(0, maxPension - greaterReduction);

    return {
        pensionPayable, // Purely the age pension component (no RA yet)
        assetsTestReduction: assetsReduction,
        incomeTestReduction: incomeReduction,
        bindingTest
    };
}
