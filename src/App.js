import { useState } from 'react';
import './App.css';

const ROWS = 6;
const COLUMNS = 7;
const EMPTY = 0;
const PLAYER_ONE = 1;
const PLAYER_TWO = 2;

function App() {
    const [board, setBoard] = useState(() => {
        const initialBoard = [];
        for (let row = 0; row < ROWS; row++) {
            initialBoard[row] = Array(COLUMNS).fill(EMPTY);
        }
        return initialBoard;
    });
    const [player, setPlayer] = useState(PLAYER_ONE);
    const [winner, setWinner] = useState(null);
    const [playerOneScore, setPlayerOneScore] = useState(0);
    const [playerTwoScore, setPlayerTwoScore] = useState(0);

    const handleColumnClick = (column) => {
        if (winner !== null) {
            return;
        }

        const newBoard = [...board];
        for (let row = ROWS - 1; row >= 0; row--) {
            if (newBoard[row][column] === EMPTY) {
                newBoard[row][column] = player;
                setBoard(newBoard);

                if (checkForWinner(newBoard, row, column)) {
                    setWinner(player);
                    if (player === PLAYER_ONE) {
                        setPlayerOneScore(playerOneScore + 1);
                    } else {
                        setPlayerTwoScore(playerTwoScore + 1);
                    }
                } else {
                    setPlayer(player === PLAYER_ONE ? PLAYER_TWO : PLAYER_ONE);
                }

                break;
            }
        }
    };

    const checkForWinner = (board, row, col) => {
        const player = board[row][col];

        // Check vertical
        if (row >= 3 && board[row - 1][col] === player && board[row - 2][col] === player && board[row - 3][col] === player) {
            return true;
        }

        // Check horizontal
        for (let i = Math.max(0, col - 3); i <= Math.min(COLUMNS - 4, col); i++) {
            if (board[row][i] === player && board[row][i + 1] === player && board[row][i + 2] === player && board[row][i + 3] === player) {
                return true;
            }
        }

        // Check diagonal down-right
        for (let i = Math.max(0, row - 3); i <= Math.min(ROWS - 4, row); i++) {
            if (
                board[i][col + (i - row)] === player &&
                board[i + 1][col + (i - row) + 1] === player &&
                board[i + 2][col + (i - row) + 2] === player &&
                board[i + 3][col + (i - row) + 3] === player
            ) {
                return true;
            }
        }

        // Check diagonal down-left
        for (let i = Math.max(0, row - 3); i <= Math.min(ROWS - 4, row); i++) {
            if (
                board[i][col - (i - row)] === player &&
                board[i + 1][col - (i - row) - 1] === player &&
                board[i + 2][col - (i - row) - 2] === player &&
                board[i + 3][col - (i - row) - 3] === player
            ) {
                return true;
            }
        }

        return false;
    };

    return (
        <div className="App">
            <div className="board">
                {board.map((row, rowIndex) => (
                    <div key={rowIndex} className="row">
                        {row.map((cell, colIndex) => (
                            <div key={colIndex} className={`cell player${cell}`} onClick={() => handleColumnClick(colIndex)}></div>
                        ))}
                    </div>
                ))}
            </div>
            {winner !== null && (
                <div className="winner">
                    <span>Player {winner} Gagnant!</span>
                    <button onClick={() => setBoard(() => {
                        const initialBoard = [];
                        for (let row = 0; row < ROWS; row++) {
                            initialBoard[row] = Array(COLUMNS).fill(EMPTY);
                        }
                        return initialBoard;
                    })}>New Game</button>
                </div>
            )}
            <div className="scores">
                <div>Player 🟢: {playerOneScore}</div>
                <div>Player 🔵: {playerTwoScore}</div>
            </div>
            <button onClick={() => {
                setBoard(() => {
                    const initialBoard = [];
                    for (let row = 0; row < ROWS; row++) {
                        initialBoard[row] = Array(COLUMNS).fill(EMPTY);
                    }
                    return initialBoard;
                });
                setPlayerOneScore(0);
                setPlayerTwoScore(0);
                setWinner(null);
            }}>Start New Game</button>
            <h1>Connect Four</h1>
        </div>
    );
}

export default App;