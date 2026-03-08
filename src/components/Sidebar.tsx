import React from 'react';
import { COHORTS } from '../engine';
import type { UserInputs, DrawdownMode, ScenarioType, StrategyType } from '../engine';

interface SidebarProps {
    inputs: UserInputs;
    setInputs: React.Dispatch<React.SetStateAction<UserInputs>>;
    isAuditMode: boolean;
    setIsAuditMode: (m: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ inputs, setInputs, isAuditMode, setIsAuditMode }) => {
    const handleSelectCohort = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === 'Custom') return;
        setInputs(COHORTS[val]);
    };

    const handleChange = (field: keyof UserInputs, value: any) => {
        setInputs((prev: UserInputs) => ({ ...prev, [field]: value }));
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h2 className="text-gradient">Settings</h2>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '8px' }}>
                    <button
                        className={`btn ${!isAuditMode ? 'btn-primary' : 'btn-secondary'} w-full`}
                        onClick={() => setIsAuditMode(false)}
                    >Dashboard</button>
                    <button
                        className={`btn ${isAuditMode ? 'btn-primary' : 'btn-secondary'} w-full`}
                        onClick={() => setIsAuditMode(true)}
                    >Audit</button>
                </div>
            </div>

            <div className="sidebar-content">
                <div className="form-group">
                    <label className="form-label">Member Cohort</label>
                    <select className="form-control" onChange={handleSelectCohort}>
                        <option value="Custom">Custom...</option>
                        {Object.keys(COHORTS).map(k => (
                            <option key={k} value={k}>{k}</option>
                        ))}
                    </select>
                </div>

                <h4 style={{ marginTop: '2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Personal Details</h4>

                <div className="form-group flex gap-2">
                    <div className="w-full">
                        <label className="form-label">Age</label>
                        <input type="number" className="form-control" value={inputs.age} onChange={e => handleChange('age', parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="w-full">
                        <label className="form-label">Life Expectancy</label>
                        <input type="number" className="form-control" value={inputs.lifeExpectancy} onChange={e => handleChange('lifeExpectancy', parseInt(e.target.value) || 0)} />
                    </div>
                </div>

                <div className="form-group flex gap-2">
                    <div className="w-full">
                        <label className="form-label">Status</label>
                        <select className="form-control" value={inputs.coupleStatus} onChange={e => handleChange('coupleStatus', e.target.value as any)}>
                            <option value="Single">Single</option>
                            <option value="Couple">Couple</option>
                        </select>
                    </div>
                    <div className="w-full">
                        <label className="form-label">Homeowner</label>
                        <select className="form-control" value={inputs.homeowner} onChange={e => handleChange('homeowner', e.target.value as any)}>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>
                </div>

                {inputs.coupleStatus === 'Couple' && (
                    <div className="form-group flex gap-2">
                        <div className="w-full">
                            <label className="form-label">Spouse Age</label>
                            <input type="number" className="form-control" value={inputs.spouseAge} onChange={e => handleChange('spouseAge', parseInt(e.target.value) || 0)} />
                        </div>
                    </div>
                )}

                <h4 style={{ marginTop: '2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Balances</h4>

                <div className="form-group">
                    <label className="form-label">Super Balance ($)</label>
                    <input type="number" className="form-control" value={inputs.superBalance} onChange={e => handleChange('superBalance', parseInt(e.target.value) || 0)} />
                </div>

                {inputs.coupleStatus === 'Couple' && (
                    <div className="form-group">
                        <label className="form-label">Spouse Super Balance ($)</label>
                        <input type="number" className="form-control" value={inputs.spouseSuperBalance} onChange={e => handleChange('spouseSuperBalance', parseInt(e.target.value) || 0)} />
                    </div>
                )}

                <div className="form-group flex gap-2">
                    <div className="w-full">
                        <label className="form-label">Financial Assets</label>
                        <input type="number" className="form-control" value={inputs.financialAssets} onChange={e => handleChange('financialAssets', parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="w-full">
                        <label className="form-label">Other Assets</label>
                        <input type="number" className="form-control" value={inputs.nonFinancialAssets} onChange={e => handleChange('nonFinancialAssets', parseInt(e.target.value) || 0)} />
                    </div>
                </div>

                <h4 style={{ marginTop: '2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>ABP & ILA Params</h4>

                <div className="form-group">
                    <label className="form-label">ABP Return Strategy</label>
                    <select className="form-control" value={inputs.abpStrategy} onChange={e => handleChange('abpStrategy', e.target.value as StrategyType)}>
                        <option value="Balanced">Balanced (CPI + 4.5% pa)</option>
                        <option value="Conservative">Conservative (CPI + 4.0% pa)</option>
                        <option value="Stable">Stable (CPI + 3.0% pa)</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Drawdown Mode</label>
                    <select className="form-control" value={inputs.drawdownMode} onChange={e => handleChange('drawdownMode', e.target.value as DrawdownMode)}>
                        <option value="Minimum statutory">Minimum statutory</option>
                        <option value="Target income">Target income</option>
                    </select>
                </div>

                {inputs.drawdownMode === 'Target income' && (
                    <div className="form-group">
                        <label className="form-label">Target Income ($ p.a.)</label>
                        <input type="number" className="form-control" value={inputs.targetIncome} onChange={e => handleChange('targetIncome', parseInt(e.target.value) || 0)} />
                    </div>
                )}

                <div className="form-group flex gap-2">
                    <div className="w-full">
                        <label className="form-label">ILA Hurdle Rate (%)</label>
                        <input type="number" className="form-control" step="0.5" value={inputs.ilaHurdleRate * 100} onChange={e => handleChange('ilaHurdleRate', (parseFloat(e.target.value) || 0) / 100)} />
                    </div>
                    <div className="w-full">
                        <label className="form-label">ILA Guarantee Yrs</label>
                        <select className="form-control" value={inputs.ilaGuaranteePeriod} onChange={e => handleChange('ilaGuaranteePeriod', parseInt(e.target.value) || 0)}>
                            <option value="0">0</option>
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="15">15</option>
                            <option value="20">20</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">ILA Allocation Split (%)</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                            type="range"
                            className="w-full"
                            min="0" max="50" step="5"
                            value={inputs.allocationSplitILA}
                            onChange={e => handleChange('allocationSplitILA', parseInt(e.target.value))}
                            disabled={inputs.optimiserMode}
                            style={{ opacity: inputs.optimiserMode ? 0.5 : 1 }}
                        />
                        <span style={{ fontWeight: 600, minWidth: '40px' }}>{inputs.optimiserMode ? 'Auto' : `${inputs.allocationSplitILA}%`}</span>
                    </div>
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                        type="checkbox"
                        id="optimiser"
                        checked={inputs.optimiserMode}
                        onChange={e => handleChange('optimiserMode', e.target.checked)}
                    />
                    <label htmlFor="optimiser" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>Enable Optimiser Mode</label>
                </div>

                {inputs.optimiserMode && (
                    <>
                        <h4 style={{ marginTop: '2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>RIC Objectives Weighting</h4>
                        <div className="form-group flex gap-2">
                            <div className="w-full">
                                <label className="form-label" style={{ fontSize: '0.8rem' }}>Income (%)</label>
                                <input type="number" className="form-control" value={inputs.weightIncome} onChange={e => handleChange('weightIncome', parseInt(e.target.value) || 0)} />
                            </div>
                            <div className="w-full">
                                <label className="form-label" style={{ fontSize: '0.8rem' }}>Risk (%)</label>
                                <input type="number" className="form-control" value={inputs.weightRisk} onChange={e => handleChange('weightRisk', parseInt(e.target.value) || 0)} />
                            </div>
                            <div className="w-full">
                                <label className="form-label" style={{ fontSize: '0.8rem' }}>Flexibility (%)</label>
                                <input type="number" className="form-control" value={inputs.weightFlexibility} onChange={e => handleChange('weightFlexibility', parseInt(e.target.value) || 0)} />
                            </div>
                        </div>
                    </>
                )}

                <h4 style={{ marginTop: '2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Scenarios</h4>

                <div className="form-group">
                    <label className="form-label">Market Scenario</label>
                    <select className="form-control" value={inputs.scenario} onChange={e => handleChange('scenario', e.target.value as ScenarioType)}>
                        <option value="Base Case">Base Case</option>
                        <option value="Low Return">Low Return</option>
                        <option value="High Inflation">High Inflation</option>
                        <option value="Long Life">Long Life</option>
                    </select>
                </div>
            </div>
        </aside>
    );
};
