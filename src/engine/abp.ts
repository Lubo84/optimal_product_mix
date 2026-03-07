// Minimum Drawdown Rates Table based on Age (Appendix A)
export const MINIMUM_DRAWDOWN_RATES: Record<string, number> = {
    'under65': 0.04,
    '65-74': 0.05,
    '75-79': 0.06,
    '80-84': 0.07,
    '85-89': 0.09,
    '90-94': 0.11,
    '95plus': 0.14
};

export function getMinimumDrawdownRate(age: number): number {
    if (age < 65) return MINIMUM_DRAWDOWN_RATES['under65'];
    if (age <= 74) return MINIMUM_DRAWDOWN_RATES['65-74'];
    if (age <= 79) return MINIMUM_DRAWDOWN_RATES['75-79'];
    if (age <= 84) return MINIMUM_DRAWDOWN_RATES['80-84'];
    if (age <= 89) return MINIMUM_DRAWDOWN_RATES['85-89'];
    if (age <= 94) return MINIMUM_DRAWDOWN_RATES['90-94'];
    return MINIMUM_DRAWDOWN_RATES['95plus'];
}

export function calculateABPDrawdown(
    abpBalance: number,
    age: number,
    mode: 'Minimum statutory' | 'Target income',
    targetIncome: number,
    ilaIncome: number,
    inflationFactor: number // Target income scales with inflation usually if it represents real purchasing power
): number {
    const minRate = getMinimumDrawdownRate(age);
    const minDrawdown = abpBalance * minRate;

    if (mode === 'Minimum statutory') {
        return Math.min(minDrawdown, abpBalance); // Cap at balance
    } else {
        // Target income mode
        const adjustedTarget = targetIncome * inflationFactor;
        let targetDrawdown = Math.max(0, adjustedTarget - ilaIncome);

        // According to rule 1, ABP_Drawdown(year) = max(Minimum_Statutory_Drawdown, targetDrawdown)
        // But cannot exceed available balance.
        let drawdown = Math.max(minDrawdown, targetDrawdown);
        return Math.min(drawdown, abpBalance);
    }
}
