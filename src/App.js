import { useCallback, useEffect, useState } from 'react';
import { Player } from '@lottiefiles/react-lottie-player';
import './App.css';
import animation from './78824-digit-four-animation-number-4.json';

const ROWS = 6;
const COLUMNS = 7;
const EMPTY = 0;
const PLAYER_ONE = 1;
const PLAYER_TWO = 2;
const DRAW = 'draw';
const STORAGE_KEY = 'connectFourScore';
const CENTER_ORDER = [3, 2, 4, 1, 5, 0, 6];
const DEFAULT_SCORES = {
  playerOneScore: 0,
  playerTwoScore: 0,
};

/**
 * @typedef {{ label: string, depth: number, randomness: number }} Difficulty
 * @type {Record<'easy' | 'normal' | 'hard', Difficulty>}
 */
const DIFFICULTIES = {
  easy: {
    label: 'Facile',
    depth: 1,
    randomness: 0.45,
  },
  normal: {
    label: 'Normal',
    depth: 3,
    randomness: 0.12,
  },
  hard: {
    label: 'Expert',
    depth: 5,
    randomness: 0,
  },
};

function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLUMNS).fill(EMPTY));
}

function readStoredScores() {
  if (typeof window === 'undefined') {
    return DEFAULT_SCORES;
  }

  try {
    const savedScores = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    if (
      Number.isFinite(savedScores?.playerOneScore) &&
      Number.isFinite(savedScores?.playerTwoScore)
    ) {
      return savedScores;
    }
  } catch (error) {
    return DEFAULT_SCORES;
  }

  return DEFAULT_SCORES;
}

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

function getAvailableRow(board, column) {
  for (let row = ROWS - 1; row >= 0; row -= 1) {
    if (board[row][column] === EMPTY) {
      return row;
    }
  }

  return null;
}

function dropPiece(board, column, player) {
  const row = getAvailableRow(board, column);

  if (row === null) {
    return null;
  }

  const nextBoard = cloneBoard(board);
  nextBoard[row][column] = player;

  return {
    board: nextBoard,
    row,
  };
}

function isInsideBoard(row, column) {
  return row >= 0 && row < ROWS && column >= 0 && column < COLUMNS;
}

function countDirection(board, row, column, rowStep, columnStep, player) {
  let total = 0;
  let nextRow = row + rowStep;
  let nextColumn = column + columnStep;

  while (
    isInsideBoard(nextRow, nextColumn) &&
    board[nextRow][nextColumn] === player
  ) {
    total += 1;
    nextRow += rowStep;
    nextColumn += columnStep;
  }

  return total;
}

function checkForWinner(board, row, column) {
  const player = board[row][column];

  if (player === EMPTY) {
    return false;
  }

  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  return directions.some(([rowStep, columnStep]) => {
    const alignedPieces =
      1 +
      countDirection(board, row, column, rowStep, columnStep, player) +
      countDirection(board, row, column, -rowStep, -columnStep, player);

    return alignedPieces >= 4;
  });
}

function findWinner(board) {
  for (let row = 0; row < ROWS; row += 1) {
    for (let column = 0; column < COLUMNS; column += 1) {
      if (board[row][column] !== EMPTY && checkForWinner(board, row, column)) {
        return board[row][column];
      }
    }
  }

  return null;
}

function getValidColumns(board) {
  return CENTER_ORDER.filter((column) => board[0][column] === EMPTY);
}

function isBoardFull(board) {
  return board[0].every((cell) => cell !== EMPTY);
}

function evaluateWindow(cells, aiPlayer, humanPlayer) {
  const aiCount = cells.filter((cell) => cell === aiPlayer).length;
  const humanCount = cells.filter((cell) => cell === humanPlayer).length;
  const emptyCount = cells.filter((cell) => cell === EMPTY).length;

  if (aiCount === 4) {
    return 1000;
  }

  if (aiCount === 3 && emptyCount === 1) {
    return 70;
  }

  if (aiCount === 2 && emptyCount === 2) {
    return 14;
  }

  if (humanCount === 3 && emptyCount === 1) {
    return -90;
  }

  if (humanCount === 2 && emptyCount === 2) {
    return -18;
  }

  return 0;
}

function scorePosition(board, aiPlayer) {
  const humanPlayer = aiPlayer === PLAYER_ONE ? PLAYER_TWO : PLAYER_ONE;
  let score = 0;

  const centerColumn = board.map((row) => row[Math.floor(COLUMNS / 2)]);
  score += centerColumn.filter((cell) => cell === aiPlayer).length * 12;

  for (let row = 0; row < ROWS; row += 1) {
    for (let column = 0; column <= COLUMNS - 4; column += 1) {
      score += evaluateWindow(
        board[row].slice(column, column + 4),
        aiPlayer,
        humanPlayer,
      );
    }
  }

  for (let column = 0; column < COLUMNS; column += 1) {
    for (let row = 0; row <= ROWS - 4; row += 1) {
      score += evaluateWindow(
        [0, 1, 2, 3].map((offset) => board[row + offset][column]),
        aiPlayer,
        humanPlayer,
      );
    }
  }

  for (let row = 0; row <= ROWS - 4; row += 1) {
    for (let column = 0; column <= COLUMNS - 4; column += 1) {
      score += evaluateWindow(
        [0, 1, 2, 3].map((offset) => board[row + offset][column + offset]),
        aiPlayer,
        humanPlayer,
      );
    }
  }

  for (let row = 0; row <= ROWS - 4; row += 1) {
    for (let column = 3; column < COLUMNS; column += 1) {
      score += evaluateWindow(
        [0, 1, 2, 3].map((offset) => board[row + offset][column - offset]),
        aiPlayer,
        humanPlayer,
      );
    }
  }

  return score;
}

function minimax(board, depth, alpha, beta, isMaximizing, aiPlayer) {
  const humanPlayer = aiPlayer === PLAYER_ONE ? PLAYER_TWO : PLAYER_ONE;
  const winner = findWinner(board);
  const validColumns = getValidColumns(board);

  if (winner === aiPlayer) {
    return { column: null, score: 1000000 + depth };
  }

  if (winner === humanPlayer) {
    return { column: null, score: -1000000 - depth };
  }

  if (validColumns.length === 0) {
    return { column: null, score: 0 };
  }

  if (depth === 0) {
    return { column: validColumns[0], score: scorePosition(board, aiPlayer) };
  }

  if (isMaximizing) {
    let bestScore = -Infinity;
    let bestColumn = validColumns[0];

    for (const column of validColumns) {
      const move = dropPiece(board, column, aiPlayer);

      if (!move) {
        continue;
      }

      const { score } = minimax(
        move.board,
        depth - 1,
        alpha,
        beta,
        false,
        aiPlayer,
      );

      if (score > bestScore) {
        bestScore = score;
        bestColumn = column;
      }

      alpha = Math.max(alpha, bestScore);

      if (alpha >= beta) {
        break;
      }
    }

    return { column: bestColumn, score: bestScore };
  }

  let bestScore = Infinity;
  let bestColumn = validColumns[0];

  for (const column of validColumns) {
    const move = dropPiece(board, column, humanPlayer);

    if (!move) {
      continue;
    }

    const { score } = minimax(
      move.board,
      depth - 1,
      alpha,
      beta,
      true,
      aiPlayer,
    );

    if (score < bestScore) {
      bestScore = score;
      bestColumn = column;
    }

    beta = Math.min(beta, bestScore);

    if (alpha >= beta) {
      break;
    }
  }

  return { column: bestColumn, score: bestScore };
}

function findImmediateMove(board, player) {
  const validColumns = getValidColumns(board);

  for (const column of validColumns) {
    const move = dropPiece(board, column, player);

    if (move && checkForWinner(move.board, move.row, column)) {
      return column;
    }
  }

  return null;
}

function chooseAiColumn(board, difficulty) {
  const validColumns = getValidColumns(board);

  if (validColumns.length === 0) {
    return null;
  }

  const settings = DIFFICULTIES[difficulty] ?? DIFFICULTIES.normal;

  if (Math.random() < settings.randomness) {
    return validColumns[Math.floor(Math.random() * validColumns.length)];
  }

  const winningMove = findImmediateMove(board, PLAYER_TWO);

  if (winningMove !== null) {
    return winningMove;
  }

  const blockingMove = findImmediateMove(board, PLAYER_ONE);

  if (blockingMove !== null) {
    return blockingMove;
  }

  return minimax(board, settings.depth, -Infinity, Infinity, true, PLAYER_TWO)
    .column;
}

function getPlayerLabel(player, mode) {
  if (player === PLAYER_ONE) {
    return 'Joueur 1';
  }

  return mode === 'ai' ? 'IA' : 'Joueur 2';
}

function App() {
  const [board, setBoard] = useState(createEmptyBoard);
  const [currentPlayer, setCurrentPlayer] = useState(PLAYER_ONE);
  const [winner, setWinner] = useState(null);
  const [scores, setScores] = useState(readStoredScores);
  const [mode, setMode] = useState('ai');
  const [difficulty, setDifficulty] = useState('normal');
  const [lastMove, setLastMove] = useState(null);
  const [hoverColumn, setHoverColumn] = useState(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const commitMove = useCallback((move, column, player) => {
    setBoard(move.board);
    setLastMove({ row: move.row, column, player });

    if (checkForWinner(move.board, move.row, column)) {
      setWinner(player);
      setScores((currentScores) =>
        player === PLAYER_ONE
          ? {
              ...currentScores,
              playerOneScore: currentScores.playerOneScore + 1,
            }
          : {
              ...currentScores,
              playerTwoScore: currentScores.playerTwoScore + 1,
            },
      );
      return;
    }

    if (isBoardFull(move.board)) {
      setWinner(DRAW);
      return;
    }

    setCurrentPlayer(player === PLAYER_ONE ? PLAYER_TWO : PLAYER_ONE);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  }, [scores]);

  useEffect(() => {
    if (mode !== 'ai' || currentPlayer !== PLAYER_TWO || winner !== null) {
      return undefined;
    }

    setIsAiThinking(true);

    const timer = window.setTimeout(() => {
      const column = chooseAiColumn(board, difficulty);

      if (column === null) {
        setIsAiThinking(false);
        return;
      }

      const move = dropPiece(board, column, PLAYER_TWO);

      if (move) {
        commitMove(move, column, PLAYER_TWO);
      }

      setIsAiThinking(false);
    }, 650);

    return () => window.clearTimeout(timer);
  }, [board, commitMove, currentPlayer, difficulty, mode, winner]);

  const resetRound = () => {
    setBoard(createEmptyBoard());
    setCurrentPlayer(PLAYER_ONE);
    setWinner(null);
    setLastMove(null);
    setHoverColumn(null);
    setIsAiThinking(false);
  };

  const resetScores = () => {
    setScores({ ...DEFAULT_SCORES });
    resetRound();
  };

  const handleModeChange = (nextMode) => {
    if (nextMode === mode) {
      return;
    }

    setMode(nextMode);
    resetRound();
  };

  const canInteract =
    winner === null &&
    !isAiThinking &&
    !(mode === 'ai' && currentPlayer === PLAYER_TWO);
  const previewRow =
    canInteract && hoverColumn !== null ? getAvailableRow(board, hoverColumn) : null;
  const statusMessage =
    winner === DRAW
      ? 'Match nul'
      : winner !== null
        ? `${getPlayerLabel(winner, mode)} gagne`
        : mode === 'ai' && currentPlayer === PLAYER_TWO
          ? "L'IA reflechit"
          : `${getPlayerLabel(currentPlayer, mode)} joue`;

  const handleColumnClick = (column) => {
    if (!canInteract) {
      return;
    }

    const move = dropPiece(board, column, currentPlayer);

    if (!move) {
      return;
    }

    commitMove(move, column, currentPlayer);
  };

  return (
    <main className="App">
      <header className="app-header">
        <div className="header-brand">
          <span className="header-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          <div>
            <strong>Puissance 4</strong>
          </div>
        </div>
        <p>Projet React par Guillaume SERE</p>
      </header>

      <section className="game-layout" aria-label="Puissance 4">
        <aside className="side-panel">
          <div className="brand">
            <p className="eyebrow">Jeu de strategie</p>
            <div className="title">
              <h1>Puissance</h1>
              <Player
                className="animation"
                autoplay
                loop
                src={animation}
                style={{ height: '100px', width: '100px' }}
              />
            </div>
            <p className="description">
              Alignez quatre jetons avant votre adversaire, en duel local ou
              contre une IA reactive.
            </p>
          </div>

          <div className="control-group">
            <span className="control-label">Mode</span>
            <div className="segmented-control" role="group" aria-label="Mode de jeu">
              <button
                type="button"
                className={mode === 'ai' ? 'active' : ''}
                onClick={() => handleModeChange('ai')}
              >
                Contre IA
              </button>
              <button
                type="button"
                className={mode === 'pvp' ? 'active' : ''}
                onClick={() => handleModeChange('pvp')}
              >
                2 joueurs
              </button>
            </div>
          </div>

          {mode === 'ai' && (
            <div className="control-group">
              <span className="control-label">IA</span>
              <div
                className="segmented-control difficulty"
                role="group"
                aria-label="Difficulte de l'IA"
              >
                {Object.entries(DIFFICULTIES).map(([key, level]) => (
                  <button
                    key={key}
                    type="button"
                    className={difficulty === key ? 'active' : ''}
                    onClick={() => setDifficulty(key)}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="status-panel" aria-live="polite">
            <span className="control-label">Etat</span>
            <strong>{statusMessage}</strong>
            <p>
              {winner === null
                ? 'Choisissez une colonne et gardez le centre sous controle.'
                : 'La manche est terminee, vous pouvez relancer tout de suite.'}
            </p>
          </div>
        </aside>

        <section className="play-area">
          <div className="scoreboard" aria-label="Scores">
            <div className="score-card player-one-score">
              <span>Joueur 1</span>
              <strong>{scores.playerOneScore}</strong>
            </div>
            <div className="score-card player-two-score">
              <span>{mode === 'ai' ? 'IA' : 'Joueur 2'}</span>
              <strong>{scores.playerTwoScore}</strong>
            </div>
          </div>

          <div
            className={`board ${canInteract ? 'is-active' : ''}`}
            role="grid"
            aria-label="Plateau de Puissance 4"
            onMouseLeave={() => setHoverColumn(null)}
          >
            {board.map((row, rowIndex) =>
              row.map((cell, columnIndex) => {
                const isPreview =
                  previewRow === rowIndex &&
                  hoverColumn === columnIndex &&
                  cell === EMPTY;
                const isLastMove =
                  lastMove?.row === rowIndex && lastMove?.column === columnIndex;
                const cellClass = [
                  'cell',
                  cell === PLAYER_ONE
                    ? 'player-one'
                    : cell === PLAYER_TWO
                      ? 'player-two'
                      : 'empty',
                  isPreview ? 'preview' : '',
                  isLastMove ? 'last-move' : '',
                ]
                  .filter(Boolean)
                  .join(' ');
                const isColumnFull = board[0][columnIndex] !== EMPTY;

                return (
                  <button
                    key={`${rowIndex}-${columnIndex}`}
                    type="button"
                    className={cellClass}
                    role="gridcell"
                    aria-label={`Colonne ${columnIndex + 1}`}
                    disabled={!canInteract || isColumnFull}
                    onClick={() => handleColumnClick(columnIndex)}
                    onMouseEnter={() => setHoverColumn(columnIndex)}
                    onFocus={() => setHoverColumn(columnIndex)}
                  >
                    <span className="chip" aria-hidden="true" />
                  </button>
                );
              }),
            )}
          </div>

          <div className="action-row">
            <button type="button" className="primary-action" onClick={resetRound}>
              Nouvelle manche
            </button>
            <button type="button" className="ghost-action" onClick={resetScores}>
              Remise a zero
            </button>
          </div>
        </section>
      </section>

      <footer className="app-footer">
        <span>Copyright 2026 Guillaume SERE. Tous droits reserves.</span>
      </footer>
    </main>
  );
}

export default App;
