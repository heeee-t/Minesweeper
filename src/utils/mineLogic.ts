import { CellData } from '../types/game';

// 8 directions for neighbors (N, NE, E, SE, S, SW, W, NW)
export const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

export function createInitialBoard(rows: number, cols: number): CellData[][] {
  const board: CellData[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: CellData[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        row: r,
        col: c,
        isMine: false,
        isOpen: false,
        isFlagged: false,
        neighborMines: 0,
      });
    }
    board.push(row);
  }
  return board;
}

export function placeMines(
  board: CellData[][],
  firstRow: number,
  firstCol: number,
  mineCount: number
): CellData[][] {
  const rows = board.length;
  const cols = board[0].length;
  const newBoard: CellData[][] = board.map(row => row.map(cell => ({ ...cell })));

  // Define safe zone: first cell + surrounding 8 neighbors so first tap always opens a generous safe area
  const safeCoords = new Set<string>();
  safeCoords.add(`${firstRow},${firstCol}`);
  for (const [dr, dc] of DIRECTIONS) {
    const nr = firstRow + dr;
    const nc = firstCol + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      safeCoords.add(`${nr},${nc}`);
    }
  }

  // Available cells for mines
  const availableCoords: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!safeCoords.has(`${r},${c}`)) {
        availableCoords.push([r, c]);
      }
    }
  }

  // If availableCoords is smaller than mineCount (e.g. huge mine density), allow neighbors except the clicked cell
  if (availableCoords.length < mineCount) {
    availableCoords.length = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r !== firstRow || c !== firstCol) {
          availableCoords.push([r, c]);
        }
      }
    }
  }

  // Shuffle Fisher-Yates
  for (let i = availableCoords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableCoords[i], availableCoords[j]] = [availableCoords[j], availableCoords[i]];
  }

  const placedMines = availableCoords.slice(0, mineCount);
  for (const [mr, mc] of placedMines) {
    newBoard[mr][mc].isMine = true;
  }

  // Calculate neighbor mine numbers
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (newBoard[r][c].isMine) continue;
      let count = 0;
      for (const [dr, dc] of DIRECTIONS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].isMine) {
          count++;
        }
      }
      newBoard[r][c].neighborMines = count;
    }
  }

  return newBoard;
}

export function revealCell(
  board: CellData[][],
  r: number,
  c: number
): { nextBoard: CellData[][]; hitMine: boolean; hasCascade: boolean } {
  const rows = board.length;
  const cols = board[0].length;
  const newBoard: CellData[][] = board.map(row => row.map(cell => ({ ...cell })));
  const target = newBoard[r][c];

  if (target.isOpen || target.isFlagged) {
    return { nextBoard: board, hitMine: false, hasCascade: false };
  }

  // Hit a mine!
  if (target.isMine) {
    target.isOpen = true;
    target.isTriggeredMine = true;

    // Reveal all mines and mark false flags
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = newBoard[row][col];
        if (cell.isMine && !cell.isFlagged) {
          cell.isOpen = true;
        } else if (!cell.isMine && cell.isFlagged) {
          cell.isFalseFlag = true;
        }
      }
    }

    return { nextBoard: newBoard, hitMine: true, hasCascade: false };
  }

  // BFS / Flood fill for empty cells (0 neighbor mines)
  const queue: [number, number][] = [[r, c]];
  target.isOpen = true;
  let hasCascade = false;

  while (queue.length > 0) {
    const [currR, currC] = queue.shift()!;
    const currCell = newBoard[currR][currC];

    // If zero neighbor mines, expand to neighbors
    if (currCell.neighborMines === 0) {
      hasCascade = true;
      for (const [dr, dc] of DIRECTIONS) {
        const nr = currR + dr;
        const nc = currC + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          const neighbor = newBoard[nr][nc];
          if (!neighbor.isOpen && !neighbor.isFlagged && !neighbor.isMine) {
            neighbor.isOpen = true;
            if (neighbor.neighborMines === 0) {
              queue.push([nr, nc]);
            }
          }
        }
      }
    }
  }

  return { nextBoard: newBoard, hitMine: false, hasCascade };
}

export function chordCell(
  board: CellData[][],
  r: number,
  c: number
): { nextBoard: CellData[][]; hitMine: boolean; openedSomething: boolean } {
  const rows = board.length;
  const cols = board[0].length;
  const target = board[r][c];

  if (!target.isOpen || target.neighborMines === 0) {
    return { nextBoard: board, hitMine: false, openedSomething: false };
  }

  // Count flags around target
  let flagCount = 0;
  for (const [dr, dc] of DIRECTIONS) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isFlagged) {
      flagCount++;
    }
  }

  // If flag count matches the cell's number, open all unflagged hidden neighbors
  if (flagCount === target.neighborMines) {
    let currentBoard = board;
    let hitMine = false;
    let openedSomething = false;

    for (const [dr, dc] of DIRECTIONS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        const neighbor = currentBoard[nr][nc];
        if (!neighbor.isOpen && !neighbor.isFlagged) {
          const res = revealCell(currentBoard, nr, nc);
          currentBoard = res.nextBoard;
          openedSomething = true;
          if (res.hitMine) {
            hitMine = true;
            return { nextBoard: currentBoard, hitMine: true, openedSomething: true };
          }
        }
      }
    }
    return { nextBoard: currentBoard, hitMine, openedSomething };
  }

  return { nextBoard: board, hitMine: false, openedSomething: false };
}

export function toggleFlag(board: CellData[][], r: number, c: number): CellData[][] {
  const cell = board[r][c];
  if (cell.isOpen) return board;

  const newBoard = board.map(row => row.map(item => ({ ...item })));
  newBoard[r][c].isFlagged = !newBoard[r][c].isFlagged;
  return newBoard;
}

export function checkVictory(board: CellData[][], totalMines: number): boolean {
  const rows = board.length;
  const cols = board[0].length;
  const totalCells = rows * cols;
  let openCellsCount = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].isOpen && !board[r][c].isMine) {
        openCellsCount++;
      }
    }
  }

  return openCellsCount === totalCells - totalMines;
}

export function autoFlagRemainingMines(board: CellData[][]): CellData[][] {
  return board.map(row =>
    row.map(cell => {
      if (cell.isMine) {
        return { ...cell, isFlagged: true };
      }
      return { ...cell };
    })
  );
}
