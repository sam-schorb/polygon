// Square.js

import React, { useRef, memo, useContext } from 'react';
import useInteract from '../utils/useInteract';
import { CurrentHitContext } from './App'; // Import the context
import kick from '../images/kick.png';
import snare from '../images/snare.png';
import rim from '../images/bell.png';
import clap from '../images/clap.png';
import hat from '../images/hat.png';
import shaker from '../images/shaker.png';

const Square = memo(({ id, color, position, rotation, onDrag, onRotate, onRightClick, onSelect }) => {
  const { currentHit } = useContext(CurrentHitContext);
  const ref = useRef(null);
  const rotateHandleRef = useRef(null);
  useInteract(ref, rotateHandleRef, position, rotation, newPos => onDrag(id, newPos), newRotation => onRotate(id, newRotation));

  const handleClick = () => {
    onSelect(id);
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
    onRightClick(id);
  };

    // Function to get the corresponding image for each color
    const getImageForColor = (color) => {
      switch (color) {
        case 'red': return kick;
        case 'green': return snare;
        case 'pink': return rim;
        case 'purple': return clap;
        case 'orange': return hat;
        case 'blue': return shaker;
        default: return null;
      }
    };
  
    // Image style
    const imageStyle = {
      width: '40px',
      height: 'auto', // Maintain aspect ratio
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    };

  const squareStyle = {
    width: '80px',
    height: '80px',
    backgroundColor: color,
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: `rotate(${rotation}deg) translateZ(0)`, // Apply rotation and trigger hardware acceleration
    lineHeight: '80px',
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'move',
    border: currentHit === id ? '2px solid white' : '2px solid #737373',
    boxShadow: `0px 0px 10px 0px #737373`,
    zIndex: 3, // High z-index,

  };

  const rotateHandleStyle = {
    position: 'absolute',
    bottom: '0',
    right: '0',
    width: '20px',
    height: '20px',
    backgroundColor: '#383838',
    cursor: 'pointer'
  };

  return (
    <div ref={ref} style={squareStyle} onContextMenu={handleContextMenu} onClick={handleClick}>
      <img src={getImageForColor(color)} style={imageStyle} alt="Square Icon" />
      <div ref={rotateHandleRef} style={rotateHandleStyle} />
    </div>
  );
});

export default Square;
