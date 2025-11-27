/* eslint-disable react-hooks/exhaustive-deps */
// Importing necessary React components and utility functions
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createDrumEngine } from '../audio/drums';
import { createSynthEngine } from '../audio/fmEngine';
import {
  calculateAngles,
  calculateCentreOfMass,
  calculateDistance,
  squaredPolar,
} from '../utils/math';
import {
  getNextColor,
  getRandomColor,
  normalizeRotation,
} from '../utils/utils';
// Importing custom React components
import logo from '../images/cloudLogoSVG.svg';
import ConcentricCircles from './ConcentricCircles';
import Controls from './Controls';
import Crosshairs from './Crosshairs';
import DistanceDisplay from './DistanceDisplay';
import HelpModal from './HelpModal'; // import the HelpModal component
import MovingCircle from './MovingCircle';
import Path from './Path';
import PathDisplay from './PathDisplay';
import Square from './Square';
import SquareDetails from './SquareDetails';

// Creating a context for managing current hit data
export const CurrentHitContext = React.createContext();

// Main App component
const App = () => {
  const [currentHit, setCurrentHit] = useState(null);
  const [squares, setSquares] = useState([]);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [distances, setDistances] = useState([]);
  const [visitedOrder, setVisitedOrder] = useState([]);
  const [showDisplays, setShowDisplays] = useState(false); // New state variable
  const [showCrosshair, setShowCrosshair] = useState(false); // New state variable
  const [isPaused, setIsPaused] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false); // state to control HelpModal visibility
  const [squareAngles, setSquareAngles] = useState({}); // New state for angles
  const [circlePosition, setCirclePosition] = useState({ x: 0, y: 0 });
  const [movingCircleActive, setMovingCircleActive] = useState(false);
  const [tempo, setTempo] = useState(1); // relative tempo control (0-3x)
  const [soundBank, setSoundBank] = useState('drums'); // drums | synth
  const [restartKey, setRestartKey] = useState(0); // manual restart trigger
  const audioEngineRef = useRef(null);
  const schedulerRef = useRef({
    frameId: null,
    running: false,
    skipFrame: false,
  });
  const squaresRef = useRef(squares);
  const visitedOrderRef = useRef(visitedOrder);
  const distancesRef = useRef(distances);
  const soundBankRef = useRef(soundBank);
  const tempoRef = useRef(tempo);
  const baseSecondsPerPixel = 0.0015; // doubled speed baseline

  // State for tracking window size
  // eslint-disable-next-line no-unused-vars
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Function to add a new square
  const addSquare = () => {
    if (squares.length < 16) {
      // Limit of 16 squares

      setSquares(squares => [
        ...squares,
        {
          id: squares.length + 1,
          color: getRandomColor(),
          position: {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          },
          rotation: Math.random() * 360,
        },
      ]);
    }
  };

  // Function to delete a square based on its ID
  const deleteSquare = id => {
    // Filter out the square to be deleted
    const remainingSquares = squares.filter(square => square.id !== id);

    // Reassign IDs to make them continuous
    const updatedSquares = remainingSquares.map((square, index) => ({
      ...square,
      id: index + 1,
    }));

    // Update visited order and distances
    const updatedVisitedOrder = updatedSquares.map(square => square.id);
    const updatedDistances = updatedSquares.map(square => {
      const distancesToOthers = updatedSquares.reduce((acc, otherSquare) => {
        if (square.id !== otherSquare.id) {
          acc[`Square ${otherSquare.id}`] = calculateDistance(
            square.position,
            otherSquare.position
          );
        }
        return acc;
      }, {});
      return { id: square.id, distances: distancesToOthers };
    });

    setSquares(updatedSquares);
    setVisitedOrder(updatedVisitedOrder);
    setDistances(updatedDistances);
  };

  // Function to reorder points using the polar coordinates method
  const reorderSquares = squares => {
    const centre = calculateCentreOfMass(squares.map(sq => sq.position));
    return squares
      .map(square => ({
        ...square,
        polarCoords: squaredPolar(square.position, centre),
      }))
      .sort(
        (a, b) =>
          a.polarCoords[0] - b.polarCoords[0] ||
          a.polarCoords[1] - b.polarCoords[1]
      )
      .map(sq => ({
        id: sq.id,
        color: sq.color,
        position: sq.position,
        rotation: sq.rotation,
      }));
  };

  // Function to calculate the shortest path using reordered squares
  const calculateShortestPath = squares => {
    if (squares.length === 0) return [];

    const orderedSquares = reorderSquares(squares);
    return orderedSquares.map(sq => sq.id);
  };

  // Handler for changes in Help Modal state
  const handleHelpModalChange = e => {
    setShowHelpModal(e.target.checked);
  };

  const closeHelpModal = () => {
    setShowHelpModal(false);
  };

  // Function to toggle play/pause state
  const togglePlayPause = () => {
    setIsPaused(prev => !prev);
  };

  // Manual restart from the first step
  const restartSequence = useCallback(() => {
    schedulerRef.current.skipFrame = false;
    setIsPaused(false);
    setCurrentHit(null);
    setMovingCircleActive(false);
    setRestartKey(key => key + 1);
  }, []);

  // Function to handle drag event on squares
  const handleDrag = useCallback((id, newPosition) => {
    schedulerRef.current.skipFrame = true;
    setMovingCircleActive(false);
    setSquares(squares =>
      squares.map(square =>
        square.id === id ? { ...square, position: newPosition } : square
      )
    );
  }, []);

  // Function to handle rotation of squares
  const handleRotate = useCallback((id, newRotation) => {
    schedulerRef.current.skipFrame = true;
    setMovingCircleActive(false);
    setSquares(squares =>
      squares.map(square =>
        square.id === id
          ? { ...square, rotation: normalizeRotation(newRotation) }
          : square
      )
    );
  }, []);

  // Function to handle right-click on squares
  const handleRightClick = useCallback(id => {
    setSquares(squares =>
      squares.map(square => {
        if (square.id === id) {
          return { ...square, color: getNextColor(square.color) };
        }
        return square;
      })
    );
  }, []);

  // Function to handle selection of a square
  const selectSquare = useCallback(id => {
    setSelectedSquare(id);
  }, []);

  // Function to toggle the visibility of display elements
  const toggleDisplays = () => {
    setShowDisplays(!showDisplays); // Toggle the state
  };

  // Function to toggle the visibility of the crosshair
  const toggleCrosshair = () => {
    setShowCrosshair(!showCrosshair);
  };

  useEffect(() => {
    squaresRef.current = squares;
  }, [squares]);

  useEffect(() => {
    visitedOrderRef.current = visitedOrder;
  }, [visitedOrder]);

  useEffect(() => {
    distancesRef.current = distances;
  }, [distances]);

  useEffect(() => {
    tempoRef.current = tempo;
  }, [tempo]);

  useEffect(() => {
    soundBankRef.current = soundBank;
  }, [soundBank]);

  const getSoundIdForColor = (color, bank) => {
    const drumMap = {
      red: 'kick',
      green: 'snare',
      purple: 'clap',
      orange: 'hat',
      blue: 'rim', // shaker uses rimshot timbre
      pink: 'cowbell',
    };
    const synthMap = {
      red: 'birdcall',
      green: 'chirper',
      purple: 'harshPluck',
      orange: 'highPluck',
      blue: 'flare',
      pink: 'bubble',
    };
    const map = bank === 'synth' ? synthMap : drumMap;
    return map[color] || null;
  };

  const clamp01 = v => Math.max(0, Math.min(1, v));

  const buildSoundParams = (square, bank) => {
    const normX = square.position.x / window.innerWidth;
    const normY = square.position.y / window.innerHeight;
    const gainFromRotation = (((square.rotation % 360) + 360) % 360) / 360;
    // Map rotation to decibels for a more perceptual loudness curve (approx -16 dB to 0 dB)
    const minDb = -16;
    const maxDb = 0;
    const db = minDb + (maxDb - minDb) * gainFromRotation;
    const volume = Math.pow(10, db / 20);

    const soundId = getSoundIdForColor(square.color, bank);

    if (bank === 'synth') {
      const tone = clamp01(normX);
      const length = clamp01(normY);
      switch (soundId) {
        case 'bubble':
          return {
            volume,
            tone,
            length: clamp01(normY * 1.2),
            baseFreq: 140 + normY * 260, // wider Y pitch range for the bubble/cowbell replacement
          };
        case 'harshPluck': // clap replacement: allow much shorter and longer
          return {
            volume,
            tone,
            length: clamp01(normY * 1.5),
          };
        case 'highPluck': // hat replacement: wider tone/length ranges
          return {
            volume,
            tone: clamp01(normX * 1.3),
            length: clamp01(normY * 1.6),
          };
        default:
          return { volume, tone, length };
      }
    }

    switch (soundId) {
      case 'kick':
        return {
          frequency: 40 + normX * 80,
          decay: 300 + normY * 1200,
          tone: 0.1 + normY * 0.6,
          env_duration: 30 + normY * 70,
          saturation: 1 + normY * 1.5,
          volume,
        };
      case 'snare':
        return {
          frequency: 160 + normX * 140,
          tone: 0.1 + normY * 0.8,
          tone_decay: 80 + normY * 500,
          decay: 180 + normY * 800,
          volume,
        };
      case 'clap':
        return {
          spread: 5 + normX * 40,
          decay: 60 + normY * 240,
          tail: 120 + normY * 300,
          volume,
        };
      case 'hat':
        return {
          tone: 8000 + normX * 5000,
          decay: 60 + normY * 300,
          volume,
        };
      case 'rim': {
        const brightness = 0.7 + normX * 1.6; // shifts filter freqs for obvious tone change
        const body = 0.6 + normY * 1.4; // longer decay + tighter Q up the screen
        return {
          decay: 30 + normY * 150, // 30–180 ms
          hiPassFreq: 150 + normY * 1800, // keeps low thump when near bottom
          filterFreqs: [220 * brightness, 500 * brightness, 950 * brightness],
          filterQs: [7 + body * 4, 8 + body * 4, 10 + body * 4],
          // keep gains/saturation static so loudness only follows rotation-based volume
          filterGains: [16, 20, 24],
          saturation: 2.5,
          volume,
        };
      }
      case 'cowbell':
        return {
          freq1: 540 + normX * 120,
          freq2: 780 + normX * 140,
          centerFreq: 2000 + normY * 1200,
          decay: 200 + normY * 400,
          volume,
        };
      default:
        return { volume };
    }
  };

  const computeGapSeconds = (currentId, nextId) => {
    const distanceEntry = distancesRef.current.find(d => d.id === currentId);
    const rawDistance = distanceEntry?.distances[`Square ${nextId}`];
    const distance = isNaN(parseFloat(rawDistance))
      ? 150
      : parseFloat(rawDistance);
    const baseGap = Math.min(
      1.5,
      Math.max(0.05, distance * baseSecondsPerPixel)
    );
    const effectiveTempo = Math.max(0.01, tempoRef.current); // avoid divide-by-zero
    const scaledGap = baseGap / effectiveTempo;
    return Math.min(2.5, Math.max(0.02, scaledGap));
  };

  // Effect to set up Web Audio drum engine
  useEffect(() => {
    const newEngine =
      soundBank === 'synth' ? createSynthEngine() : createDrumEngine();
    const prevEngine = audioEngineRef.current;
    audioEngineRef.current = newEngine;
    if (prevEngine) {
      prevEngine.dispose();
    }
    return () => {
      if (schedulerRef.current.timeoutId) {
        clearTimeout(schedulerRef.current.timeoutId);
      }
      newEngine?.dispose();
      if (audioEngineRef.current === newEngine) {
        audioEngineRef.current = null;
      }
    };
  }, [soundBank]);

  // Sequencer and moving circle driven together
  useEffect(() => {
    // stop any existing animation
    if (schedulerRef.current.frameId) {
      cancelAnimationFrame(schedulerRef.current.frameId);
    }
    schedulerRef.current.running = false;

    const order = visitedOrderRef.current;
    if (
      isPaused ||
      !audioEngineRef.current ||
      order.length === 0 ||
      squaresRef.current.length === 0
    ) {
      setCurrentHit(null);
      setMovingCircleActive(false);
      return;
    }

    const startIndex =
      currentHit !== null && order.includes(currentHit)
        ? order.indexOf(currentHit)
        : 0;

    const step = index => {
      if (!audioEngineRef.current || isPaused) return;
      const ord = visitedOrderRef.current;
      if (ord.length === 0) return;

      const currentId = ord[index % ord.length];
      const nextId = ord[(index + 1) % ord.length];
      const square = squaresRef.current.find(sq => sq.id === currentId);
      const nextSquare = squaresRef.current.find(sq => sq.id === nextId);
      if (!square || !nextSquare) return;

      const startX = square.position.x + 50;
      const startY = square.position.y + 50;
      const endX = nextSquare.position.x + 50;
      const endY = nextSquare.position.y + 50;

      const gapSeconds = computeGapSeconds(currentId, nextId);
      const durationMs = gapSeconds * 1000;
      const startMs = performance.now();
      const endMs = startMs + durationMs;

      const activeBank = soundBankRef.current;
      const soundId = getSoundIdForColor(square.color, activeBank);
      const params = buildSoundParams(square, activeBank);
      const time = audioEngineRef.current.currentTime() + 0.005;
      if (soundId) {
        audioEngineRef.current.triggerSound(soundId, params, time);
      }
      setCurrentHit(currentId);

      setCirclePosition({ x: startX, y: startY });
      setMovingCircleActive(true);

      const animate = () => {
        if (!schedulerRef.current.running) return;
        // If user just dragged/rotated, clear the flag but keep timing in sync.
        if (schedulerRef.current.skipFrame) {
          schedulerRef.current.skipFrame = false;
        }
        const now = performance.now();
        const t = Math.min(1, (now - startMs) / durationMs);
        const x = startX + (endX - startX) * t;
        const y = startY + (endY - startY) * t;
        setCirclePosition({ x, y });

        if (t >= 1) {
          step((index + 1) % ord.length);
          return;
        }
        schedulerRef.current.frameId = requestAnimationFrame(animate);
      };

      schedulerRef.current.frameId = requestAnimationFrame(animate);
    };

    schedulerRef.current.running = true;
    step(startIndex);

    return () => {
      schedulerRef.current.running = false;
      if (schedulerRef.current.frameId) {
        cancelAnimationFrame(schedulerRef.current.frameId);
      }
    };
    // Only restart when pause state changes, the number of nodes changes, or a manual restart is requested.
    // Reordering/dragging updates refs without resetting the sequencer to avoid rapid retriggers.
  }, [isPaused, visitedOrder.length, restartKey]);
  // Effect to handle window resize events
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect to handle backspace key press for square deletion
  useEffect(() => {
    const handleBackspaceKeyPress = event => {
      if (event.key === 'Backspace' && selectedSquare != null) {
        deleteSquare(selectedSquare);
        setSelectedSquare(null);
      }
    };

    document.addEventListener('keydown', handleBackspaceKeyPress);
    return () =>
      document.removeEventListener('keydown', handleBackspaceKeyPress);
  }, [selectedSquare]);

  // Effect to update distances and visitedOrder
  useEffect(() => {
    const newDistances = squares.map(square => {
      const distancesToOthers = squares.reduce((acc, otherSquare) => {
        if (square.id !== otherSquare.id) {
          acc[`Square ${otherSquare.id}`] = calculateDistance(
            square.position,
            otherSquare.position
          );
        }
        return acc;
      }, {});
      return { id: square.id, distances: distancesToOthers };
    });
    setDistances(newDistances);
    setVisitedOrder(calculateShortestPath(squares));
  }, [squares]);

  // Effect to update square angles
  useEffect(() => {
    calculateAngles(visitedOrder, squares, setSquareAngles);
  }, [squares, visitedOrder]);

  return (
    <CurrentHitContext.Provider value={{ currentHit, setCurrentHit }}>
      <div
        style={{
          position: 'relative',
          width: window.innerWidth,
          height: window.innerHeight,
          overflow: 'hidden', // Hide the overflow
        }}
      >
        {/* Conditionally render the logo */}
        {!showDisplays && (
          <a
            href="https://www.iimaginary.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={logo}
              alt="Logo"
              style={{
                position: 'absolute',
                width: '55px',
                height: '50px',
                paddingLeft: '10px',
                paddingTop: '10px',
              }}
            />
          </a>
        )}

        <canvas
          id="pathCanvas"
          style={{ position: 'absolute', top: 0, left: 0, zIndex: -1 }}
        ></canvas>
        {/* Centered container for "Add Node" button and checkboxes */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '15px',
            fontFamily: 'Courier New, monospace',
            gap: '12px',
          }}
        >
          {squares.length < 16 && (
            <button
              onClick={addSquare}
              style={{
                backgroundColor: 'white',
                color: 'black',
                padding: '10px 20px',
                textAlign: 'center',
                textDecoration: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                borderRadius: '2px',
                border: 'none',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                fontFamily: 'Courier New, monospace',
              }}
            >
              Add Node
            </button>
          )}
          <button
            onClick={restartSequence}
            style={{ padding: '10px 14px', fontFamily: 'inherit' }}
          >
            Restart
          </button>
          <select
            id="soundbank-select"
            value={soundBank}
            onChange={e => setSoundBank(e.target.value)}
            style={{ padding: '10px 12px', fontFamily: 'inherit' }}
          >
            <option value="drums">Drums</option>
            <option value="synth">Synth</option>
          </select>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'black',
            }}
          >
            <label htmlFor="tempo-slider">Tempo</label>
            <input
              id="tempo-slider"
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={tempo}
              onChange={e => setTempo(parseFloat(e.target.value))}
            />
            <span style={{ color: 'black' }}>{tempo.toFixed(1)}x</span>
          </div>
          <Controls
            showDisplays={showDisplays}
            toggleDisplays={toggleDisplays}
            showCrosshair={showCrosshair}
            toggleCrosshair={toggleCrosshair}
            isPaused={isPaused}
            togglePlayPause={togglePlayPause}
            showHelpModal={showHelpModal}
            handleHelpModalChange={handleHelpModalChange}
          />
        </div>
        {/* Render the path rectangles */}
        {visitedOrder.map((id, index) => {
          const square = squares.find(sq => sq.id === id);
          if (!square) return null;

          let nextSquareIndex = (index + 1) % visitedOrder.length;
          // Check if there are only two squares and if it's the second iteration
          if (visitedOrder.length === 2 && index === 1) {
            return null; // Don't render the second rectangle
          }

          const nextSquare = squares.find(
            sq => sq.id === visitedOrder[nextSquareIndex]
          );

          return (
            <Path
              key={id}
              startX={square.position.x + 50} // Center of the square
              startY={square.position.y + 50}
              endX={nextSquare.position.x + 50}
              endY={nextSquare.position.y + 50}
            />
          );
        })}

        {/* Render squares */}
        {squares.map(square => (
          <Square
            key={square.id}
            id={square.id}
            color={square.color}
            position={square.position}
            rotation={square.rotation}
            onDrag={handleDrag}
            onRotate={handleRotate}
            onRightClick={handleRightClick}
            onSelect={selectSquare}
          />
        ))}
        {showDisplays && (
          <DistanceDisplay
            distances={distances}
            style={{ marginLeft: '10px', marginTop: '10px' }}
          />
        )}
        {showDisplays && <SquareDetails squares={squares} />}
        <PathDisplay path={visitedOrder} distances={distances} />
        {movingCircleActive && !isPaused && (
          <MovingCircle position={circlePosition} />
        )}
        <ConcentricCircles radius={120} spacing={120} count={5} />
        {showCrosshair && <Crosshairs squares={squares} />}
        <HelpModal isOpen={showHelpModal} onClose={closeHelpModal} />
      </div>
    </CurrentHitContext.Provider>
  );
};

export default App;
