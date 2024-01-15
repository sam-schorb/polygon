// PathDisplay.js
// Displays the order of the nodes in the sequence and the distance from node to node

const PathDisplay = ({ path, distances }) => {
    if (!path || path.length === 0) return null;
  
    // Ensure Square 1 is always the starting point
    const startIndex = path.indexOf(1);
    const orderedPath = startIndex >= 0 ? [...path.slice(startIndex), ...path.slice(0, startIndex)] : path;
  
    const pathDetails = orderedPath.map((id, index) => {
      let displayText = `Node ${id}`;
      if (index < orderedPath.length - 1) {
        const nextId = orderedPath[index + 1];
        const distance = distances.find(d => d.id === id)?.distances[`Square ${nextId}`] || '0';
        displayText += ` → ${distance}px → `;
      }
      return displayText;
    }).join('');
  
    // Add the distance from the last square back to the first square (Square 1)
    const lastSquareId = orderedPath[orderedPath.length - 1];
    const firstSquareId = orderedPath[0];
    const distanceBackToFirst = distances.find(d => d.id === lastSquareId)?.distances[`Square ${firstSquareId}`] || '0';
    const completePath = pathDetails + (orderedPath.length > 1 ? ` → ${distanceBackToFirst}px → Node ${firstSquareId}` : '');
  
    return (
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#9c9c9c', padding: '10px', textAlign: 'center', zIndex: '1' }}>
        {completePath}
      </div>
    );
  };
  
  export default PathDisplay;
  