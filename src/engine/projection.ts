import type {
    UserInputs,
    ProjectionOutput,
    ProjectionYearOutput,
    RICMetrics
} from './types';
import {
    calculateAgePension,
    calculateAssessableAssets,
    calculateDeemedIncome,
    calculateAssessableIncome,
    AP_PARAMS
} from './agePension';
import { calculateABPDrawdown } from './abp';
import { calculateILAStartingIncome, calculateNextYearILAIncome } from './ila';

const RETURNS = {
    'Base Case': { Balanced: 0.07, Conservative: 0.055, Stable: 0.045 },
    'Low Return': { Balanced: 0.05, Conservative: 0.035, Stable: 0.025 },
    'High Inflation': { Balanced: 0.07, Conservative: 0.055, Stable: 0.045 },
    'Long Life': { Balanced: 0.07, Conservative: 0.055, Stable: 0.045 }
};

export function runProjection(inputs: UserInputs): ProjectionOutput {
    const years: ProjectionYearOutput[] = [];

    // Configuration Overrides per Scenario
    let inflation = inputs.inflation;
    // Let high inflation be 4.0% for first 10 yrs, then 2.5%
    const baseReturns = RETURNS[inputs.scenario];
    const strategyReturn = baseReturns[inputs.abpStrategy];
    // ILA underlying same as Balanced
    const ilaReturn = baseReturns['Balanced'];

    const purchaseAge = inputs.age;
    const totalBalance = inputs.superBalance;

    const ilaAllocation = inputs.allocationSplitILA / 100;
    const ilaPurchasePrice = totalBalance * ilaAllocation;
    let abpBalance = totalBalance - ilaPurchasePrice;

    // Starting ILA Income
    let currentIlaIncome = calculateILAStartingIncome({
        purchasePrice: ilaPurchasePrice,
        purchaseAge: purchaseAge,
        hurdleRate: inputs.ilaHurdleRate,
        guaranteePeriod: inputs.ilaGuaranteePeriod,
        gender: 'Male' // Defaulted for model simplicity, could be added to UserInputs
    });

    const projectionEndAge = inputs.scenario === 'Long Life' ? Math.max(inputs.lifeExpectancy + 5, 100) : Math.max(inputs.lifeExpectancy, 100);

    let cumulativeIlaIncome = 0;

    for (let currentAge = purchaseAge; currentAge <= projectionEndAge; currentAge++) {
        const year = currentAge - purchaseAge + 1;

        // Scenario Adjustments: High Inflation
        let currentInflation = inflation;
        if (inputs.scenario === 'High Inflation') {
            currentInflation = year <= 10 ? 0.04 : 0.025;
        }
        const inflationFactor = Math.pow(1 + currentInflation, year - 1);

        // 1 & 2: Opening ABP Balance and Investment Return
        const openingABPBalance = abpBalance;
        const abpInvestmentReturn = openingABPBalance * strategyReturn;

        // 3: ILA Income calculation (Year 1 starts at derived rate, subsequent adjust)
        let ilaIncome = currentIlaIncome;
        if (year > 1) {
            ilaIncome = calculateNextYearILAIncome(currentIlaIncome, ilaReturn, inputs.ilaHurdleRate);
            currentIlaIncome = ilaIncome;
        }
        cumulativeIlaIncome += ilaIncome;

        // 4: ABP Drawdown
        const abpDrawdown = calculateABPDrawdown(
            openingABPBalance + abpInvestmentReturn,
            currentAge,
            inputs.drawdownMode,
            inputs.targetIncome,
            ilaIncome,
            inflationFactor
        );

        // 5: Closing ABP balance
        const closingABPBalance = openingABPBalance + abpInvestmentReturn - abpDrawdown;
        abpBalance = closingABPBalance;

        // 6: Assessable Assets
        const assessableAssets = calculateAssessableAssets(
            inputs, closingABPBalance, ilaPurchasePrice, year, currentAge
        );

        // 7: Deemed Income
        const deemedIncome = calculateDeemedIncome(inputs, closingABPBalance);

        // 8: Assessable Income
        const assessableIncome = calculateAssessableIncome(inputs, deemedIncome, ilaIncome);

        // 9-11: Age Pension & Rent Assistance (Handled together)
        const agePensionCalc = calculateAgePension(
            inputs,
            assessableAssets,
            assessableIncome,
            inflationFactor
        );

        // RA logic per spec: 
        let rentAssistance = 0;
        let pensionPayable = agePensionCalc.pensionPayable;
        if (inputs.homeowner === 'No') {
            let maxRA = inputs.coupleStatus === 'Single' ? AP_PARAMS.rentMaxRateSingle : AP_PARAMS.rentMaxRateCoupleCombined;
            maxRA *= inflationFactor;

            let maxPension = inputs.coupleStatus === 'Single' ? AP_PARAMS.maxRateSingle : AP_PARAMS.maxRateCoupleCombined;
            maxPension *= inflationFactor;

            const greaterReduction = Math.max(agePensionCalc.assetsTestReduction, agePensionCalc.incomeTestReduction);

            if (maxPension + maxRA - greaterReduction > 0) {
                rentAssistance = Math.min(maxRA, maxPension + maxRA - greaterReduction); // Standard taper behaviour
                pensionPayable = Math.max(0, maxPension + rentAssistance - greaterReduction - rentAssistance); // Re-separate
                // Actually, the simplest is logic: pensionPayable is the base, rentAssistance is the RA component.
                let totalEntitlement = Math.max(0, maxPension + maxRA - greaterReduction);
                rentAssistance = Math.min(maxRA, totalEntitlement);
                pensionPayable = totalEntitlement - rentAssistance;
            }
        }

        const totalIncome = abpDrawdown + ilaIncome + pensionPayable + rentAssistance;

        years.push({
            year,
            age: currentAge,
            spouseAge: inputs.coupleStatus === 'Couple' ? inputs.spouseAge + (year - 1) : 0,
            openingABPBalance,
            abpInvestmentReturn,
            ilaIncome,
            abpDrawdown,
            closingABPBalance,
            assessableAssets,
            deemedIncome,
            assessableIncome,
            assetsTestReduction: agePensionCalc.assetsTestReduction,
            incomeTestReduction: agePensionCalc.incomeTestReduction,
            bindingTest: agePensionCalc.bindingTest,
            agePensionEntitlement: pensionPayable,
            rentAssistance,
            totalIncome
        });
    }

    return {
        years,
        metrics: extractMetrics(years, inputs)
    };
}

function extractMetrics(years: ProjectionYearOutput[], inputs: UserInputs): RICMetrics {
    // 1. Total lifetime income expected value (real $)
    let totalPV = 0;
    let totalNominal = 0;
    const incomes: number[] = [];

    years.forEach(y => {
        // Discount back to present value using inflation rate to get real $
        const r = Math.pow(1 + inputs.inflation, y.year - 1);
        totalPV += (y.totalIncome / r);
        totalNominal += y.totalIncome;
        incomes.push(y.totalIncome / r);
    });

    // 2. CV of Income (Real)
    const meanIncome = incomes.reduce((a, b) => a + b, 0) / incomes.length;
    const variance = incomes.reduce((a, b) => a + Math.pow(b - meanIncome, 2), 0) / incomes.length;
    const cvOfIncome = Math.sqrt(variance) / meanIncome;

    // 3. Income at 90 (Real)
    const yearAt90 = 90 - inputs.age + 1;
    const incomeAt90 = yearAt90 > 0 && yearAt90 <= years.length ? incomes[yearAt90 - 1] : 0;

    // 4. Real income retained
    const realIncomeRetained = incomes[incomes.length - 1] / incomes[0];

    return {
        compositeScore: 0, // Calculated by the optimiser
        incomeScore: 0,
        riskScore: 0,
        flexibilityScore: 0,

        totalLifetimeIncomeExpectedValue: totalPV,
        cvOfIncome,
        incomeAt90,
        realIncomeRetained
    };
}
