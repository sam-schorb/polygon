const MovingCircle = ({ position }) => {
    return (
      <div style={{
        position: 'absolute',
        left: `${position.x - 8}px`,
        top: `${position.y - 8}px`,
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: 'black',
        zIndex: 2, // Medium z-index
        transform: 'translateZ(0)', // Trigger hardware acceleration
      }} />
    );
  };

export default MovingCircle;
