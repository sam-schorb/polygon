/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createDrumEngine } from '../audio/drums';
import { createSynthEngine } from '../audio/fmEngine';
import {
  calculateCentreOfMass,
  calculateDistance,
  squaredPolar,
} from '../utils/math';
import {
  normalizeRotation,
} from '../utils/utils';
import logo from '../images/cloudLogoSVG.svg';
import ConcentricCircles from './ConcentricCircles';
import Controls from './Controls';
import Crosshairs from './Crosshairs';
import DistanceDisplay from './DistanceDisplay';
import HelpModal from './HelpModal';
import MovingCircle from './MovingCircle';
import Path from './Path';
import PathDisplay from './PathDisplay';
import Square from './Square';
import SquareDetails from './SquareDetails';
import CircleNode from './CircleNode';

export const CurrentHitContext = React.createContext();

const COLOR_KEYS = ['red', 'green', 'pink', 'purple', 'orange', 'blue'];
const BASE_PALETTE = {
  red: '#ff4d4f',
  green: '#4caf50',
  pink: '#ff7eb6',
  purple: '#9c27b0',
  orange: '#ff9800',
  blue: '#2196f3',
};
const LAYER2_PALETTE = {
  red: '#ff9a9a',
  green: '#8bd98b',
  pink: '#ffb3d1',
  purple: '#b98ad8',
  orange: '#ffbe73',
  blue: '#6ab8ff',
};

const baseSecondsPerPixel = 0.0015;
const NODE_SIZE = 80;
const NODE_CENTER = NODE_SIZE / 2;

const getSoundIdForColor = (colorKey, bank) => {
  const drumMap = {
    red: 'kick',
    green: 'snare',
    purple: 'clap',
    orange: 'hat',
    blue: 'rim',
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
  return map[colorKey] || null;
};

const clamp01 = v => Math.max(0, Math.min(1, v));

const buildSoundParams = (node, bank) => {
  const normX = node.position.x / window.innerWidth;
  const normY = node.position.y / window.innerHeight;
  const gainFromRotation = ((node.rotation % 360) + 360) % 360 / 360;
  const minDb = -16;
  const maxDb = 0;
  const db = minDb + (maxDb - minDb) * gainFromRotation;
  const volume = Math.pow(10, db / 20);

  const soundId = getSoundIdForColor(node.colorKey, bank);
  if (bank === 'synth') {
    const tone = clamp01(normX);
    const length = clamp01(normY);
    switch (soundId) {
      case 'bubble':
        return {
          volume,
          tone,
          length: clamp01(normY * 1.2),
          baseFreq: 140 + normY * 260,
        };
      case 'harshPluck':
        return {
          volume,
          tone,
          length: clamp01(normY * 1.5),
        };
      case 'highPluck':
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
    case 'rim':
      return {
        decay: 30 + normY * 150,
        hiPassFreq: 150 + normY * 1800,
        filterFreqs: [220 * (0.7 + normX * 1.6), 500 * (0.7 + normX * 1.6), 950 * (0.7 + normX * 1.6)],
        filterQs: [7 + (0.6 + normY * 1.4) * 4, 8 + (0.6 + normY * 1.4) * 4, 10 + (0.6 + normY * 1.4) * 4],
        filterGains: [16, 20, 24],
        saturation: 2.5,
        volume,
      };
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

const reorderNodes = nodes => {
  if (nodes.length === 0) return [];
  const centre = calculateCentreOfMass(nodes.map(n => n.position));
  return nodes
    .map(node => ({
      ...node,
      polarCoords: squaredPolar(node.position, centre),
    }))
    .sort((a, b) => a.polarCoords[0] - b.polarCoords[0] || a.polarCoords[1] - b.polarCoords[1])
    .map(node => ({
      id: node.id,
      color: node.color,
      colorKey: node.colorKey,
      position: node.position,
      rotation: node.rotation,
    }));
};

const calculateShortestPath = nodes => {
  if (nodes.length === 0) return [];
  const ordered = reorderNodes(nodes);
  return ordered.map(n => n.id);
};

const computeDistances = nodes =>
  nodes.map(node => {
    const distancesToOthers = nodes.reduce((acc, otherNode) => {
      if (node.id !== otherNode.id) {
        acc[`Square ${otherNode.id}`] = calculateDistance(
          node.position,
          otherNode.position
        );
      }
      return acc;
    }, {});
    return { id: node.id, distances: distancesToOthers };
  });

const useLayerEngine = ({
  id,
  shape,
  palette,
  enabled,
  globalRestartKey,
  isPaused,
  tempo,
}) => {
  const [nodes, setNodes] = useState([]);
  const [visitedOrder, setVisitedOrder] = useState([]);
  const [distances, setDistances] = useState([]);
  const [currentHit, setCurrentHit] = useState(null);
  const [circlePosition, setCirclePosition] = useState({ x: 0, y: 0 });
  const [movingCircleActive, setMovingCircleActive] = useState(false);
  const [soundBank, setSoundBank] = useState('drums');
  const [soundBankChangedKey, setSoundBankChangedKey] = useState(0);

  const audioEngineRef = useRef(null);
  const schedulerRef = useRef({
    frameId: null,
    running: false,
    skipFrame: false,
  });
  const nodesRef = useRef(nodes);
  const visitedOrderRef = useRef(visitedOrder);
  const distancesRef = useRef(distances);
  const soundBankRef = useRef(soundBank);

  const getDisplayColor = useCallback(
    colorKey => palette[colorKey] || BASE_PALETTE[colorKey] || colorKey,
    [palette]
  );

  const getRandomColorKey = useCallback(() => {
    const keys = COLOR_KEYS;
    return keys[Math.floor(Math.random() * keys.length)];
  }, []);

  const rotateColorKey = useCallback(colorKey => {
    const colors = COLOR_KEYS;
    const currentIndex = colors.indexOf(colorKey);
    const nextIndex = (currentIndex + 1) % colors.length;
    return colors[nextIndex];
  }, []);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    visitedOrderRef.current = visitedOrder;
  }, [visitedOrder]);

  useEffect(() => {
    distancesRef.current = distances;
  }, [distances]);

  useEffect(() => {
    soundBankRef.current = soundBank;
    setSoundBankChangedKey(k => k + 1); // trigger engine swap
  }, [soundBank]);

  useEffect(() => {
    if (!enabled) return;
    const newEngine =
      soundBankRef.current === 'synth' ? createSynthEngine() : createDrumEngine();
    const prevEngine = audioEngineRef.current;
    audioEngineRef.current = newEngine;
    if (prevEngine) {
      prevEngine.dispose();
    }
    return () => {
      newEngine?.dispose();
      if (audioEngineRef.current === newEngine) {
        audioEngineRef.current = null;
      }
    };
  }, [enabled, soundBankChangedKey]);

  useEffect(() => {
    if (!enabled) return;
    const newDistances = computeDistances(nodes);
    setDistances(newDistances);
    setVisitedOrder(calculateShortestPath(nodes));
  }, [nodes, enabled]);

  const computeGapSeconds = useCallback(
    (currentId, nextId) => {
      const distanceEntry = distancesRef.current.find(d => d.id === currentId);
      const rawDistance = distanceEntry?.distances[`Square ${nextId}`];
      const distance = isNaN(parseFloat(rawDistance)) ? 150 : parseFloat(rawDistance);
      const baseGap = Math.min(1.5, Math.max(0.05, distance * baseSecondsPerPixel));
      const scaled = baseGap / Math.max(0.01, tempo);
      return Math.min(2.5, Math.max(0.02, scaled));
    },
    [tempo]
  );

  useEffect(() => {
    if (!enabled) return;
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
      nodesRef.current.length === 0
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
      const node = nodesRef.current.find(n => n.id === currentId);
      const nextNode = nodesRef.current.find(n => n.id === nextId);
      if (!node || !nextNode) return;

      const startX = node.position.x + NODE_CENTER;
      const startY = node.position.y + NODE_CENTER;
      const endX = nextNode.position.x + NODE_CENTER;
      const endY = nextNode.position.y + NODE_CENTER;

      const gapSeconds = computeGapSeconds(currentId, nextId);
      const durationMs = gapSeconds * 1000;
      const startMs = performance.now();

      const bank = soundBankRef.current;
      const soundId = getSoundIdForColor(node.colorKey, bank);
      const params = buildSoundParams(node, bank);
      const time = audioEngineRef.current.currentTime() + 0.005;
      if (soundId) {
        audioEngineRef.current.triggerSound(soundId, params, time);
      }
      setCurrentHit(currentId);

      setCirclePosition({ x: startX, y: startY });
      setMovingCircleActive(true);

      const animate = () => {
        if (!schedulerRef.current.running) return;
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
  }, [isPaused, visitedOrder.length, globalRestartKey, enabled, computeGapSeconds]);

  const addNode = useCallback(() => {
    if (!enabled) return;
    setNodes(prev => {
      if (prev.length >= 16) return prev;
      const colorKey = getRandomColorKey();
      const displayColor = getDisplayColor(colorKey);
      return [
        ...prev,
        {
          id: prev.length + 1,
          color: displayColor,
          colorKey,
          position: {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          },
          rotation: Math.random() * 360,
        },
      ];
    });
  }, [enabled, getDisplayColor, getRandomColorKey]);

  const deleteNode = useCallback(
    id => {
      setNodes(prev => {
        const remaining = prev.filter(node => node.id !== id);
        const updated = remaining.map((node, index) => ({
          ...node,
          id: index + 1,
        }));
        return updated;
      });
    },
    [setNodes]
  );

  const handleDrag = useCallback((id, newPosition) => {
    schedulerRef.current.skipFrame = true;
    setMovingCircleActive(false);
    setNodes(prev =>
      prev.map(node =>
        node.id === id ? { ...node, position: newPosition } : node
      )
    );
  }, []);

  const handleRotate = useCallback((id, newRotation) => {
    schedulerRef.current.skipFrame = true;
    setMovingCircleActive(false);
    setNodes(prev =>
      prev.map(node =>
        node.id === id ? { ...node, rotation: normalizeRotation(newRotation) } : node
      )
    );
  }, []);

  const handleRightClick = useCallback(
    id => {
      setNodes(prev =>
        prev.map(node => {
          if (node.id !== id) return node;
          const nextKey = rotateColorKey(node.colorKey);
          return {
            ...node,
            colorKey: nextKey,
            color: getDisplayColor(nextKey),
          };
        })
      );
    },
    [rotateColorKey, getDisplayColor]
  );

  return {
    id,
    shape,
    nodes,
    visitedOrder,
    distances,
    currentHit,
    circlePosition,
    movingCircleActive,
    soundBank,
    setSoundBank,
    addNode,
    deleteNode,
    handleDrag,
    handleRotate,
    handleRightClick,
    setCurrentHit,
  };
};

const App = () => {
  const [showDisplays, setShowDisplays] = useState(false);
  const [showCrosshair, setShowCrosshair] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [tempo, setTempo] = useState(1);
  const [globalRestartKey, setGlobalRestartKey] = useState(0);
  const [layer2Enabled, setLayer2Enabled] = useState(false);
  const prevLayer2EnabledRef = useRef(layer2Enabled);

  const handleHelpModalChange = e => setShowHelpModal(e.target.checked);
  const closeHelpModal = () => setShowHelpModal(false);
  const togglePlayPause = () => setIsPaused(prev => !prev);
  const toggleDisplays = () => setShowDisplays(prev => !prev);
  const toggleCrosshair = () => setShowCrosshair(prev => !prev);

  const layer1 = useLayerEngine({
    id: 1,
    shape: 'square',
    palette: BASE_PALETTE,
    enabled: true,
    globalRestartKey,
    isPaused,
    tempo,
  });
  const layer2 = useLayerEngine({
    id: 2,
    shape: 'circle',
    palette: LAYER2_PALETTE,
    enabled: layer2Enabled,
    globalRestartKey,
    isPaused,
    tempo,
  });

  useEffect(() => {
    const handleBackspaceKeyPress = event => {
      if (event.key !== 'Backspace' || !selectedNode) return;

      if (selectedNode.layer === 1) {
        layer1.deleteNode(selectedNode.id);
      } else if (selectedNode.layer === 2 && layer2Enabled) {
        layer2.deleteNode(selectedNode.id);
      }
      setSelectedNode(null);
    };

    document.addEventListener('keydown', handleBackspaceKeyPress);
    return () =>
      document.removeEventListener('keydown', handleBackspaceKeyPress);
  }, [selectedNode, layer1.deleteNode, layer2.deleteNode, layer2Enabled]);

  const addLayer = () => {
    if (!layer2Enabled && layer1.nodes.length > 0) {
      setLayer2Enabled(true);
    }
  };

  useEffect(() => {
    const prevEnabled = prevLayer2EnabledRef.current;

    if (layer2Enabled && !prevEnabled) {
      layer2.addNode();
    } else if (layer2Enabled && layer2.nodes.length === 0) {
      setLayer2Enabled(false);
      setSelectedNode(prev =>
        prev && prev.layer === 2 ? null : prev
      );
    }

    prevLayer2EnabledRef.current = layer2Enabled;
  }, [layer2Enabled, layer2.nodes.length, layer2.addNode]);

  const restartAll = () => {
    setIsPaused(false);
    layer1.setCurrentHit(null);
    layer2.setCurrentHit(null);
    setGlobalRestartKey(k => k + 1);
  };

  const pathColor1 = '#555';
  const pathColor2 = '#0b84ff';
  const beadColor1 = 'black';
  const beadColor2 = '#0b84ff';
  const hasLayerB = layer2Enabled && layer2.nodes.length > 0;
  const pathBarOffset = showDisplays ? (hasLayerB ? 100 : 50) : 0;

  return (
    <CurrentHitContext.Provider value={{ currentHit: layer1.currentHit, setCurrentHit: layer1.setCurrentHit }}>
      <div
        style={{
          position: 'relative',
          width: window.innerWidth,
          height: window.innerHeight,
          overflow: 'hidden',
        }}
      >
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
              filter: 'invert(1)',
              zIndex: 6,
            }}
          />
        </a>

        <canvas
          id="pathCanvas"
          style={{ position: 'absolute', top: 0, left: 0, zIndex: -1 }}
        ></canvas>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '15px',
            fontFamily: 'Courier New, monospace',
            gap: '12px',
            position: 'relative',
            zIndex: 5,
          }}
        >
          {layer1.nodes.length < 16 && (
            <button
              onClick={layer1.addNode}
              style={{
                padding: '10px 14px',
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              Add Node A
            </button>
          )}
          <select
            id="soundbank-select-a"
            aria-label="Layer A sound bank"
            value={layer1.soundBank}
            onChange={e => layer1.setSoundBank(e.target.value)}
            style={{ padding: '10px 12px', fontFamily: 'inherit' }}
          >
            <option value="drums">Drums</option>
            <option value="synth">Synth</option>
          </select>
          {!layer2Enabled && layer1.nodes.length > 0 && (
            <button
              onClick={addLayer}
              style={{ padding: '10px 14px', fontFamily: 'inherit' }}
            >
              Add Layer
            </button>
          )}
          {layer2Enabled && layer2.nodes.length < 16 && (
            <button
              onClick={layer2.addNode}
              style={{ padding: '10px 14px', fontFamily: 'inherit' }}
            >
              Add Node B
            </button>
          )}
          {layer2Enabled && (
            <select
              id="soundbank-select-b"
              aria-label="Layer B sound bank"
              value={layer2.soundBank}
              onChange={e => layer2.setSoundBank(e.target.value)}
              style={{ padding: '10px 12px', fontFamily: 'inherit' }}
            >
              <option value="drums">Drums</option>
              <option value="synth">Synth</option>
            </select>
          )}
          <button
            onClick={restartAll}
            style={{ padding: '10px 14px', fontFamily: 'inherit' }}
          >
            Restart
          </button>
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

        {layer1.visitedOrder.map((id, index) => {
          const node = layer1.nodes.find(n => n.id === id);
          if (!node) return null;
          const nextNode =
            layer1.nodes.find(
              n => n.id === layer1.visitedOrder[(index + 1) % layer1.visitedOrder.length]
            ) || node;
          if (layer1.visitedOrder.length === 2 && index === 1) return null;
          return (
            <Path
              key={`p1-${id}`}
              startX={node.position.x + NODE_CENTER}
              startY={node.position.y + NODE_CENTER}
              endX={nextNode.position.x + NODE_CENTER}
              endY={nextNode.position.y + NODE_CENTER}
              color={pathColor1}
              borderColor="#222"
            />
          );
        })}

        {layer2Enabled &&
          layer2.visitedOrder.map((id, index) => {
            const node = layer2.nodes.find(n => n.id === id);
            if (!node) return null;
            const nextNode =
              layer2.nodes.find(
                n =>
                  n.id ===
                  layer2.visitedOrder[(index + 1) % layer2.visitedOrder.length]
              ) || node;
            if (layer2.visitedOrder.length === 2 && index === 1) return null;
            return (
              <Path
                key={`p2-${id}`}
                startX={node.position.x + NODE_CENTER}
                startY={node.position.y + NODE_CENTER}
                endX={nextNode.position.x + NODE_CENTER}
                endY={nextNode.position.y + NODE_CENTER}
                color={pathColor2}
                borderColor="black"
              />
          );
        })}

        {layer1.nodes.map(node => (
          <Square
            key={`l1-${node.id}`}
            id={node.id}
            color={node.color}
            colorKey={node.colorKey}
            position={node.position}
            rotation={node.rotation}
            onDrag={layer1.handleDrag}
            onRotate={layer1.handleRotate}
            onRightClick={layer1.handleRightClick}
            onSelect={setSelectedNode}
            soundBank={layer1.soundBank}
          />
        ))}

        {layer2Enabled &&
          layer2.nodes.map(node => (
            <CircleNode
              key={`l2-${node.id}`}
              id={node.id}
              color={node.color}
              colorKey={node.colorKey}
              position={node.position}
              rotation={node.rotation}
              onDrag={layer2.handleDrag}
              onRotate={layer2.handleRotate}
              onRightClick={layer2.handleRightClick}
              onSelect={setSelectedNode}
              soundBank={layer2.soundBank}
            />
          ))}

        {showDisplays && (
          <DistanceDisplay
            distances={layer1.distances}
            sections={
              layer2Enabled
                ? [
                    { label: 'Layer A', distances: layer1.distances },
                    { label: 'Layer B', distances: layer2.distances },
                  ]
                : undefined
            }
            style={{ marginLeft: '10px', marginTop: '10px' }}
            bottomOffset={pathBarOffset}
          />
        )}
        {showDisplays && (
          <SquareDetails
            squaresA={layer1.nodes}
            squaresB={hasLayerB ? layer2.nodes : []}
            bottomOffset={pathBarOffset}
          />
        )}
        {showDisplays && (layer1.visitedOrder.length > 0 || (layer2Enabled && layer2.visitedOrder.length > 0)) && (
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              zIndex: 2,
            }}
          >
            <PathDisplay
              path={layer1.visitedOrder}
              distances={layer1.distances}
              label="Layer A"
              backgroundColor="#9b9b9b"
            />
            {hasLayerB && (
              <PathDisplay
                path={layer2.visitedOrder}
                distances={layer2.distances}
                label="Layer B"
                backgroundColor="#7a7a7a"
              />
            )}
          </div>
        )}
        {layer1.movingCircleActive && !isPaused && (
          <MovingCircle position={layer1.circlePosition} color={beadColor1} />
        )}
        {layer2Enabled && layer2.movingCircleActive && !isPaused && (
          <MovingCircle position={layer2.circlePosition} color={beadColor2} />
        )}
        <ConcentricCircles radius={120} spacing={120} count={5} />
        {showCrosshair && <Crosshairs squares={layer1.nodes} />}
        <HelpModal isOpen={showHelpModal} onClose={closeHelpModal} />
      </div>
    </CurrentHitContext.Provider>
  );
};

export default App;
