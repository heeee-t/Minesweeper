import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  HelpCircle,
  Download,
  RotateCcw,
  Flag,
  Pickaxe,
  Trophy,
  AlertTriangle,
  X,
  CheckCircle2,
} from 'lucide-react';
import {
  DIFFICULTIES,
  DifficultyKey,
  TouchMode,
  GameStatus,
  CellData,
} from './types/game';
import {
  createInitialBoard,
  placeMines,
  revealCell,
  chordCell,
  toggleFlag,
  checkVictory,
  autoFlagRemainingMines,
} from './utils/mineLogic';
import { soundManager } from './utils/sound';
import { generateSingleHtmlString } from './utils/singleHtmlExport';

export default function App() {
  // Game Configuration State
  const [difficulty, setDifficulty] = useState<DifficultyKey>('EASY');
  const [touchMode, setTouchMode] = useState<TouchMode>('DIG');
  const [board, setBoard] = useState<CellData[][]>(() =>
    createInitialBoard(DIFFICULTIES.EASY.rows, DIFFICULTIES.EASY.cols)
  );
  const [gameStatus, setGameStatus] = useState<GameStatus>('READY');
  const [timer, setTimer] = useState<number>(0);
  const [isFacePressed, setIsFacePressed] = useState<boolean>(false);
  const [isHoldingCell, setIsHoldingCell] = useState<boolean>(false);

  // Settings & Modals
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);

  // Sizing ref for board responsiveness
  const boardAreaRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState<number>(44);

  // Confetti Canvas ref
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Long press timer ref for mobile touch
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredRef = useRef<boolean>(false);

  const activeConfig = DIFFICULTIES[difficulty];

  // Calculate flagged count
  const flaggedCount = board.reduce(
    (acc, row) => acc + row.filter((c) => c.isFlagged).length,
    0
  );
  const remainingMines = activeConfig.mines - flaggedCount;

  // Calculate dynamic cell size to perfectly fit tablet screen without scrolling
  const updateCellSize = useCallback(() => {
    if (!boardAreaRef.current) return;
    const { clientWidth, clientHeight } = boardAreaRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;

    // Available space accounting for grid padding
    const maxAvailableWidth = clientWidth - 16;
    const maxAvailableHeight = clientHeight - 16;

    const widthPerCell = Math.floor(maxAvailableWidth / activeConfig.cols);
    const heightPerCell = Math.floor(maxAvailableHeight / activeConfig.rows);

    let optimal = Math.min(widthPerCell, heightPerCell);

    // Clamp based on difficulty to keep touch target friendly
    if (activeConfig.cols <= 8) {
      optimal = Math.min(68, Math.max(38, optimal));
    } else if (activeConfig.cols <= 12) {
      optimal = Math.min(54, Math.max(32, optimal));
    } else if (activeConfig.cols <= 16) {
      optimal = Math.min(44, Math.max(26, optimal));
    } else {
      optimal = Math.min(36, Math.max(20, optimal));
    }

    setCellSize(optimal);
  }, [activeConfig.cols, activeConfig.rows]);

  useEffect(() => {
    updateCellSize();
    window.addEventListener('resize', updateCellSize);
    return () => window.removeEventListener('resize', updateCellSize);
  }, [updateCellSize]);

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (gameStatus === 'PLAYING') {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev >= 999) return 999;
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameStatus]);

  // Reset Game
  const startNewGame = useCallback(
    (diffKey?: DifficultyKey) => {
      const cfg = DIFFICULTIES[diffKey || difficulty];
      setGameStatus('READY');
      setTimer(0);
      setBoard(createInitialBoard(cfg.rows, cfg.cols));
      setShowResultModal(false);
      setIsFacePressed(false);
      setIsHoldingCell(false);
    },
    [difficulty]
  );

  // Change Difficulty
  const handleDifficultyChange = (key: DifficultyKey) => {
    if (key === difficulty && gameStatus === 'READY') return;
    setDifficulty(key);
    startNewGame(key);
  };

  // Sound Toggle
  const handleSoundToggle = () => {
    const next = soundManager.toggleSound();
    setSoundOn(next);
  };

  // Fullscreen Toggle
  const toggleFullscreenMode = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Trigger Confetti Animation
  const fireConfetti = useCallback(() => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      r: number;
      d: number;
      color: string;
      tilt: number;
      tiltAngle: number;
      tiltAngleIncremental: number;
    }> = [];

    const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
    for (let i = 0; i < 90; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 8 + 4,
        d: Math.random() * 40 + 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.floor(Math.random() * 10) - 10,
        tiltAngle: 0,
        tiltAngleIncremental: (Math.random() * 0.07) + 0.05,
      });
    }

    let animationFrame: number;
    let frameCount = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frameCount++;

      particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(frameCount / 20) + 3 + p.r / 3);
        p.x += Math.sin(frameCount / 30) * 2;
        p.tilt = Math.sin(p.tiltAngle) * 12;

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
        ctx.stroke();
      });

      if (frameCount < 160) {
        animationFrame = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    render();
  }, []);

  // Handle Victory
  const handleVictory = useCallback(
    (finalBoard: CellData[][]) => {
      setGameStatus('WON');
      const flagged = autoFlagRemainingMines(finalBoard);
      setBoard(flagged);
      soundManager.playWin();
      fireConfetti();
      setShowResultModal(true);
    },
    [fireConfetti]
  );

  // Handle Defeat
  const handleDefeat = useCallback((finalBoard: CellData[][]) => {
    setGameStatus('LOST');
    setBoard(finalBoard);
    soundManager.playExplode();
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    setTimeout(() => {
      setShowResultModal(true);
    }, 600);
  }, []);

  // Handle Digging / Opening a cell
  const executeDig = (r: number, c: number) => {
    let currentBoard = board;

    // First touch safe guarantee: generate mines after first click
    if (gameStatus === 'READY') {
      currentBoard = placeMines(board, r, c, activeConfig.mines);
      setGameStatus('PLAYING');
    }

    const { nextBoard, hitMine, hasCascade } = revealCell(currentBoard, r, c);

    if (hitMine) {
      handleDefeat(nextBoard);
      return;
    }

    if (hasCascade) {
      soundManager.playCascade();
    } else {
      soundManager.playClick();
    }

    setBoard(nextBoard);

    if (checkVictory(nextBoard, activeConfig.mines)) {
      handleVictory(nextBoard);
    }
  };

  // Handle Flagging a cell
  const executeFlag = (r: number, c: number) => {
    if (board[r][c].isOpen) return;

    soundManager.playFlag();
    if (navigator.vibrate) navigator.vibrate(30);

    const nextBoard = toggleFlag(board, r, c);
    setBoard(nextBoard);
  };

  // Handle Chord (clicking an opened number with matching neighbor flags)
  const executeChord = (r: number, c: number) => {
    const { nextBoard, hitMine, openedSomething } = chordCell(board, r, c);
    if (!openedSomething) return;

    if (hitMine) {
      handleDefeat(nextBoard);
      return;
    }

    soundManager.playClick();
    setBoard(nextBoard);

    if (checkVictory(nextBoard, activeConfig.mines)) {
      handleVictory(nextBoard);
    }
  };

  // Primary Cell Tap Dispatcher
  const handleCellTap = (r: number, c: number) => {
    if (gameStatus === 'LOST' || gameStatus === 'WON') return;

    const cell = board[r][c];

    // If cell is already open and has numbers, try chording
    if (cell.isOpen && cell.neighborMines > 0) {
      executeChord(r, c);
      return;
    }

    // According to selected touch mode:
    if (touchMode === 'FLAG') {
      executeFlag(r, c);
    } else {
      executeDig(r, c);
    }
  };

  // Pointer Down (for smiley face feedback & long press)
  const handlePointerDown = (r: number, c: number) => {
    if (gameStatus === 'LOST' || gameStatus === 'WON') return;
    setIsHoldingCell(true);
    longPressTriggeredRef.current = false;

    // 350ms long press flips mode (e.g. if in DIG mode, long-press flags; if in FLAG mode, long-press digs!)
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      if (touchMode === 'DIG') {
        executeFlag(r, c);
      } else {
        executeDig(r, c);
      }
    }, 380);
  };

  const handlePointerUp = (r: number, c: number) => {
    setIsHoldingCell(false);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!longPressTriggeredRef.current) {
      handleCellTap(r, c);
    }
  };

  const handlePointerCancel = () => {
    setIsHoldingCell(false);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Export single HTML download
  const handleDownloadSingleHtml = () => {
    const html = generateSingleHtmlString();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `스쿨_지뢰찾기_태블릿용_${difficulty.toLowerCase()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Face Emoji Indicator
  const getFaceEmoji = () => {
    if (isFacePressed) return '😮';
    if (gameStatus === 'LOST') return '😵';
    if (gameStatus === 'WON') return '😎';
    if (isHoldingCell) return '😮';
    return '😊';
  };

  // Format 3-digit number for retro LED
  const formatLedNumber = (val: number) => {
    if (val < 0) {
      const positiveStr = Math.min(99, Math.abs(val)).toString().padStart(2, '0');
      return `-${positiveStr}`;
    }
    const clamped = Math.min(999, val);
    return clamped.toString().padStart(3, '0');
  };

  // Number Color Style Map
  const getNumberColorClass = (n: number) => {
    switch (n) {
      case 1:
        return 'text-blue-600';
      case 2:
        return 'text-emerald-600';
      case 3:
        return 'text-rose-600';
      case 4:
        return 'text-indigo-800';
      case 5:
        return 'text-amber-900';
      case 6:
        return 'text-teal-600';
      case 7:
        return 'text-purple-900';
      case 8:
        return 'text-slate-700';
      default:
        return 'text-slate-800';
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-between bg-slate-200 select-none overflow-hidden p-2 sm:p-3 text-slate-800">
      {/* Confetti Canvas for Victory */}
      <canvas
        ref={confettiCanvasRef}
        className="pointer-events-none fixed inset-0 z-50 w-full h-full"
      />

      {/* Main Container Card (Retro Classic Desktop/Tablet Frame) */}
      <div className="w-full max-w-4xl h-full flex flex-col bg-slate-300 border-4 border-t-white border-l-white border-r-slate-600 border-b-slate-600 rounded-xl shadow-xl overflow-hidden p-2 sm:p-3.5">
        
        {/* Top Header Zone: Title & Quick Utilities */}
        <header className="flex items-center justify-between gap-2 pb-2 border-b-2 border-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl" role="img" aria-label="bomb">
              💣
            </span>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 whitespace-nowrap">
              스쿨 마인스위퍼
            </h1>
            <span className="hidden md:inline-block text-xs font-semibold px-2 py-0.5 bg-sky-100 text-sky-800 rounded border border-sky-300">
              태블릿 교실용
            </span>
          </div>

          {/* Utility buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setShowHelp(true)}
              className="p-1.5 sm:p-2 bg-slate-100 hover:bg-white text-slate-700 rounded-lg border border-slate-400 active:scale-95 transition-transform flex items-center justify-center"
              title="게임 방법 및 팁"
              aria-label="게임 방법"
            >
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600" />
            </button>
            <button
              onClick={handleSoundToggle}
              className="p-1.5 sm:p-2 bg-slate-100 hover:bg-white text-slate-700 rounded-lg border border-slate-400 active:scale-95 transition-transform flex items-center justify-center"
              title={soundOn ? '효과음 끄기' : '효과음 켜기'}
              aria-label="효과음 토글"
            >
              {soundOn ? (
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              ) : (
                <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              )}
            </button>
            <button
              onClick={toggleFullscreenMode}
              className="p-1.5 sm:p-2 bg-slate-100 hover:bg-white text-slate-700 rounded-lg border border-slate-400 active:scale-95 transition-transform flex items-center justify-center"
              title={isFullscreen ? '전체화면 종료' : '전체화면 모드'}
              aria-label="전체화면 토글"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
              ) : (
                <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
              )}
            </button>
            <button
              onClick={handleDownloadSingleHtml}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
              title="인터넷 없이 태블릿에 저장해서 플레이할 수 있는 단일 HTML 다운로드"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">단일 HTML 저장</span>
              <span className="sm:hidden">저장</span>
            </button>
          </div>
        </header>

        {/* Difficulty Bar: 4-Segmented Control (Easy, Normal, Hard, Expert) */}
        <div className="py-2 flex items-center justify-center">
          <div className="w-full flex items-center justify-between p-1 bg-slate-400/50 rounded-xl border-2 border-slate-500 gap-1 overflow-x-auto">
            {(Object.keys(DIFFICULTIES) as DifficultyKey[]).map((key) => {
              const cfg = DIFFICULTIES[key];
              const isSelected = difficulty === key;
              return (
                <button
                  key={key}
                  onClick={() => handleDifficultyChange(key)}
                  className={`flex-1 min-w-[70px] py-1.5 sm:py-2 px-2 text-center rounded-lg font-bold text-xs sm:text-sm transition-all whitespace-nowrap active:scale-[0.98] ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-md border-b-2 border-sky-800'
                      : 'bg-slate-200 text-slate-700 hover:bg-white border border-slate-300'
                  }`}
                >
                  <div>{cfg.label.split(' ')[0]}</div>
                  <div className="text-[10px] sm:text-xs opacity-80 hidden xs:block">
                    {cfg.rows}×{cfg.cols} ({cfg.mines})
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Retro HUD Display Bar (Mines Counter · Smiley Reset Face · Timer) */}
        <div className="bg-slate-300 border-2 border-slate-500 rounded-lg p-2 flex items-center justify-between mb-2 retro-box-sunken">
          {/* Mine Remaining LED */}
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-bold text-slate-600 tracking-wider uppercase mb-0.5">
              남은 지뢰
            </span>
            <div className="bg-black text-rose-500 led-font px-2 py-0.5 rounded text-xl sm:text-2xl font-black border border-slate-700 shadow-inner">
              {formatLedNumber(remainingMines)}
            </div>
          </div>

          {/* Classic Face Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => startNewGame()}
              onMouseDown={() => setIsFacePressed(true)}
              onMouseUp={() => setIsFacePressed(false)}
              onTouchStart={() => setIsFacePressed(true)}
              onTouchEnd={() => setIsFacePressed(false)}
              className="w-11 h-11 sm:w-13 sm:h-13 bg-amber-200 hover:bg-amber-100 rounded-xl flex items-center justify-center text-2xl sm:text-3xl border-3 border-t-white border-l-white border-r-slate-600 border-b-slate-600 active:border-t-slate-600 active:border-l-slate-600 active:border-r-white active:border-b-white active:translate-y-0.5 transition-transform shadow-md cursor-pointer"
              title="새 게임 시작 (클릭하여 다시 하기)"
              aria-label="새 게임 리셋"
            >
              {getFaceEmoji()}
            </button>
          </div>

          {/* Timer LED */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-600 tracking-wider uppercase mb-0.5">
              진행 시간
            </span>
            <div className="bg-black text-rose-500 led-font px-2 py-0.5 rounded text-xl sm:text-2xl font-black border border-slate-700 shadow-inner">
              {formatLedNumber(timer)}
            </div>
          </div>
        </div>

        {/* CORE REQUIREMENT 3: Tablet Touch Mode Toggle Switch */}
        <div className="mb-2">
          <div className="bg-slate-400/40 p-1 rounded-xl border border-slate-400 flex items-center gap-1.5">
            {/* Dig Mode Button */}
            <button
              onClick={() => setTouchMode('DIG')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 px-3 rounded-lg font-black text-sm sm:text-base transition-all active:scale-[0.98] cursor-pointer ${
                touchMode === 'DIG'
                  ? 'bg-sky-600 text-white shadow-lg border-2 border-sky-300 ring-2 ring-sky-400/40 scale-[1.01]'
                  : 'bg-slate-100 text-slate-700 hover:bg-white border border-slate-300'
              }`}
            >
              <Pickaxe className={`w-5 h-5 ${touchMode === 'DIG' ? 'animate-bounce' : 'text-slate-500'}`} />
              <span>⛏️ 칸 열기 모드</span>
            </button>

            {/* Flag Mode Button */}
            <button
              onClick={() => setTouchMode('FLAG')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 px-3 rounded-lg font-black text-sm sm:text-base transition-all active:scale-[0.98] cursor-pointer ${
                touchMode === 'FLAG'
                  ? 'bg-rose-600 text-white shadow-lg border-2 border-rose-300 ring-2 ring-rose-400/40 scale-[1.01]'
                  : 'bg-slate-100 text-slate-700 hover:bg-white border border-slate-300'
              }`}
            >
              <Flag className={`w-5 h-5 ${touchMode === 'FLAG' ? 'animate-pulse' : 'text-slate-500'}`} />
              <span>🚩 깃발 꽂기 모드</span>
            </button>
          </div>

          {/* Micro Helper Tip for Students */}
          <div className="text-center text-[11px] sm:text-xs font-semibold text-slate-600 mt-1 flex items-center justify-center gap-1">
            {touchMode === 'DIG' ? (
              <span>💡 <strong className="text-sky-700 font-bold">칸 열기 모드</strong>: 화면을 터치하면 칸을 열고 지뢰를 탐색합니다. (0.35초 길게 누르면 깃발)</span>
            ) : (
              <span>🚩 <strong className="text-rose-700 font-bold">깃발 꽂기 모드</strong>: 지뢰가 의심되는 칸을 안전하게 깃발로 표시합니다.</span>
            )}
          </div>
        </div>

        {/* Board Arena (Center Stage, Perfectly Fitted to Viewport) */}
        <div
          ref={boardAreaRef}
          className="flex-1 flex items-center justify-center overflow-hidden bg-slate-400/30 rounded-xl border-3 border-slate-500 retro-box-sunken p-1 sm:p-2 min-h-0"
        >
          <div
            className="grid gap-[2px] bg-slate-500 p-[3px] rounded-lg shadow-inner select-none"
            style={{
              gridTemplateColumns: `repeat(${activeConfig.cols}, minmax(0, 1fr))`,
              width: `${cellSize * activeConfig.cols + (activeConfig.cols - 1) * 2 + 6}px`,
              height: `${cellSize * activeConfig.rows + (activeConfig.rows - 1) * 2 + 6}px`,
            }}
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isOpen = cell.isOpen;
                const isFlagged = cell.isFlagged;
                const isMine = cell.isMine;
                const isHit = cell.isTriggeredMine;
                const isFalseFlag = cell.isFalseFlag;
                const num = cell.neighborMines;

                return (
                  <button
                    key={`${r}-${c}`}
                    style={{
                      width: `${cellSize}px`,
                      height: `${cellSize}px`,
                      fontSize: `${Math.max(12, Math.floor(cellSize * 0.52))}px`,
                    }}
                    onPointerDown={() => handlePointerDown(r, c)}
                    onPointerUp={() => handlePointerUp(r, c)}
                    onPointerCancel={handlePointerCancel}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      executeFlag(r, c);
                    }}
                    className={`flex items-center justify-center rounded-[3px] font-black leading-none transition-colors duration-75 active:scale-[0.96] ${
                      isOpen
                        ? isHit
                          ? 'bg-rose-500 text-white retro-cell-sunken'
                          : isMine
                          ? 'bg-rose-100 text-slate-900 retro-cell-sunken'
                          : 'bg-slate-200/90 retro-cell-sunken'
                        : isFlagged
                        ? 'bg-amber-100 hover:bg-amber-200 border-2 border-t-white border-l-white border-r-slate-500 border-b-slate-500 retro-cell-raised'
                        : 'bg-slate-100 hover:bg-white border-2 border-t-white border-l-white border-r-slate-500 border-b-slate-500 retro-cell-raised'
                    }`}
                    aria-label={`셀 ${r + 1}행 ${c + 1}열`}
                  >
                    {isOpen ? (
                      isMine ? (
                        <span className="text-base sm:text-lg select-none">
                          {isHit ? '💥' : '💣'}
                        </span>
                      ) : num > 0 ? (
                        <span className={`select-none ${getNumberColorClass(num)}`}>
                          {num}
                        </span>
                      ) : null
                    ) : isFlagged ? (
                      isFalseFlag ? (
                        <span className="text-rose-600 font-extrabold text-xs">❌</span>
                      ) : (
                        <span className="select-none text-rose-600">🚩</span>
                      )
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Info Strip */}
        <footer className="pt-2 flex items-center justify-between text-[11px] sm:text-xs text-slate-600 font-medium px-1">
          <div>
            상태: <span className="font-bold text-slate-800">{gameStatus === 'PLAYING' ? '탐색 중...' : gameStatus === 'WON' ? '승리 완료!' : gameStatus === 'LOST' ? '게임 오버' : '첫 칸을 터치하세요'}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>크기: {activeConfig.rows}×{activeConfig.cols}</span>
            <span>·</span>
            <span>지뢰: {activeConfig.mines}개</span>
          </div>
        </footer>
      </div>

      {/* Result Modal: Victory or Defeat */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-100 border-4 border-t-white border-l-white border-r-slate-700 border-b-slate-700 rounded-2xl p-6 shadow-2xl text-center">
            {gameStatus === 'WON' ? (
              <>
                <div className="w-16 h-16 bg-emerald-100 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Trophy className="w-9 h-9 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-1">
                  🎉 미션 대성공!
                </h2>
                <p className="text-sm text-slate-600 mb-4">
                  놀라운 집중력으로 모든 지뢰를 완벽하게 탐지했습니다!
                </p>

                <div className="bg-white border border-slate-300 rounded-xl p-3 mb-5 space-y-1 text-sm font-semibold text-slate-700">
                  <div className="flex justify-between">
                    <span>난이도:</span>
                    <span className="font-bold text-sky-700">{activeConfig.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>소요 시간:</span>
                    <span className="font-bold text-rose-600">{timer} 초</span>
                  </div>
                  <div className="flex justify-between">
                    <span>찾아낸 지뢰:</span>
                    <span className="font-bold text-emerald-700">{activeConfig.mines} 개</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => startNewGame()}
                    className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-lg border-2 border-sky-400 active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    다시 하기
                  </button>
                  <button
                    onClick={() => setShowResultModal(false)}
                    className="py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl border border-slate-400 active:scale-95 transition-transform cursor-pointer"
                  >
                    보드 확인
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-rose-100 border-2 border-rose-400 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <AlertTriangle className="w-9 h-9 text-rose-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-1">
                  💥 지뢰 폭발!
                </h2>
                <p className="text-sm text-slate-600 mb-4">
                  앗, 숨겨진 지뢰를 밟았습니다. 다시 도전해보세요!
                </p>

                <div className="bg-white border border-slate-300 rounded-xl p-3 mb-5 space-y-1 text-sm font-semibold text-slate-700">
                  <div className="flex justify-between">
                    <span>난이도:</span>
                    <span className="font-bold text-sky-700">{activeConfig.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>생존 시간:</span>
                    <span className="font-bold text-slate-800">{timer} 초</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => startNewGame()}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg border-2 border-rose-400 active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    다시 도전하기
                  </button>
                  <button
                    onClick={() => setShowResultModal(false)}
                    className="py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl border border-slate-400 active:scale-95 transition-transform cursor-pointer"
                  >
                    보드 보기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Rules / Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-100 border-4 border-t-white border-l-white border-r-slate-700 border-b-slate-700 rounded-2xl p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
              📖 지뢰찾기 플레이 가이드
            </h3>

            <div className="space-y-3 text-sm text-slate-700">
              <div className="p-3 bg-white rounded-xl border border-slate-300">
                <div className="font-bold text-sky-800 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-600" />
                  첫 번째 터치 안심 보장
                </div>
                <p className="text-xs text-slate-600">
                  처음 터치하는 칸은 절대 지뢰가 터지지 않으며, 넓은 안전 구역이 열립니다. 안심하고 원하는 칸을 누르세요!
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-300">
                <div className="font-bold text-slate-900 mb-1">
                  🔢 숫자의 의미
                </div>
                <p className="text-xs text-slate-600">
                  열린 칸의 숫자는 <strong>그 칸을 둘러싼 주변 8개 칸에 숨어있는 지뢰의 총 개수</strong>를 뜻합니다.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-300">
                <div className="font-bold text-slate-900 mb-1">
                  📱 태블릿 전용 조작 모드
                </div>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li><strong>⛏️ 칸 열기 모드</strong>: 터치하여 새로운 칸을 엽니다.</li>
                  <li><strong>🚩 깃발 꽂기 모드</strong>: 지뢰가 있다고 생각되는 칸에 깃발을 꽂습니다.</li>
                  <li><strong>스피드 팁</strong>: 칸을 0.35초 동안 길게 꾹 누르면 현재 모드와 상관없이 즉시 깃발을 꽂거나 열 수 있습니다!</li>
                </ul>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-300">
                <div className="font-bold text-slate-900 mb-1">
                  ⚡ 빠른 연쇄 오픈 (코드 기능)
                </div>
                <p className="text-xs text-slate-600">
                  이미 열린 숫자 칸 주변에 그 숫자만큼 깃발을 모두 꽂았다면, 해당 숫자를 터치하여 나머지 안전한 칸들을 한 번에 열 수 있습니다!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full mt-4 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 active:scale-95 transition-transform cursor-pointer"
            >
              이해했어요, 게임 시작!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
