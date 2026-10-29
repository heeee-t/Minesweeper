export type DifficultyKey = 'EASY' | 'NORMAL' | 'HARD' | 'EXPERT';

export interface DifficultyConfig {
  key: DifficultyKey;
  label: string;
  subLabel: string;
  rows: number;
  cols: number;
  mines: number;
}

export const DIFFICULTIES: Record<DifficultyKey, DifficultyConfig> = {
  EASY: {
    key: 'EASY',
    label: '이지 (Easy)',
    subLabel: '8×8 · 지뢰 10개',
    rows: 8,
    cols: 8,
    mines: 10,
  },
  NORMAL: {
    key: 'NORMAL',
    label: '노말 (Normal)',
    subLabel: '12×12 · 지뢰 25개',
    rows: 12,
    cols: 12,
    mines: 25,
  },
  HARD: {
    key: 'HARD',
    label: '하드 (Hard)',
    subLabel: '16×16 · 지뢰 40개',
    rows: 16,
    cols: 16,
    mines: 40,
  },
  EXPERT: {
    key: 'EXPERT',
    label: '최상위 (Expert)',
    subLabel: '20×20 · 지뢰 80개',
    rows: 20,
    cols: 20,
    mines: 80,
  },
};

export type GameStatus = 'READY' | 'PLAYING' | 'WON' | 'LOST';

export type TouchMode = 'DIG' | 'FLAG'; // ⛏️ 칸 열기 vs 🚩 깃발 꽂기

export interface CellData {
  row: number;
  col: number;
  isMine: boolean;
  isOpen: boolean;
  isFlagged: boolean;
  neighborMines: number;
  isTriggeredMine?: boolean;
  isFalseFlag?: boolean;
}
