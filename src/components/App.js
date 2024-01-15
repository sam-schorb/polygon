/* global RNBO */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getRandomColor, normalizeRotation, colorMap, getNextColor } from '../utils/utils';
import { calculateCentreOfMass, squaredPolar, calculateDistance, calculateAngles } from '../utils/math';
import Square from './Square';
import MovingCircle from './MovingCircle';
import ConcentricCircles from './ConcentricCircles';
import Crosshairs from './Crosshairs';
import Path from './Path';
import Controls from './Controls';
import DistanceDisplay from './DistanceDisplay';
import SquareDetails from './SquareDetails';
import PathDisplay from './PathDisplay';
import HelpModal from './HelpModal'; // import the HelpModal component
import setup from './Setup';
import logo from '../images/iimaginaryLogoLightGray.png';

export const CurrentHitContext = React.createContext();


const App = () => {
  const [currentHit, setCurrentHit] = useState(null);
  const [squares, setSquares] = useState([]);
  const [squareCount, setSquareCount] = useState(1);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [distances, setDistances] = useState([]);
  const [visitedOrder, setVisitedOrder] = useState([]);
  const [showDisplays, setShowDisplays] = useState(false); // New state variable
  const [showCrosshair, setShowCrosshair] = useState(false); // New state variable
  const [originalData, setOriginalData] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const rnboDevice = useRef(null);
  const [showHelpModal, setShowHelpModal] = useState(false); // state to control HelpModal visibility

  const [squareAngles, setSquareAngles] = useState({}); // New state for angles
  const outerCircleRadius = 300; // Radius of the outermost circle

  const [circlePosition, setCirclePosition] = useState({ x: 0, y: 0 });
  const [movingCircleActive, setMovingCircleActive] = useState(false);
  const circleSpeed = useRef(4); // Adjustable speed variable

  const currentHitRef = useRef(currentHit); // Ref to track the current hit

// Update currentHitRef whenever currentHit changes
useEffect(() => {
  currentHitRef.current = currentHit;
}, [currentHit]);


  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    setup(setCurrentHit).then(device => {
      rnboDevice.current = device;
      console.log("RNBO setup completed");
      // Verify if the device is correctly set
      if (rnboDevice.current) {
        sendStateToRNBO();
      } else {
        console.error("RNBO device was not set correctly.");
      }
    }).catch(err => {
      console.error("RNBO setup failed:", err);
    });
  }, []);

  useEffect(() => {
    if (rnboDevice.current) {
      sendStateToRNBO();
    }
  }, [squares, visitedOrder, distances]);

  // Moving circle logic
  useEffect(() => {
    if (currentHit !== null && squareAngles[currentHit]) {
      const currentSquare = squares.find(sq => sq.id === currentHit);
      const nextSquareIndex = (visitedOrder.indexOf(currentHit) + 1) % visitedOrder.length;
      const nextSquare = squares.find(sq => sq.id === visitedOrder[nextSquareIndex]);

      if (currentSquare && nextSquare) {
        const angleRad = squareAngles[currentHit] * (Math.PI / 180);
        const dx = Math.cos(angleRad) * circleSpeed.current;
        const dy = Math.sin(angleRad) * circleSpeed.current;

        setCirclePosition({
          x: currentSquare.position.x + 50, // Center of the current square
          y: currentSquare.position.y + 50
        });

        const moveCircle = () => {
          setCirclePosition(prevPos => {
            const distanceToNext = Math.sqrt(Math.pow(nextSquare.position.x + 50 - prevPos.x, 2) + Math.pow(nextSquare.position.y + 50 - prevPos.y, 2));
            if (distanceToNext < 5) {
              setMovingCircleActive(false);
              return prevPos; // Stop moving if close enough to the next square
            }
            return {
              x: prevPos.x + dx,
              y: prevPos.y + dy
            };
          });
        };

        setMovingCircleActive(true);
        const interval = setInterval(moveCircle, 1); // Adjust the interval for smoother animation

        return () => clearInterval(interval);
      }
    }
  }, [currentHit, squares, squareAngles, visitedOrder, circleSpeed.current]);



  const sendStateToRNBO = (dataToSend) => {
    if (!rnboDevice.current) {
      console.log('No RNBO device available');
      return;
    }

    const event = new RNBO.MessageEvent(RNBO.TimeNow, 'in1', dataToSend);
    rnboDevice.current.scheduleEvent(event);
  };

  const handleHelpModalChange = (e) => {
    setShowHelpModal(e.target.checked);
  };

  const closeHelpModal =
() => {
setShowHelpModal(false);
};

  const togglePlayPause = () => {
    setIsPaused(!isPaused);

    if (!isPaused) {
      // Pause the application
      setOriginalData(generateSquareDataAndAngles()); // Store current data
      sendStateToRNBO(new Array(96).fill(0)); // Send zeroes
    } else {
      // Resume the application
      sendStateToRNBO(originalData); // Send original data
    }
  };

  // Function to generate data for RNBO and calculate angles in the same order
  const generateSquareDataAndAngles = () => {
    const startIndex = visitedOrder.indexOf(1);
    const orderedVisit = startIndex >= 0 ? [...visitedOrder.slice(startIndex), ...visitedOrder.slice(0, startIndex)] : visitedOrder;

    const dataToSend = [];
    const newAngles = [];

    orderedVisit.forEach((id, index) => {
      const square = squares.find(sq => sq.id === id);
      const nextId = orderedVisit[(index + 1) % orderedVisit.length];
      const nextSquare = squares.find(sq => sq.id === nextId);

      if (square && nextSquare) {
        const dx = nextSquare.position.x - square.position.x;
        const dy = nextSquare.position.y - square.position.y;
        const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
        newAngles.push(angle);
      } else {
        newAngles.push(0); // Default angle if square not found
      }

      if (square) {
        const distance = distances.find(d => d.id === id)?.distances[`Square ${nextId}`] || 0;
        const colorNumber = colorMap[square.color];
        dataToSend.push(square.id, square.position.x, square.position.y, square.rotation, colorNumber, distance);
      }
    });

    setSquareAngles(newAngles);

    return dataToSend.flat().concat(Array(96).fill(0).slice(orderedVisit.length * 6));
  };

  useEffect(() => {
    if (rnboDevice.current && !isPaused) {
      const dataToSend = generateSquareDataAndAngles();
      sendStateToRNBO(dataToSend);
    }
  }, [squares, visitedOrder, distances, isPaused]);

    useEffect(() => {
      const handleResize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

  useEffect(() => {
    const handleBackspaceKeyPress = (event) => {
      if (event.key === 'Backspace' && selectedSquare != null) {
        deleteSquare(selectedSquare);
        setSelectedSquare(null);
      }
    };

    document.addEventListener('keydown', handleBackspaceKeyPress);
    return () => document.removeEventListener('keydown', handleBackspaceKeyPress);
  }, [selectedSquare]);

  useEffect(() => {
    const newDistances = squares.map(square => {
      const distancesToOthers = squares.reduce((acc, otherSquare) => {
        if (square.id !== otherSquare.id) {
          acc[`Square ${otherSquare.id}`] = calculateDistance(square.position, otherSquare.position);
        }
        return acc;
      }, {});
      return { id: square.id, distances: distancesToOthers };
    });
    setDistances(newDistances);
    setVisitedOrder(calculateShortestPath(squares));
  }, [squares]);


  // Function to reorder points using the polar coordinates method
  const reorderSquares = (squares) => {
    const centre = calculateCentreOfMass(squares.map(sq => sq.position));
    return squares.map(square => ({
      ...square,
      polarCoords: squaredPolar(square.position, centre)
    }))
    .sort((a, b) => a.polarCoords[0] - b.polarCoords[0] || a.polarCoords[1] - b.polarCoords[1])
    .map(sq => ({ id: sq.id, color: sq.color, position: sq.position, rotation: sq.rotation }));
  };



    useEffect(() => {
      calculateAngles( visitedOrder, squares, setSquareAngles );
    }, [squares, visitedOrder]);

  // Modified function to calculate the shortest path using reordered squares
  const calculateShortestPath = (squares) => {
    if (squares.length === 0) return [];

    const orderedSquares = reorderSquares(squares);
    return orderedSquares.map(sq => sq.id);
  };    


    
    const addSquare = () => {
      if (squares.length < 16) {
        
        setSquares(squares => [
          ...squares,
          {
            id: squares.length + 1,
            color: getRandomColor(),
            position: {
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight
            },
            rotation: Math.random() * 360
          }
        ]);

      }
    };
  

  const handleDrag = useCallback((id, newPosition) => {
    setSquares(squares => squares.map(square => square.id === id ? { ...square, position: newPosition } : square));
  }, []);

  const handleRotate = useCallback((id, newRotation) => {
    setSquares(squares => squares.map(square => square.id === id ? { ...square, rotation: normalizeRotation(newRotation) } : square));
  }, []);

  const handleRightClick = useCallback((id) => {
    setSquares(squares => squares.map(square => {
      if (square.id === id) {
        return { ...square, color: getNextColor(square.color) };
      }
      return square;
    }));
  }, []);

  const selectSquare = useCallback((id) => {
    setSelectedSquare(id);
  }, []);

  const deleteSquare = (id) => {
    // Filter out the deleted square
    const remainingSquares = squares.filter(square => square.id !== id);

    // Reassign IDs to make them continuous
    const updatedSquares = remainingSquares.map((square, index) => ({
        ...square,
        id: index + 1
    }));

    // Update visitedOrder and distances for the new IDs
    const updatedVisitedOrder = updatedSquares.map(square => square.id);
    const updatedDistances = updatedSquares.map(square => {
        const distancesToOthers = updatedSquares.reduce((acc, otherSquare) => {
            if (square.id !== otherSquare.id) {
                acc[`Square ${otherSquare.id}`] = calculateDistance(square.position, otherSquare.position);
            }
            return acc;
        }, {});
        return { id: square.id, distances: distancesToOthers };
    });

    setSquares(updatedSquares);
    setVisitedOrder(updatedVisitedOrder);
    setDistances(updatedDistances);
    setSquareCount(updatedSquares.length); // This line ensures the next square ID is correct
};


const toggleDisplays = () => {
  setShowDisplays(!showDisplays); // Toggle the state
};

const toggleCrosshair = () => {
  setShowCrosshair(!showCrosshair); // Toggle the state
};


return (
  <CurrentHitContext.Provider value={{ currentHit, setCurrentHit }}>

  <div style={{
    position: 'relative',
    width: window.innerWidth,
    height: window.innerHeight,
    overflow: 'hidden', // Hide the overflow

  }}>
      {/* Conditionally render the logo */}
      {!showDisplays && (
        <a href="https://www.iimaginary.com/" target="_blank" rel="noopener noreferrer">
          <img 
            src={logo}
            alt="Logo"
            style={{ 
              position: 'absolute', 
              width: '55px', 
              height: '50px', 
              paddingLeft: '10px',
              paddingTop: '10px' 
            }}
          />
        </a>
      )}

    <canvas id="pathCanvas" style={{ position: 'absolute', top: 0, left: 0, zIndex: -1 }}></canvas>
      {/* Centered container for "Add Node" button and checkboxes */}
      <div style={{
        display: 'flex',
        justifyContent: 'center', // This centers the .controls div
        alignItems: 'center',
        marginTop: '15px',
        fontFamily: 'Courier New, monospace',
      }}>
        <Controls
          squaresLength={squares.length}
          addSquareCallback={addSquare} // Replace with actual function from your App component
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

          const nextSquare = squares.find(sq => sq.id === visitedOrder[nextSquareIndex]);

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
    {showDisplays && <DistanceDisplay distances={distances} style={{ marginLeft: '10px', marginTop: '10px' }} />}
    {showDisplays && <SquareDetails squares={squares} />}
    <PathDisplay path={visitedOrder} distances={distances} />
    {movingCircleActive && <MovingCircle position={circlePosition} />}
    <ConcentricCircles radius={120} spacing={120} count={5} />
    {showCrosshair && <Crosshairs squares={squares} outerCircleRadius={outerCircleRadius} />}
    <HelpModal isOpen={showHelpModal} onClose={closeHelpModal} />


  </div>
  </CurrentHitContext.Provider>

);
};

export default App;