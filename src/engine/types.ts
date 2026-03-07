export type CoupleStatus = 'Single' | 'Couple';
export type HomeownerStatus = 'Yes' | 'No';
export type DrawdownMode = 'Minimum statutory' | 'Target income';
export type StrategyType = 'Balanced' | 'Conservative' | 'Stable';
export type ScenarioType = 'Base Case' | 'Low Return' | 'High Inflation' | 'Long Life';

export interface UserInputs {
    // Member Details
    age: number;
    coupleStatus: CoupleStatus;
    spouseAge: number;
    homeowner: HomeownerStatus;

    // Balances
    superBalance: number;
    spouseSuperBalance: number; // Active if Couple
    financialAssets: number; // Non-super
    nonFinancialAssets: number; // Non-super (excl home)

    // Income
    otherIncome: number;
    otherIncomeFromDeemed: boolean;

    // Drawdown & Allocation
    abpStrategy: StrategyType;
    drawdownMode: DrawdownMode;
    targetIncome: number; // Active if Target income
    ilaHurdleRate: number; // 0% - 6%
    ilaGuaranteePeriod: number; // 0, 5, 10, 15, 20
    allocationSplitILA: number; // 0% - 100%

    // Projection Settings
    lifeExpectancy: number; // Projection end age
    inflation: number;
    scenario: ScenarioType;
    optimiserMode: boolean;

    // RIC Weights
    weightIncome: number;
    weightRisk: number;
    weightFlexibility: number;
}

export interface AgePensionParameters {
    maxRateSingle: number;
    maxRateCoupleEach: number;

    // Assets Test Lower Threshold (Full Pension)
    assetThresholdSingleHomeowner: number;
    assetThresholdSingleNonHomeowner: number;
    assetThresholdCoupleHomeowner: number;
    assetThresholdCoupleNonHomeowner: number;

    // Income Test Free Area (per fortnight)
    incomeFreeAreaSingle: number;
    incomeFreeAreaCoupleCombined: number;

    // Deeming (Single / Couple)
    deemingThresholdSingle: number;
    deemingThresholdCoupleCombined: number;
    deemingRateLower: number;
    deemingRateUpper: number;

    // Rent Assistance
    rentThresholdSingle: number;
    rentMaxRateSingle: number;
    rentThresholdCouple: number;
    rentMaxRateCouple: number;
}

export interface ProjectionParameters {
    minimumDrawdownRates: Record<number, number>; // minimum statutory rates by age limits
    returns: Record<StrategyType, number>; // Before-tax / After-fee returns by strategy
}

export interface ProjectionYearOutput {
    year: number;
    age: number;
    spouseAge: number;

    openingABPBalance: number;
    abpInvestmentReturn: number;
    ilaIncome: number;
    abpDrawdown: number;
    closingABPBalance: number;

    assessableAssets: number;
    deemedIncome: number;
    assessableIncome: number;

    assetsTestReduction: number;
    incomeTestReduction: number;
    bindingTest: 'Assets' | 'Income' | 'None';

    agePensionEntitlement: number;
    rentAssistance: number;

    totalIncome: number;
}

export interface ProjectionOutput {
    years: ProjectionYearOutput[];
    metrics: RICMetrics;
}

export interface RICMetrics {
    compositeScore: number;
    incomeScore: number;
    riskScore: number;
    flexibilityScore: number;

    totalLifetimeIncomeExpectedValue: number;
    cvOfIncome: number; // Coefficient of Variation
    incomeAt90: number; // 
    realIncomeRetained: number; // Inflation protection metric
}
