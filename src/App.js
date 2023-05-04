import { useEffect, useState } from 'react';
import './App.css';
import { Player } from '@lottiefiles/react-lottie-player';
import animation from './78824-digit-four-animation-number-4.json';

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

    // Utiliser useEffect pour stocker le score actuel dans le local storage chaque fois que le score change
    useEffect(() => {
        localStorage.setItem('connectFourScore', JSON.stringify({ playerOneScore, playerTwoScore }));
    }, [playerOneScore, playerTwoScore]);

    // Utiliser useEffect pour récupérer le score du local storage et l'utiliser pour initialiser les états playerOneScore et playerTwoScore
    useEffect(() => {
        const score = JSON.parse(localStorage.getItem('connectFourScore'));
        if (score) {
            setPlayerOneScore(score.playerOneScore);
            setPlayerTwoScore(score.playerTwoScore);
        }
    }, []);

    const handleColumnClick = (column) => {
        if (winner !== null) {
            return;
        }

        const newBoard = [...board];

        // Ajouter une boucle pour trouver la première case vide dans la colonne
        let row = null;
        for (let i = 0; i < ROWS; i++) {
            if (newBoard[i][column] === EMPTY) {
                row = i;
                break;
            }
        }

        // Vérifier que la colonne n'est pas pleine
        if (row === null) {
            return;
        }

        // Ajouter le pion dans la première case vide de la colonne
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
                        setPlayerOneScore(playerOneScore);
                        setPlayerTwoScore(playerTwoScore);
                        setWinner(null);
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
            <div className="title">
                <h1>Puissance </h1>
                <Player
                    className='animation'
                    autoplay
                    loop
                    src={animation}
                    style={{ height: '100px', width: '100px' }}
                >
                </Player>
            </div>
        </div>
    );
}

export default App;