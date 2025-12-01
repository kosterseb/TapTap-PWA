import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, RotateCcw, Clock, Zap } from 'lucide-react';

// --- GSAP and PWA Setup ---

// Access the global GSAP variable loaded via the CDN script in index.html
const gsap = window.gsap; 

// PWA Service Worker Registration
const registerServiceWorker = () => {
    if ('serviceWorker' in navigator) {
        // --- PRODUCTION PATH ---
        // We set this to /brutalist-clicker/sw.js to match the GitHub Pages URL.
        navigator.serviceWorker.register('/TapTap-PWA/sw.js') 
            .then(registration => {
                console.log('SW registered successfully, scope:', registration.scope);
            })
            .catch(error => {
                console.error('SW registration failed:', error); 
            });
    }
};

// --- Game Constants ---
const GAME_DURATION = 30; // seconds

// --- Utility: Neobrutalist Button Component ---
const Button = ({ onClick, children, className = '', disabled = false, accent = 'bg-red-400' }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`
            font-inter text-lg font-bold p-3 sm:p-4 rounded-lg transition-all duration-100 ease-in-out
            border-4 border-black shadow-[4px_4px_0_0_#000]
            hover:shadow-[2px_2px_0_0_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]
            ${accent} text-black
            ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
            ${className}
        `}
    >
        {children}
    </button>
);

// --- Main Game Component ---
const App = () => {
    const [gameState, setGameState] = useState('idle'); // 'idle', 'playing', 'gameover'
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [target, setTarget] = useState(null); // { x: number, y: number }
    
    const gameLoopRef = useRef();
    const targetRef = useRef(null);
    const containerRef = useRef(null);

    // Runs once on mount for PWA registration
    useEffect(() => {
        registerServiceWorker(); 
    }, []);

    // --- Core Game Logic ---

    const spawnTarget = useCallback(() => {
        if (!containerRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const targetSize = 40; // Approx size for target

        // Calculate maximum safe positions
        const maxW = containerRect.width - targetSize;
        const maxH = containerRect.height - targetSize;
        
        // Generate random, safe position within bounds
        const newX = Math.max(0, Math.floor(Math.random() * maxW));
        const newY = Math.max(0, Math.floor(Math.random() * maxH));

        setTarget({ x: newX, y: newY });

        // GSAP Animation: Scale in the new target
        if (targetRef.current && gsap.fromTo) {
            gsap.fromTo(targetRef.current, 
                { scale: 0.5, opacity: 0 }, 
                { scale: 1, opacity: 1, duration: 0.2, ease: "back.out(1.7)" }
            );
        }
    }, []);

    const handleMiss = useCallback(() => {
        // Punish miss: -1 score and a screen shake animation
        setScore(s => Math.max(0, s - 1));

        if (containerRef.current && gsap.to) {
            gsap.to(containerRef.current, {
                x: -5, 
                y: -5,
                duration: 0.05, 
                ease: "power1.inOut", 
                repeat: 3, 
                yoyo: true, 
                clearProps: "all" 
            });
        }
    }, []);

    const handleTargetClick = useCallback((e) => {
        e.stopPropagation(); // Prevent container click event from firing (handleMiss)
        
        setScore(s => s + 1);
        spawnTarget(); // Immediately spawn the next target

        // GSAP Animation: Quick flash on success
        if (targetRef.current && gsap.to) {
             gsap.to(targetRef.current, { scale: 1.1, duration: 0.1, yoyo: true, repeat: 1 });
        }
    }, [spawnTarget]);

    const startGame = useCallback(() => {
        setScore(0);
        setTimeLeft(GAME_DURATION);
        setGameState('playing');
        spawnTarget();
    }, [spawnTarget]);

    const gameOver = useCallback(() => {
        setGameState('gameover');
        setTarget(null);
    }, []);

    // --- Game Loop (Time Management) ---
    useEffect(() => {
        if (gameState !== 'playing') {
            clearTimeout(gameLoopRef.current);
            return;
        }

        const gameLoop = () => {
            setTimeLeft(t => {
                const newTime = t - 0.1;
                if (newTime <= 0) {
                    clearTimeout(gameLoopRef.current);
                    gameOver();
                    return 0;
                }
                return newTime;
            });

            // Re-run the loop after 100ms
            gameLoopRef.current = setTimeout(gameLoop, 100);
        };

        // Start the loop
        gameLoopRef.current = setTimeout(gameLoop, 100);

        // Cleanup on unmount or state change
        return () => clearTimeout(gameLoopRef.current);
    }, [gameState, gameOver]);

    // --- Render Helpers ---

    const renderGameScreen = () => (
        <div 
            ref={containerRef}
            className="w-full h-[80vw] max-w-[400px] max-h-[400px] bg-white border-4 border-black relative overflow-hidden my-4 transition-transform duration-100"
            onClick={handleMiss} // Click on container is a miss
            style={{ touchAction: 'none' }} // Good practice for mobile games
        >
            {target && (
                <div
                    ref={targetRef}
                    onClick={handleTargetClick}
                    className="absolute bg-yellow-400 border-4 border-black w-10 h-10 rounded-full cursor-pointer flex items-center justify-center font-extrabold text-xs text-black"
                    style={{ 
                        left: `${target.x}px`, 
                        top: `${target.y}px`,
                    }}
                >
                    <Zap size={16} />
                </div>
            )}
        </div>
    );

    const renderOverlay = () => {
        if (gameState === 'playing') return null;

        const isIdle = gameState === 'idle';
        const title = isIdle ? 'BRUTALIST CLICKER' : 'GAME OVER';
        const message = isIdle 
            ? 'Tap the flashing yellow target as fast as you can. Avoid missing!'
            : `Final Score: ${score}! That's ${score > 10 ? 'solid' : 'okay'}!`;
        const buttonText = isIdle ? (
            <>
                <Play className="inline mr-2" size={20} /> START GAME
            </>
        ) : (
            <>
                <RotateCcw className="inline mr-2" size={20} /> PLAY AGAIN
            </>
        );

        return (
            <div className="absolute inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center p-6 z-10">
                <div className="bg-white p-6 sm:p-8 border-6 border-black shadow-[8px_8px_0_0_#000] text-center max-w-sm w-full">
                    <h1 className="text-3xl sm:text-4xl font-extrabold border-b-4 border-black pb-2 mb-4 text-red-600 font-mono">
                        {title}
                    </h1>
                    <p className="mb-8 text-black text-sm sm:text-base">
                        {message}
                    </p>
                    <Button onClick={startGame} accent="bg-green-400">
                        {buttonText}
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-200 flex flex-col items-center justify-start pt-10 px-4 font-sans relative">
            {/* Global PWA Info Bar (Neobrutalist style) */}
            <div className="w-full max-w-sm bg-black text-white p-3 border-b-4 border-yellow-400 text-center mb-6">
                <span className="font-mono text-sm flex items-center justify-center">
                    <Clock size={16} className="mr-2 text-yellow-400" /> 
                    {GAME_DURATION} SECONDS TO BEAT THE CLOCK
                </span>
            </div>

            {/* Game Container */}
            <div className="relative w-full max-w-[400px] aspect-square">
                {renderGameScreen()}
                {renderOverlay()}
            </div>
            
            {/* Control Panel / Score Display below the game */}
            <div className="w-full max-w-[400px] mt-6 flex justify-between gap-2">
                <div className="flex-1 p-3 bg-red-400 border-4 border-black shadow-[4px_4px_0_0_#000] text-center font-mono">
                    <div className="text-xs">SCORE</div>
                    <div className="text-2xl font-bold">{score}</div>
                </div>
                <div className="flex-1 p-3 bg-blue-400 border-4 border-black shadow-[4px_4px_0_0_#000] text-center font-mono">
                    <div className="text-xs">TIME REMAINING</div>
                    <div className="text-2xl font-bold">{timeLeft.toFixed(1)}</div>
                </div>
            </div>

            {gameState !== 'playing' && (
                <div className="mt-8">
                    <Button onClick={startGame} accent="bg-green-400">
                        <Play className="inline mr-2" size={20} /> Start Fresh
                    </Button>
                </div>
            )}
            
            {/* Note about PWA/Workbox implementation */}
            <p className="mt-12 text-center text-xs text-gray-700 max-w-sm">
                *PWA Note: Ensure sw.js and manifest.json are in the public folder.
            </p>

            <style>{`
                /* Font import for Inter */
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap');
                
                body {
                    font-family: 'Inter', sans-serif;
                    background-color: #d1d5db; /* A lighter gray for the page background */
                }
                .font-mono {
                    font-family: 'Space Mono', monospace;
                }
            `}</style>
        </div>
    );
}

export default App;