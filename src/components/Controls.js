// Controls.js
import React from 'react';

function Controls({
  squaresLength,
  addSquareCallback,
  showDisplays,
  toggleDisplays,
  showCrosshair,
  toggleCrosshair,
  isPaused,
  togglePlayPause,
  showHelpModal,
  handleHelpModalChange
}) {
  return (
    <div className="controls" style={{ display: 'flex' }}>
      {/* "Add Node" button */}
      {squaresLength < 16 && (
        <button onClick={addSquareCallback} style={{
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
        }}>
          Add Node
        </button>
      )}

      {/* Container for checkboxes */}
      <div style={{ display: 'flex', marginLeft: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showDisplays}
            onChange={toggleDisplays}
            style={{ width: '20px', height: '20px', marginRight: '5px' }}
          />
          <span style={{ fontSize: '16px' }}>Details</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginLeft: '10px' }}>
          <input
            type="checkbox"
            checked={showCrosshair}
            onChange={toggleCrosshair}
            style={{ width: '20px', height: '20px', marginRight: '5px' }}
          />
          <span style={{ fontSize: '16px' }}>Crosshair</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginLeft: '10px' }}>
          <input
            type="checkbox"
            checked={isPaused}
            onChange={togglePlayPause}
            style={{ width: '20px', height: '20px', marginRight: '5px' }}
          />
          <span style={{ fontSize: '16px' }}>Pause</span>
        </label>
        <label style={{ marginLeft: '10px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={showHelpModal} 
            onChange={handleHelpModalChange}
            style={{ width: '20px', height: '20px', marginRight: '5px' }}
          />
          <span style={{ fontSize: '16px' }}>Help</span>
        </label>
      </div>
    </div>
  );
}

export default Controls;