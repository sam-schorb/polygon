import React, { memo, useRef } from 'react';
import useInteract from '../utils/useInteract';
import { getNodeIcon } from '../utils/nodeIcons';

const CircleNode = memo(
  ({ id, color, colorKey, position, rotation, onDrag, onRotate, onRightClick, onSelect, soundBank }) => {
    const ref = useRef(null);
    const rotateHandleRef = useRef(null);
    useInteract(
      ref,
      rotateHandleRef,
      position,
      rotation,
      newPos => onDrag(id, newPos),
      newRotation => onRotate(id, newRotation)
    );

    const handleContextMenu = event => {
      event.preventDefault();
      onRightClick(id);
    };

    const handleClick = () => {
      if (onSelect) {
        onSelect({ id, layer: 2 });
      }
    };

    const nodeIcon = getNodeIcon(colorKey, soundBank);

    const nodeStyle = {
      width: '80px',
      height: '80px',
      backgroundColor: color,
      position: 'absolute',
      left: `${position.x}px`,
      top: `${position.y}px`,
      transform: `rotate(${rotation}deg) translateZ(0)`,
      lineHeight: '80px',
      textAlign: 'center',
      color: 'white',
      fontWeight: 'bold',
      cursor: 'move',
      border: '2px solid #737373',
      boxShadow: `0px 0px 10px 0px #737373`,
      zIndex: 3,
      borderRadius: '50%',
      overflow: 'hidden',
    };

    const rotateHandleStyle = {
      position: 'absolute',
      bottom: '4px',
      right: '4px',
      width: '18px',
      height: '18px',
      backgroundColor: '#383838',
      cursor: 'pointer',
      borderRadius: '50%',
    };

    return (
      <div
        ref={ref}
        style={nodeStyle}
        onContextMenu={handleContextMenu}
        onClick={handleClick}
        aria-label={`Circle node ${id}`}
      >
        {nodeIcon && (
          <img
            src={nodeIcon}
            alt="Circle Icon"
            style={{
              width: '40px',
              height: 'auto',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
          />
        )}
        <div ref={rotateHandleRef} style={rotateHandleStyle} />
      </div>
    );
  }
);

export default CircleNode;
