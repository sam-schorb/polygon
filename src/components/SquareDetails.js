// SquareDetails.js
// Displays information about nodes for both layers, including position and rotation

const SquareDetails = ({
  squaresA = [],
  squaresB = [],
  topOffset = '70px',
  bottomOffset = 0,
}) => {
  const renderLayer = (squares, label) =>
    squares.map(({ id, position, rotation }) => (
      <p key={`${label}-${id}`}>
        Node {id} - {label}: x={position.x.toFixed(0)}, y={position.y.toFixed(0)}, rotation={rotation.toFixed(2)}&deg;
      </p>
    ));

  const hasLayerB = squaresB.length > 0;

  return (
    <div
      style={{
        position: 'absolute',
        top: topOffset,
        right: 0,
        width: '220px',
        overflowY: 'auto',
        maxHeight: `calc(100vh - ${topOffset} - ${bottomOffset}px)`,
        paddingRight: '8px',
        boxSizing: 'border-box',
      }}
    >
      {renderLayer(squaresA, 'Layer A')}
      {hasLayerB && renderLayer(squaresB, 'Layer B')}
    </div>
  );
};

export default SquareDetails;
