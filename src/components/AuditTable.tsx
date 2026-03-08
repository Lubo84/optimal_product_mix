import React from 'react';
import type { OptimiserResult } from '../engine';

interface AuditTableProps {
    data: OptimiserResult;
}

export const AuditTable: React.FC<AuditTableProps> = ({ data }) => {
    const { years } = data.projection;

    return (
        <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                <h3 style={{ marginBottom: '1rem' }}>Detailed Year-by-Year Projection (Audit Trail)</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                    This table shows the exact 14-step waterfall calculation for the selected allocation ({data.split}% ILA).
                </p>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'right' }}>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Year</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Age</th>
                            <th style={{ padding: '0.75rem' }}>Open ABP</th>
                            <th style={{ padding: '0.75rem' }}>ABP Return</th>
                            <th style={{ padding: '0.75rem' }}>ABP Draw</th>
                            <th style={{ padding: '0.75rem' }}>Spouse Draw</th>
                            <th style={{ padding: '0.75rem' }}>Close ABP</th>
                            <th style={{ padding: '0.75rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>ILA Income</th>
                            <th style={{ padding: '0.75rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>Assessable Assets</th>
                            <th style={{ padding: '0.75rem' }}>Deemed Inc</th>
                            <th style={{ padding: '0.75rem' }}>Assessable Inc</th>
                            <th style={{ padding: '0.75rem' }}>Binding Test</th>
                            <th style={{ padding: '0.75rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>Age Pension</th>
                            <th style={{ padding: '0.75rem' }}>Rent Assist</th>
                            <th style={{ padding: '0.75rem', color: 'var(--color-brand-secondary)' }}>Total Income</th>
                        </tr>
                    </thead>
                    <tbody>
                        {years.map((y) => (
                            <tr key={y.year} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '0.75rem' }}>{y.year}</td>
                                <td style={{ padding: '0.75rem' }}>{y.age}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>${Math.round(y.openingABPBalance).toLocaleString()}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>${Math.round(y.abpInvestmentReturn).toLocaleString()}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--color-chart-abp)' }}>${Math.round(y.abpDrawdown).toLocaleString()}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--color-brand-accent)' }}>${Math.round(y.spouseDrawdown).toLocaleString()}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>${Math.round(y.closingABPBalance).toLocaleString()}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-chart-ila)' }}>${Math.round(y.ilaIncome).toLocaleString()}</td>

                                <td style={{ padding: '0.75rem', textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>${Math.round(y.assessableAssets).toLocaleString()}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>${Math.round(y.deemedIncome).toLocaleString()}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>${Math.round(y.assessableIncome).toLocaleString()}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        background: y.bindingTest === 'Assets' ? 'rgba(245, 158, 11, 0.2)' : y.bindingTest === 'Income' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.1)',
                                        color: y.bindingTest === 'Assets' ? 'var(--color-warning)' : y.bindingTest === 'Income' ? 'var(--color-brand-primary)' : 'inherit'
                                    }}>{y.bindingTest}</span>
                                </td>

                                <td style={{ padding: '0.75rem', textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-chart-ap)' }}>${Math.round(y.agePensionEntitlement).toLocaleString()}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--color-chart-ra)' }}>${Math.round(y.rentAssistance).toLocaleString()}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: 'var(--color-brand-secondary)' }}>${Math.round(y.totalIncome).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
