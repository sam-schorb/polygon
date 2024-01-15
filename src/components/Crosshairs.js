const Crosshairs = ({ squares, outerCircleRadius }) => {
    if (!Array.isArray(squares) || squares.length === 0) return null; // Ensure squares is an array and not empty
  
    const crosshairLines = [];
    const angleIncrement = 360 / squares.length;
  
    for (let i = 0; i < squares.length; i++) {
      const angle = angleIncrement * i;
      crosshairLines.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '2px',
            height: `${600}px`,
            backgroundColor: 'black',
            opacity: 0.1,
            transform: `rotate(${angle}deg)`,
            transformOrigin:'center top',
            zIndex: 0 // Ensure zIndex is higher to make visible
          }}
        />
      );
    }
    return <>{crosshairLines}</>;
  };

  export default Crosshairs