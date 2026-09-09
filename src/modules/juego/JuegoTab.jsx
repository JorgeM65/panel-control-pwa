import { useState, useEffect, useRef } from 'react';

export function JuegoTab() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const gameRef = useRef(null);
  const lastTimeRef = useRef(null);
  const touchStartX = useRef(null);
  const [state, setState] = useState('idle');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  const W = 300, H = 440;
  const LANES = [W / 6, W / 2, (5 * W) / 6];

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get('juego_best', false);
        if (res) setBest(Number(res.value) || 0);
      } catch (e) { /* sin récord todavía */ }
    })();
    drawFrame();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function drawFrame() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const g = gameRef.current;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0A0F14';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(77,217,206,0.15)';
    ctx.lineWidth = 1;
    [W / 3, (2 * W) / 3].forEach(x => {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    });
    if (!g) return;
    ctx.fillStyle = '#4DD9CE';
    g.coins.forEach(c => {
      ctx.beginPath();
      ctx.arc(LANES[c.lane], c.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#E2637A';
    g.obstacles.forEach(o => {
      ctx.fillRect(LANES[o.lane] - 22, o.y - 13, 44, 26);
    });
    const px = LANES[g.lane];
    const py = H - 70;
    ctx.fillStyle = '#4DD9CE';
    ctx.shadowColor = 'rgba(77,217,206,0.6)';
    ctx.shadowBlur = 10;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(px - 17, py - 17, 34, 34, 8);
      ctx.fill();
    } else {
      ctx.fillRect(px - 17, py - 17, 34, 34);
    }
    ctx.shadowBlur = 0;
  }

  function loop(ts) {
    const g = gameRef.current;
    if (!g || !g.running) return;
    if (lastTimeRef.current === null) lastTimeRef.current = ts;
    const dt = Math.min((ts - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = ts;

    g.elapsed += dt;
    g.speed = 160 + g.elapsed * 7;
    g.spawnTimer -= dt;

    if (g.spawnTimer <= 0) {
      const lane = Math.floor(Math.random() * 3);
      if (Math.random() < 0.25) {
        g.coins.push({ lane, y: -20 });
      } else {
        g.obstacles.push({ lane, y: -20 });
      }
      g.spawnTimer = Math.max(0.45, 0.9 - g.elapsed * 0.01);
    }

    g.obstacles.forEach(o => { o.y += g.speed * dt; });
    g.coins.forEach(c => { c.y += g.speed * dt; });

    const playerY = H - 70;
    let crashed = false;
    for (const o of g.obstacles) {
      if (o.lane === g.lane && Math.abs(o.y - playerY) < 22) {
        crashed = true;
        break;
      }
    }
    for (const c of g.coins) {
      if (!c.taken && c.lane === g.lane && Math.abs(c.y - playerY) < 20) {
        c.taken = true;
        g.coinsCollected += 1;
      }
    }
    g.coins = g.coins.filter(c => !c.taken && c.y < H + 20);
    g.obstacles = g.obstacles.filter(o => o.y < H + 20);

    const liveScore = Math.floor(g.elapsed * 10) + g.coinsCollected * 15;
    setScore(liveScore);
    drawFrame();

    if (crashed) {
      g.running = false;
      finishGame(liveScore);
      return;
    }
    rafRef.current = requestAnimationFrame(loop);
  }

  function startGame() {
    gameRef.current = {
      lane: 1,
      obstacles: [],
      coins: [],
      speed: 160,
      elapsed: 0,
      spawnTimer: 0.6,
      coinsCollected: 0,
      running: true,
    };
    lastTimeRef.current = null;
    setScore(0);
    setState('playing');
    rafRef.current = requestAnimationFrame(loop);
  }

  async function finishGame(finalScore) {
    setState('over');
    if (finalScore > best) {
      setBest(finalScore);
      try {
        await window.storage.set('juego_best', String(finalScore), false);
      } catch (e) { /* no se pudo guardar el récord */ }
    }
  }

  function moveLane(dir) {
    const g = gameRef.current;
    if (!g || !g.running) return;
    g.lane = Math.min(2, Math.max(0, g.lane + dir));
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 30) moveLane(dx > 0 ? 1 : -1);
    touchStartX.current = null;
  }

  return (
    <div className="module-panel">
      <div className="section-head">
        <span className="section-label">Esquiva</span>
        <span className="game-best">Mejor: {best}</span>
      </div>

      <div className="game-wrap">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="game-canvas"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />
        {state !== 'playing' && (
          <div className="game-overlay">
            {state === 'over' && (
              <>
                <span className="game-over-score">{score} pts</span>
                <span className="game-over-label">{score >= best && score > 0 ? '¡Nuevo récord!' : 'Fin de la partida'}</span>
              </>
            )}
            <button type="button" className="primary-btn" onClick={startGame}>
              {state === 'idle' ? 'Jugar' : 'Reintentar'}
            </button>
          </div>
        )}
      </div>

      {state === 'playing' && <div className="game-score-live">{score} pts</div>}

      <div className="game-controls">
        <button type="button" className="game-btn" onClick={() => moveLane(-1)} disabled={state !== 'playing'} aria-label="Carril izquierdo">‹</button>
        <button type="button" className="game-btn" onClick={() => moveLane(1)} disabled={state !== 'playing'} aria-label="Carril derecho">›</button>
      </div>
      <p className="game-hint">Desliza o usa los botones para cambiar de carril y esquivar</p>
    </div>
  );
}
