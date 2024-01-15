// Rest of the App component continues here
const ConcentricCircles = ({ radius, spacing, count }) => {
    const circles = [];
    for (let i = 0; i < count; i++) {
      circles.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: `${2 * (radius + i * spacing)}px`,
            height: `${2 * (radius + i * spacing)}px`,
            borderRadius: '50%',
            backgroundColor: 'grey',
            opacity: 0.3,
            transform: 'translate(-50%, -50%)',
            zIndex: -2
          }}
        />
      );
    }
    return <>{circles}</>;
  };

  export default ConcentricCircles