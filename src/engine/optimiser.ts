import type { UserInputs, ProjectionOutput, RICMetrics } from './types';
import { runProjection } from './projection';

export interface OptimiserResult {
    split: number; // 0 to 100
    metrics: RICMetrics;
    projection: ProjectionOutput;
}

export function runOptimiser(inputs: UserInputs, stepSize: number = 10): OptimiserResult[] {
    const results: OptimiserResult[] = [];

    // 1. Run projections for all splits (capped at 50% max ILA allocation)
    for (let split = 0; split <= 50; split += stepSize) {
        const testInputs = { ...inputs, allocationSplitILA: split, optimiserMode: false };
        const output = runProjection(testInputs);
        results.push({ split, metrics: output.metrics, projection: output });
    }

    // 2. Score mapping (0-100)

    // A. Maximising Income: Highest totalLifetimeIncome Expected Value gets 100.
    const maxIncome = Math.max(...results.map(r => r.metrics.totalLifetimeIncomeExpectedValue));

    // B. Managing Risks: Lowest CV, highest late-life income, maintained real value
    // We'll normalize these sub-metrics
    const maxCV = Math.max(...results.map(r => r.metrics.cvOfIncome));
    const minCV = Math.min(...results.map(r => r.metrics.cvOfIncome));
    const maxIncomeAt90 = Math.max(...results.map(r => r.metrics.incomeAt90));
    const maxRealRetained = Math.max(...results.map(r => r.metrics.realIncomeRetained));

    results.forEach(r => {
        // 1. Income Score
        r.metrics.incomeScore = maxIncome > 0 ? (r.metrics.totalLifetimeIncomeExpectedValue / maxIncome) * 100 : 0;

        // 2. Risk Score (Weighted sub-metrics)
        // Stability (Lower CV is better)
        const cvScore = maxCV === minCV ? 100 : ((maxCV - r.metrics.cvOfIncome) / (maxCV - minCV)) * 100;
        // Longevity
        const longScore = maxIncomeAt90 > 0 ? (r.metrics.incomeAt90 / maxIncomeAt90) * 100 : 0;
        // Inflation Resilience
        const inflScore = maxRealRetained > 0 ? (r.metrics.realIncomeRetained / maxRealRetained) * 100 : 0;

        r.metrics.riskScore = (cvScore * 0.4) + (longScore * 0.4) + (inflScore * 0.2);

        // 3. Flexibility Score (Higher proportion of assets in ABP is better)
        // 100% ABP = 100. 0% ABP = 0.
        const abpSplit = 100 - r.split;
        r.metrics.flexibilityScore = abpSplit;

        // 4. Composite Score
        const wI = inputs.weightIncome / 100;
        const wR = inputs.weightRisk / 100;
        const wF = inputs.weightFlexibility / 100;

        r.metrics.compositeScore =
            (r.metrics.incomeScore * wI) +
            (r.metrics.riskScore * wR) +
            (r.metrics.flexibilityScore * wF);
    });

    return results;
}

export function generateOptimiserOutput(inputs: UserInputs) {
    if (!inputs.optimiserMode) {
        const output = runProjection(inputs);
        return {
            optimal: { split: inputs.allocationSplitILA, metrics: output.metrics, projection: output },
            allSplits: []
        };
    }

    const results = runOptimiser(inputs);

    // Identify split with highest composite score
    const optimal = results.reduce((prev, current) => {
        // Tie breaker: if composite scores are identical, prefer the one with highest Flexibility (lowest ILA split)
        if (Math.abs(prev.metrics.compositeScore - current.metrics.compositeScore) < 0.1) {
            return (prev.metrics.flexibilityScore > current.metrics.flexibilityScore) ? prev : current;
        }
        return (prev.metrics.compositeScore > current.metrics.compositeScore) ? prev : current;
    });

    return {
        optimal,
        allSplits: results
    };
}
