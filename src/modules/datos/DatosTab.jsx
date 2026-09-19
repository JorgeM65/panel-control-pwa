import { dateKey, addDays } from '../../utils/dates';

export function DatosTab({ tasks, habits, capsulas }) {
  const done = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);

  const last14 = Array.from({ length: 14 }, (_, i) => dateKey(addDays(new Date(), i - 13)));
  const totalHabits = habits.length;

  function dayIntensity(dk) {
    if (totalHabits === 0) return 0;
    const count = habits.filter(h => h.dates.includes(dk)).length;
    return count / totalHabits;
  }

  const longestStreak = habits.reduce((max, h) => {
    const sortedDates = [...h.dates].sort();
    let longest = 0, current = 0, prevDate = null;
    for (const dk of sortedDates) {
      if (prevDate) {
        const diff = (new Date(dk) - new Date(prevDate)) / 86400000;
        current = diff === 1 ? current + 1 : 1;
      } else {
        current = 1;
      }
      longest = Math.max(longest, current);
      prevDate = dk;
    }
    return Math.max(max, longest);
  }, 0);

  const openedCapsulas = capsulas.filter(c => c.opened).length;
  const totalCapsulas = capsulas.length;

  return (
    <div className="module-panel">
      <div className="stat-grid">
        <div className="stat-box tech-frame">
          <span className="stat-value">{completionRate}%</span>
          <span className="stat-label">Tareas completadas</span>
        </div>
        <div className="stat-box tech-frame">
          <span className="stat-value">{longestStreak}</span>
          <span className="stat-label">Racha máxima</span>
        </div>
        <div className="stat-box tech-frame">
          <span className="stat-value">{openedCapsulas}/{totalCapsulas}</span>
          <span className="stat-label">Cápsulas abiertas</span>
        </div>
      </div>

      {habits.length > 0 ? (
        <div>
          <span className="section-label">Actividad · últimos 14 días</span>
          <div className="heatmap">
            {last14.map(dk => (
              <div key={dk} className="heatmap-cell" style={{ '--intensity': dayIntensity(dk) }} title={dk} />
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state">Usa tareas y hábitos unos días y aquí verás tus patrones.</div>
      )}
    </div>
  );
}
