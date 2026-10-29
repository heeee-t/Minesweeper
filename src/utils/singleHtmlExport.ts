/**
 * Generates a complete standalone single HTML file with embedded HTML, CSS, and JS.
 * Fully functional offline for students on school tablets / Chromebooks.
 */
export function generateSingleHtmlString(): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>스쿨 마인스위퍼 - 태블릿 지뢰찾기</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-user-select: none;
      user-select: none;
      -webkit-touch-callout: none;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    body {
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      height: 100vh;
      overflow: hidden;
      color: #1e293b;
    }
    .game-window {
      background-color: #cbd5e1;
      border: 3px solid #f8fafc;
      border-right-color: #64748b;
      border-bottom-color: #64748b;
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 98vh;
      max-width: 98vw;
    }
    .header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .title {
      font-size: 1.1rem;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .difficulty-group {
      display: flex;
      background: #e2e8f0;
      border: 2px solid #64748b;
      border-right-color: #f8fafc;
      border-bottom-color: #f8fafc;
      padding: 2px;
      border-radius: 6px;
      gap: 2px;
    }
    .diff-btn {
      background: transparent;
      border: none;
      padding: 6px 10px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      border-radius: 4px;
      color: #475569;
      touch-action: manipulation;
    }
    .diff-btn.active {
      background: #0284c7;
      color: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .hud-panel {
      background: #94a3b8;
      border: 2px solid #64748b;
      border-right-color: #f8fafc;
      border-bottom-color: #f8fafc;
      padding: 8px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-radius: 6px;
    }
    .led-display {
      background: #000000;
      color: #ef4444;
      font-family: "Courier New", Courier, monospace;
      font-size: 26px;
      font-weight: 900;
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 2px;
      border: 2px solid #475569;
      border-right-color: #e2e8f0;
      border-bottom-color: #e2e8f0;
      min-width: 62px;
      text-align: center;
    }
    .face-btn {
      background: #f8fafc;
      border: 3px solid #ffffff;
      border-right-color: #64748b;
      border-bottom-color: #64748b;
      font-size: 24px;
      width: 44px;
      height: 44px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      touch-action: manipulation;
    }
    .face-btn:active {
      border: 3px solid #64748b;
      border-right-color: #ffffff;
      border-bottom-color: #ffffff;
      transform: translateY(1px);
    }
    .mode-switch-wrapper {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .mode-switch {
      display: flex;
      background: #94a3b8;
      padding: 3px;
      border-radius: 8px;
      gap: 4px;
      border: 2px solid #64748b;
      border-right-color: #ffffff;
      border-bottom-color: #ffffff;
    }
    .mode-btn {
      flex: 1;
      padding: 10px 14px;
      border: 2px solid transparent;
      border-radius: 6px;
      font-size: 15px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      touch-action: manipulation;
      transition: all 0.15s ease;
    }
    .mode-btn.dig.active {
      background: #0284c7;
      color: #ffffff;
      border-color: #bae6fd;
      box-shadow: 0 2px 6px rgba(2, 132, 199, 0.4);
    }
    .mode-btn.flag.active {
      background: #e11d48;
      color: #ffffff;
      border-color: #fecdd3;
      box-shadow: 0 2px 6px rgba(225, 29, 72, 0.4);
    }
    .mode-btn:not(.active) {
      background: #e2e8f0;
      color: #334155;
    }
    .mode-tip {
      font-size: 11px;
      font-weight: 600;
      text-align: center;
      color: #475569;
    }
    .board-container {
      background: #94a3b8;
      border: 3px solid #64748b;
      border-right-color: #ffffff;
      border-bottom-color: #ffffff;
      padding: 4px;
      border-radius: 6px;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0 auto;
    }
    .grid {
      display: grid;
      gap: 1.5px;
      background: #64748b;
      padding: 1.5px;
    }
    .cell {
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      cursor: pointer;
      touch-action: manipulation;
      border-radius: 2px;
      font-family: inherit;
    }
    .cell.closed {
      background: #e2e8f0;
      border: 2.5px solid #ffffff;
      border-right-color: #64748b;
      border-bottom-color: #64748b;
    }
    .cell.closed:active {
      border: 1px solid #94a3b8;
      background: #cbd5e1;
    }
    .cell.opened {
      background: #cbd5e1;
      border: 1px solid #94a3b8;
    }
    .cell.mine-hit {
      background: #ef4444 !important;
      border: 1px solid #b91c1c;
    }
    .num-1 { color: #2563eb; }
    .num-2 { color: #16a34a; }
    .num-3 { color: #dc2626; }
    .num-4 { color: #4f46e5; }
    .num-5 { color: #7c2d12; }
    .num-6 { color: #0891b2; }
    .num-7 { color: #0f172a; }
    .num-8 { color: #64748b; }
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 100;
      backdrop-filter: blur(2px);
    }
    .modal-card {
      background: #f8fafc;
      border: 3px solid #ffffff;
      border-right-color: #64748b;
      border-bottom-color: #64748b;
      padding: 24px 32px;
      border-radius: 12px;
      text-align: center;
      max-width: 320px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
    }
    .modal-card h2 {
      font-size: 22px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    .modal-card p {
      font-size: 14px;
      color: #475569;
      margin-bottom: 18px;
    }
    .primary-btn {
      background: #0284c7;
      color: white;
      border: 2px solid #bae6fd;
      padding: 10px 22px;
      font-size: 15px;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="game-window">
    <div class="header-bar">
      <div class="title">💣 스쿨 마인스위퍼</div>
      <div class="difficulty-group">
        <button class="diff-btn active" onclick="setDifficulty('EASY')">이지</button>
        <button class="diff-btn" onclick="setDifficulty('NORMAL')">노말</button>
        <button class="diff-btn" onclick="setDifficulty('HARD')">하드</button>
        <button class="diff-btn" onclick="setDifficulty('EXPERT')">최상위</button>
      </div>
    </div>

    <div class="hud-panel">
      <div class="led-display" id="mine-count">010</div>
      <button class="face-btn" id="face-btn" onclick="resetGame()">😊</button>
      <div class="led-display" id="timer">000</div>
    </div>

    <div class="mode-switch-wrapper">
      <div class="mode-switch">
        <button class="mode-btn dig active" id="btn-mode-dig" onclick="setMode('DIG')">
          ⛏️ 칸 열기 모드
        </button>
        <button class="mode-btn flag" id="btn-mode-flag" onclick="setMode('FLAG')">
          🚩 깃발 꽂기 모드
        </button>
      </div>
      <div class="mode-tip" id="mode-tip">💡 칸 열기 모드: 터치하면 칸이 열립니다. (길게 누르면 깃발 꽂기)</div>
    </div>

    <div class="board-container">
      <div class="grid" id="board-grid"></div>
    </div>
  </div>

  <div class="modal-overlay" id="result-modal">
    <div class="modal-card">
      <h2 id="modal-title">🎉 승리!</h2>
      <p id="modal-desc">모든 지뢰를 성공적으로 찾았습니다!</p>
      <button class="primary-btn" onclick="closeModalAndReset()">다시 하기</button>
    </div>
  </div>

  <script>
    const CONFIGS = {
      EASY: { rows: 8, cols: 8, mines: 10 },
      NORMAL: { rows: 12, cols: 12, mines: 25 },
      HARD: { rows: 16, cols: 16, mines: 40 },
      EXPERT: { rows: 20, cols: 20, mines: 80 }
    };

    let currentDiff = 'EASY';
    let currentMode = 'DIG';
    let board = [];
    let gameStatus = 'READY';
    let timerVal = 0;
    let timerInterval = null;
    let flagsCount = 0;

    function setDifficulty(diff) {
      currentDiff = diff;
      document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.includes(
          diff === 'EASY' ? '이지' : diff === 'NORMAL' ? '노말' : diff === 'HARD' ? '하드' : '최상위'
        ));
      });
      resetGame();
    }

    function setMode(mode) {
      currentMode = mode;
      document.getElementById('btn-mode-dig').classList.toggle('active', mode === 'DIG');
      document.getElementById('btn-mode-flag').classList.toggle('active', mode === 'FLAG');
      document.getElementById('mode-tip').textContent = mode === 'DIG' 
        ? '💡 칸 열기 모드: 터치하면 칸이 열립니다. (길게 누르면 깃발)' 
        : '🚩 깃발 꽂기 모드: 터치하면 깃발을 꽂습니다. (오터치 방지)';
    }

    function resetGame() {
      clearInterval(timerInterval);
      timerInterval = null;
      timerVal = 0;
      gameStatus = 'READY';
      flagsCount = 0;
      updateLEDs();
      document.getElementById('face-btn').textContent = '😊';
      document.getElementById('result-modal').style.display = 'none';

      const cfg = CONFIGS[currentDiff];
      board = [];
      for (let r = 0; r < cfg.rows; r++) {
        const row = [];
        for (let c = 0; c < cfg.cols; c++) {
          row.push({ row: r, col: c, isMine: false, isOpen: false, isFlagged: false, neighborMines: 0 });
        }
        board.push(row);
      }
      renderBoard();
    }

    function updateLEDs() {
      const cfg = CONFIGS[currentDiff];
      const remaining = Math.max(-99, cfg.mines - flagsCount);
      document.getElementById('mine-count').textContent = String(remaining).padStart(3, '0');
      document.getElementById('timer').textContent = String(Math.min(999, timerVal)).padStart(3, '0');
    }

    function renderBoard() {
      const cfg = CONFIGS[currentDiff];
      const grid = document.getElementById('board-grid');
      grid.style.gridTemplateColumns = \`repeat(\${cfg.cols}, 1fr)\`;
      
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const availableH = vh - 220;
      const availableW = vw - 36;
      const cellH = Math.floor(availableH / cfg.rows);
      const cellW = Math.floor(availableW / cfg.cols);
      const cellSize = Math.max(22, Math.min(48, Math.min(cellH, cellW)));
      
      grid.innerHTML = '';
      for (let r = 0; r < cfg.rows; r++) {
        for (let c = 0; c < cfg.cols; c++) {
          const cell = board[r][c];
          const div = document.createElement('div');
          div.className = 'cell ' + (cell.isOpen ? 'opened' : 'closed');
          div.style.width = cellSize + 'px';
          div.style.height = cellSize + 'px';
          div.style.fontSize = Math.max(12, Math.floor(cellSize * 0.55)) + 'px';

          if (cell.isOpen) {
            if (cell.isMine) {
              div.textContent = '💣';
              if (cell.isTriggered) div.classList.add('mine-hit');
            } else if (cell.neighborMines > 0) {
              div.textContent = cell.neighborMines;
              div.classList.add('num-' + cell.neighborMines);
            }
          } else if (cell.isFlagged) {
            div.textContent = '🚩';
          }

          let pressTimer = null;
          let hasLongPressed = false;

          div.addEventListener('pointerdown', (e) => {
            if (gameStatus === 'LOST' || gameStatus === 'WON') return;
            hasLongPressed = false;
            pressTimer = setTimeout(() => {
              hasLongPressed = true;
              toggleFlagCell(r, c);
              if (navigator.vibrate) navigator.vibrate(40);
            }, 350);
          });

          div.addEventListener('pointerup', (e) => {
            if (pressTimer) clearTimeout(pressTimer);
            if (!hasLongPressed) {
              handleCellClick(r, c);
            }
          });

          div.addEventListener('pointercancel', () => {
            if (pressTimer) clearTimeout(pressTimer);
          });

          grid.appendChild(div);
        }
      }
    }

    function handleCellClick(r, c) {
      if (gameStatus === 'LOST' || gameStatus === 'WON') return;
      if (currentMode === 'FLAG') {
        toggleFlagCell(r, c);
      } else {
        openCell(r, c);
      }
    }

    function toggleFlagCell(r, c) {
      const cell = board[r][c];
      if (cell.isOpen) return;
      cell.isFlagged = !cell.isFlagged;
      flagsCount += cell.isFlagged ? 1 : -1;
      updateLEDs();
      renderBoard();
    }

    function openCell(r, c) {
      const cell = board[r][c];
      if (cell.isOpen || cell.isFlagged) return;

      if (gameStatus === 'READY') {
        generateMines(r, c);
        gameStatus = 'PLAYING';
        timerInterval = setInterval(() => {
          timerVal++;
          updateLEDs();
          if (timerVal >= 999) clearInterval(timerInterval);
        }, 1000);
      }

      if (cell.isMine) {
        gameOver(cell);
        return;
      }

      floodFill(r, c);
      checkWin();
      renderBoard();
    }

    function generateMines(safeR, safeC) {
      const cfg = CONFIGS[currentDiff];
      const DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
      const safe = new Set();
      safe.add(\`\${safeR},\${safeC}\`);
      for (const [dr, dc] of DIRS) {
        const nr = safeR + dr, nc = safeC + dc;
        if (nr >= 0 && nr < cfg.rows && nc >= 0 && nc < cfg.cols) safe.add(\`\${nr},\${nc}\`);
      }

      const available = [];
      for (let r = 0; r < cfg.rows; r++) {
        for (let c = 0; c < cfg.cols; c++) {
          if (!safe.has(\`\${r},\${c}\`)) available.push([r, c]);
        }
      }
      for (let i = available.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [available[i], available[j]] = [available[j], available[i]];
      }

      for (let i = 0; i < cfg.mines; i++) {
        const [mr, mc] = available[i];
        board[mr][mc].isMine = true;
      }

      for (let r = 0; r < cfg.rows; r++) {
        for (let c = 0; c < cfg.cols; c++) {
          if (board[r][c].isMine) continue;
          let count = 0;
          for (const [dr, dc] of DIRS) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < cfg.rows && nc >= 0 && nc < cfg.cols && board[nr][nc].isMine) count++;
          }
          board[r][c].neighborMines = count;
        }
      }
    }

    function floodFill(r, c) {
      const cfg = CONFIGS[currentDiff];
      const DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
      const queue = [[r, c]];
      board[r][c].isOpen = true;

      while (queue.length > 0) {
        const [cr, cc] = queue.shift();
        const cur = board[cr][cc];
        if (cur.neighborMines === 0) {
          for (const [dr, dc] of DIRS) {
            const nr = cr + dr, nc = cc + dc;
            if (nr >= 0 && nr < cfg.rows && nc >= 0 && nc < cfg.cols) {
              const nb = board[nr][nc];
              if (!nb.isOpen && !nb.isFlagged && !nb.isMine) {
                nb.isOpen = true;
                if (nb.neighborMines === 0) queue.push([nr, nc]);
              }
            }
          }
        }
      }
    }

    function gameOver(hitCell) {
      gameStatus = 'LOST';
      clearInterval(timerInterval);
      hitCell.isTriggered = true;
      document.getElementById('face-btn').textContent = '😵';

      const cfg = CONFIGS[currentDiff];
      for (let r = 0; r < cfg.rows; r++) {
        for (let c = 0; c < cfg.cols; c++) {
          const cell = board[r][c];
          if (cell.isMine) cell.isOpen = true;
        }
      }
      renderBoard();
      setTimeout(() => {
        document.getElementById('modal-title').textContent = '💥 지뢰 폭발!';
        document.getElementById('modal-desc').textContent = '아쉽게도 지뢰를 밟았습니다. 다시 도전해보세요!';
        document.getElementById('result-modal').style.display = 'flex';
      }, 500);
    }

    function checkWin() {
      const cfg = CONFIGS[currentDiff];
      let openCount = 0;
      for (let r = 0; r < cfg.rows; r++) {
        for (let c = 0; c < cfg.cols; c++) {
          if (board[r][c].isOpen && !board[r][c].isMine) openCount++;
        }
      }
      if (openCount === cfg.rows * cfg.cols - cfg.mines) {
        gameStatus = 'WON';
        clearInterval(timerInterval);
        document.getElementById('face-btn').textContent = '😎';
        renderBoard();
        setTimeout(() => {
          document.getElementById('modal-title').textContent = '🎉 미션 완수!';
          document.getElementById('modal-desc').textContent = \`\${timerVal}초 만에 모든 지뢰를 피하고 승리했습니다!\`;
          document.getElementById('result-modal').style.display = 'flex';
        }, 400);
      }
    }

    function closeModalAndReset() {
      document.getElementById('result-modal').style.display = 'none';
      resetGame();
    }

    window.addEventListener('resize', renderBoard);
    resetGame();
  </script>
</body>
</html>`;
}
