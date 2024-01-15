// SquareDetails.js
// Displays the information about each of the squares including position and rotation

const SquareDetails = ({ squares }) => {
    return (
      <div style={{ position: 'absolute', top: 0, right: 0, width: '220px', overflowY: 'auto', maxHeight: '100%' }}>
        {squares.map(({ id, position, rotation }) => (
          <p key={id}>
            Node {id}: x={position.x.toFixed(0)}, y={position.y.toFixed(0)}, rotation={rotation.toFixed(2)}&deg;
          </p>
        ))}
      </div>
    );
  };

  export default SquareDetails;
