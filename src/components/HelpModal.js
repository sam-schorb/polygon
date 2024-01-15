// HelpModal.js
const HelpModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
  
    return (
      <>
        <div style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.5)', 
            zIndex: 999 
          }} 
          onClick={onClose}
        ></div>
        <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '20px',
            zIndex: 1000,
            border: '1px solid black',
            borderRadius: '8px',
          }}>
          <div style={{ 
              position: 'absolute', 
              top: '10px', 
              right: '10px', 
              cursor: 'pointer', 
              fontSize: '18px' 
            }} 
            onClick={onClose}
          >
            X
          </div>
          <h2>Welcome to Polygon</h2>
          <p>
Generate drum patterns through spatial computing.
          </p>
          <ul>
            <li><strong>Adding Nodes:</strong> Click the 'Add Node button to place a new node on the screen. Each node represents a distinct sound in the drum sequence.</li>
            <br/>
            <li><strong>Sound Control:</strong> The position of nodes determines the sound you hear. Drag to reposition nodes. Right-click to cycle through different sound types. Rotate nodes to alter their sound characteristics.</li>
            <br/>
            <li><strong>Visual Patterns:</strong> The layout and arrangement of nodes create visual patterns that correspond to the rhythm and texture of the drum sequence.</li>
            <br/>
            <li><strong>Sequence Timing:</strong> The distance between nodes influences the timing gaps in the drum sequence. Closer nodes produce rapid sequences, while further apart nodes create slower rhythms.</li>
            <br/>
            <li><strong>Deleting Nodes:</strong> Click on a node and hit the backspace key to remove that node from the screen</li>
          </ul>
          <p>
            Experiment with different arrangements to explore the creative possibilities of Polygon.
        </p>
        </div>
      </>
    );
  };
  
export default HelpModal;
  