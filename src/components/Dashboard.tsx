import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import type { OptimiserResult, UserInputs } from '../engine';

interface DashboardProps {
    data: {
        optimal: OptimiserResult;
        allSplits: OptimiserResult[];
    };
    inputs: UserInputs;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, inputs }) => {
    const { years, metrics } = data.optimal.projection;

    // Format data for Recharts
    const chartData = years.map(y => ({
        age: y.age,
        abpDrawdown: Math.round(y.abpDrawdown),
        spouseDrawdown: Math.round(y.spouseDrawdown),
        ilaIncome: Math.round(y.ilaIncome),
        agePension: Math.round(y.agePensionEntitlement),
        rentAssistance: Math.round(y.rentAssistance),
        totalIncome: Math.round(y.totalIncome),
        abpBalance: Math.round(y.closingABPBalance),
        spouseBalance: Math.round(y.spouseSuperBalance),
        assessableAssets: Math.round(y.assessableAssets)
    }));

    const radarData = [
        { subject: 'Income', A: Math.round(metrics.incomeScore), fullMark: 100 },
        { subject: 'Risk', A: Math.round(metrics.riskScore), fullMark: 100 },
        { subject: 'Flexibility', A: Math.round(metrics.flexibilityScore), fullMark: 100 }
    ];

    const allocationData = data.allSplits.map(s => ({
        split: s.split,
        score: Number(s.metrics.compositeScore.toFixed(2)),
        totalPV: Math.round(s.metrics.totalLifetimeIncomeExpectedValue)
    }));

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass-panel" style={{ padding: '10px' }}>
                    <p style={{ fontWeight: 600, marginBottom: '5px' }}>Age: {label}</p>
                    {payload.map((p: any) => (
                        <p key={p.name} style={{ color: p.color, fontSize: '0.9rem' }}>
                            {p.name}: ${p.value.toLocaleString()}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="dashboard-grid">

            {/* Top Summary Cards */}
            <div className="glass-panel" style={{ gridColumn: 'span 4', padding: '1.5rem' }}>
                <h4 className="text-gradient">Optimal Allocation</h4>
                <div style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1 }}>
                    {data.optimal.split}% ILA
                </div>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>Produces highest RIC score</p>
            </div>

            <div className="glass-panel" style={{ gridColumn: 'span 4', padding: '1.5rem' }}>
                <h4 className="text-gradient">Composite RIC Score</h4>
                <div style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1, color: 'var(--color-brand-secondary)' }}>
                    {metrics.compositeScore.toFixed(1)} <span style={{ fontSize: '1.5rem', color: 'var(--color-text-muted)' }}>/ 100</span>
                </div>
            </div>

            <div className="glass-panel" style={{ gridColumn: 'span 4', padding: '1.5rem' }}>
                <h4 className="text-gradient">Expected Nat Total CV</h4>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2 }}>
                    ${Math.round(metrics.totalLifetimeIncomeExpectedValue).toLocaleString()}
                </div>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>Lifetime Income (Real PV)</p>
            </div>

            {/* Main Income Waterfall */}
            <div className="glass-panel" style={{ gridColumn: 'span 8', padding: '1.5rem', height: '400px' }}>
                <h4>Income Trajectory (Optimal Split)</h4>
                <ResponsiveContainer width="100%" height="90%">
                    <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <XAxis dataKey="age" stroke="var(--color-text-muted)" />
                        <YAxis stroke="var(--color-text-muted)" tickFormatter={(val) => `$${Math.round(val / 1000)}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area type="monotone" dataKey="agePension" name="Age Pension" stackId="1" stroke="var(--color-chart-ap)" fill="var(--color-chart-ap)" fillOpacity={0.6} />
                        <Area type="monotone" dataKey="rentAssistance" name="Rent Assist" stackId="1" stroke="var(--color-chart-ra)" fill="var(--color-chart-ra)" fillOpacity={0.6} />
                        <Area type="monotone" dataKey="ilaIncome" name="ILA Income" stackId="1" stroke="var(--color-chart-ila)" fill="var(--color-chart-ila)" fillOpacity={0.6} />
                        <Area type="monotone" dataKey="abpDrawdown" name="ABP Drawdown" stackId="1" stroke="var(--color-chart-abp)" fill="var(--color-chart-abp)" fillOpacity={0.6} />
                        {inputs.coupleStatus === 'Couple' && (
                            <Area type="monotone" dataKey="spouseDrawdown" name="Spouse Drawdown" stackId="1" stroke="var(--color-brand-accent)" fill="var(--color-brand-accent)" fillOpacity={0.4} />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Radar Chart */}
            <div className="glass-panel" style={{ gridColumn: 'span 4', padding: '1.5rem', height: '400px', display: 'flex', flexDirection: 'column' }}>
                <h4>RIC Objective Alignment</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="60%" margin={{ top: 10, right: 30, bottom: 10, left: 30 }} data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-text-secondary)', fontSize: 13 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Optimal" dataKey="A" stroke="var(--color-brand-primary)" fill="var(--color-brand-primary)" fillOpacity={0.5} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-panel)', border: 'none', borderRadius: '8px' }} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* Allocation Comparison (Only if multiple splits) */}
            {inputs.optimiserMode && (
                <div className="glass-panel" style={{ gridColumn: 'span 6', padding: '1.5rem', height: '350px' }}>
                    <h4>RIC Score by ILA Allocation</h4>
                    <ResponsiveContainer width="100%" height="90%">
                        <LineChart data={allocationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <XAxis dataKey="split" stroke="var(--color-text-muted)" tickFormatter={(val) => `${val}%`} />
                            <YAxis stroke="var(--color-text-muted)" domain={['auto', 'auto']} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-panel)', border: 'none', borderRadius: '8px' }} />
                            <Line type="monotone" dataKey="score" name="RIC Score" stroke="var(--color-brand-accent)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Balance Depletion */}
            <div className="glass-panel" style={{ gridColumn: inputs.optimiserMode ? 'span 6' : 'span 12', padding: '1.5rem', height: '350px' }}>
                <h4>ABP Balance Depletion</h4>
                <ResponsiveContainer width="100%" height="90%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <XAxis dataKey="age" stroke="var(--color-text-muted)" />
                        <YAxis stroke="var(--color-text-muted)" tickFormatter={(val) => `$${val / 1000}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="abpBalance" name="ABP Balance" stroke="var(--color-brand-primary)" strokeWidth={3} dot={false} />
                        {inputs.coupleStatus === 'Couple' && (
                            <Line type="monotone" dataKey="spouseBalance" name="Spouse Balance" stroke="var(--color-brand-accent)" strokeWidth={3} dot={false} />
                        )}
                        <Line type="monotone" dataKey="assessableAssets" name="Assessable Assets" stroke="var(--color-warning)" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

        </div>
    );
};
