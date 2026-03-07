import type { UserInputs } from './types';

export const DEFAULT_INPUTS: UserInputs = {
    age: 67,
    coupleStatus: 'Single',
    spouseAge: 65,
    homeowner: 'Yes',

    superBalance: 500000,
    spouseSuperBalance: 0,
    financialAssets: 0,
    nonFinancialAssets: 0,

    otherIncome: 0,
    otherIncomeFromDeemed: false,

    abpStrategy: 'Balanced',
    drawdownMode: 'Minimum statutory',
    targetIncome: 50000,
    ilaHurdleRate: 0.035, // 3.5%
    ilaGuaranteePeriod: 10,
    allocationSplitILA: 50,

    lifeExpectancy: 92,
    inflation: 0.025,
    scenario: 'Base Case',
    optimiserMode: true,

    // Default equal RIC Weights roughly per spec (40/40/20)
    weightIncome: 40,
    weightRisk: 40,
    weightFlexibility: 20
};

export const COHORTS: Record<string, UserInputs> = {
    'Full Age Pensioner - Margaret': {
        ...DEFAULT_INPUTS,
        age: 67,
        coupleStatus: 'Single',
        homeowner: 'No',
        superBalance: 250000,
        financialAssets: 5000,
        nonFinancialAssets: 10000,
        lifeExpectancy: 90,
        drawdownMode: 'Minimum statutory',
    },
    'Part Age Pensioner - David & Sue': {
        ...DEFAULT_INPUTS,
        age: 67,
        coupleStatus: 'Couple',
        spouseAge: 65,
        homeowner: 'Yes',
        superBalance: 500000,
        spouseSuperBalance: 200000,
        financialAssets: 30000,
        nonFinancialAssets: 50000,
        lifeExpectancy: 92,
        drawdownMode: 'Target income',
        targetIncome: 55000
    },
    'Self-Funded Retiree - Robert & Helen': {
        ...DEFAULT_INPUTS,
        age: 67,
        coupleStatus: 'Couple',
        spouseAge: 64,
        homeowner: 'Yes',
        superBalance: 900000,
        spouseSuperBalance: 500000,
        financialAssets: 200000,
        nonFinancialAssets: 150000,
        lifeExpectancy: 92,
        drawdownMode: 'Target income',
        targetIncome: 80000
    }
};
