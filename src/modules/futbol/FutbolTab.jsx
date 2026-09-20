import { useState } from 'react';
import { FutbolSection } from './FutbolSection';
import { PrediccionesTab } from './PrediccionesTab';
import { EstadisticasTab } from './EstadisticasTab';

export function FutbolTab({ data, matches, matchesStatus, predicciones, onChangePredicciones, onDeletePrediccion, onNavigate, refreshSignal, onRefresh }) {
  const [sub, setSub] = useState('partidos');
  return (
    <div className="module-panel">
      <div className="sub-tabs">
        <button type="button" className={`sub-tab ${sub === 'partidos' ? 'active' : ''}`} onClick={() => setSub('partidos')}>Partidos</button>
        <button type="button" className={`sub-tab ${sub === 'predicciones' ? 'active' : ''}`} onClick={() => setSub('predicciones')}>Predicciones</button>
        <button type="button" className={`sub-tab ${sub === 'estadisticas' ? 'active' : ''}`} onClick={() => setSub('estadisticas')}>Estadísticas</button>
      </div>
      {sub === 'partidos' && (
        <FutbolSection config={data.futbol} matches={matches} status={matchesStatus} onNavigate={onNavigate} onRefresh={onRefresh} />
      )}
      {sub === 'predicciones' && (
        <PrediccionesTab
          predicciones={predicciones}
          footballMatches={matches}
          onChange={onChangePredicciones}
          onDelete={onDeletePrediccion}
          refreshSignal={refreshSignal}
        />
      )}
      {sub === 'estadisticas' && <EstadisticasTab futbolConfig={data.futbol} />}
    </div>
  );
}
