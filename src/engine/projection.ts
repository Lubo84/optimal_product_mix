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

        // 4-11: ABP Drawdown & Age Pension (Target Income Iteration)
        let bestDrawdown = 0;
        let finalAssessableAssets = 0;
        let finalDeemedIncome = 0;
        let finalAssessableIncome = 0;
        let finalAgePensionCalc: any = null;
        let finalRentAssistance = 0;
        let finalTotalIncome = 0;

        const maxAvailableDrawdown = openingABPBalance + abpInvestmentReturn;
        let minDrawdown = calculateABPDrawdown(
            maxAvailableDrawdown,
            currentAge,
            'Minimum statutory',
            0,
            0,
            1
        );

        // Target income is specified in real terms, scale to nominal for the year
        const targetIncomeNominal = inputs.targetIncome * inflationFactor;

        let currentDrawdown = minDrawdown;

        for (let iter = 0; iter < 5; iter++) {
            currentDrawdown = Math.max(minDrawdown, Math.min(currentDrawdown, maxAvailableDrawdown));

            const testClosingBalance = maxAvailableDrawdown - currentDrawdown;
            const assessAssets = calculateAssessableAssets(inputs, testClosingBalance, ilaPurchasePrice, year, currentAge);
            const deemedInc = calculateDeemedIncome(inputs, testClosingBalance);
            const assessInc = calculateAssessableIncome(inputs, deemedInc, ilaIncome);
            const apCalc = calculateAgePension(inputs, assessAssets, assessInc, inflationFactor);

            let ap = apCalc.pensionPayable;
            let ra = 0;
            if (inputs.homeowner === 'No') {
                let maxRA = (inputs.coupleStatus === 'Single' ? AP_PARAMS.rentMaxRateSingle : AP_PARAMS.rentMaxRateCoupleCombined) * inflationFactor;
                let maxPension = (inputs.coupleStatus === 'Single' ? AP_PARAMS.maxRateSingle : AP_PARAMS.maxRateCoupleCombined) * inflationFactor;
                const greaterReduction = Math.max(apCalc.assetsTestReduction, apCalc.incomeTestReduction);
                let totalEntitlement = Math.max(0, maxPension + maxRA - greaterReduction);
                ra = Math.min(maxRA, totalEntitlement);
                ap = totalEntitlement - ra;
            }

            let totalInc = currentDrawdown + ilaIncome + ap + ra;

            finalAssessableAssets = assessAssets;
            finalDeemedIncome = deemedInc;
            finalAssessableIncome = assessInc;
            finalAgePensionCalc = apCalc;
            finalRentAssistance = ra;
            finalTotalIncome = totalInc;

            if (inputs.drawdownMode === 'Minimum statutory') {
                bestDrawdown = currentDrawdown;
                break;
            }

            const shortfall = targetIncomeNominal - totalInc;
            if (Math.abs(shortfall) < 1 || currentDrawdown >= maxAvailableDrawdown || (shortfall < 0 && currentDrawdown <= minDrawdown)) {
                bestDrawdown = currentDrawdown;
                break;
            }

            currentDrawdown += shortfall;
            bestDrawdown = currentDrawdown;
        }

        const abpDrawdown = bestDrawdown;

        // 5: Closing ABP balance
        const closingABPBalance = openingABPBalance + abpInvestmentReturn - abpDrawdown;
        abpBalance = closingABPBalance;

        // Convert to real values for the array
        const real = (val: number) => val / inflationFactor;

        years.push({
            year,
            age: currentAge,
            spouseAge: inputs.coupleStatus === 'Couple' ? inputs.spouseAge + (year - 1) : 0,
            openingABPBalance: real(openingABPBalance),
            abpInvestmentReturn: real(abpInvestmentReturn),
            ilaIncome: real(ilaIncome),
            abpDrawdown: real(abpDrawdown),
            closingABPBalance: real(closingABPBalance),
            assessableAssets: real(finalAssessableAssets),
            deemedIncome: real(finalDeemedIncome),
            assessableIncome: real(finalAssessableIncome),
            assetsTestReduction: real(finalAgePensionCalc.assetsTestReduction),
            incomeTestReduction: real(finalAgePensionCalc.incomeTestReduction),
            bindingTest: finalAgePensionCalc.bindingTest,
            agePensionEntitlement: real(finalAgePensionCalc.pensionPayable),
            rentAssistance: real(finalRentAssistance),
            totalIncome: real(finalTotalIncome),
            inflationFactor
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
        totalPV += y.totalIncome; // Already in real dollars!
        totalNominal += y.totalIncome * y.inflationFactor;
        incomes.push(y.totalIncome);
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
