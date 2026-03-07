import { useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AuditTable } from './components/AuditTable';
import { DEFAULT_INPUTS, generateOptimiserOutput } from './engine';
import { Calculator } from 'lucide-react';

function App() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [isAuditMode, setIsAuditMode] = useState(false);

  // Run calculation engine whenever inputs change
  const engineResult = useMemo(() => {
    return generateOptimiserOutput(inputs);
  }, [inputs]);

  return (
    <div className="app-container">
      {/* Dynamic Sidebar Control */}
      <Sidebar
        inputs={inputs}
        setInputs={setInputs}
        isAuditMode={isAuditMode}
        setIsAuditMode={setIsAuditMode}
      />

      <main className="main-content">
        {/* Top Header */}
        <header className="top-bar">
          <div className="flex items-center gap-2">
            <Calculator style={{ color: 'var(--color-brand-primary)' }} size={24} />
            <h2>ABP & ILA Optimiser</h2>
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
            <strong>{inputs.scenario}</strong> Scenario Active
          </div>
        </header>

        {/* Content Router */}
        {isAuditMode ? (
          <AuditTable data={engineResult.optimal} />
        ) : (
          <Dashboard data={engineResult} inputs={inputs} />
        )}
      </main>
    </div>
  );
}

export default App;
