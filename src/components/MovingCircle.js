// MovingCircle.js
// A bead that moves from node to node, visualising the timing of the sequence

const MovingCircle = ({ position, color = 'black' }) => {
    return (
      <div style={{
        position: 'absolute',
        left: `${position.x - 6}px`,
        top: `${position.y - 6}px`,
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: color,
        zIndex: 2, // Medium z-index
        transform: 'translateZ(0)', // Trigger hardware acceleration
      }} />
    );
  };

export default MovingCircle;
