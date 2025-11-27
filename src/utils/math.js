// Function to calculate the 'centre of mass' of the points
export const calculateCentreOfMass = (points) => {
    let x = 0, y = 0, len = points.length;
    for (let i = 0; i < len; i++) {
      x += points[i].x;
      y += points[i].y;
    }
    return { x: x / len, y: y / len };
  };
  
  // Function to convert points to squared polar coordinates
  export const squaredPolar = (point, centre) => {
    return [
      Math.atan2(point.y - centre.y, point.x - centre.x),
      (point.x - centre.x) ** 2 + (point.y - centre.y) ** 2
    ];
  };
  
export const calculateDistance = (position1, position2) => {
    const dx = position1.x - position2.x;
    const dy = position1.y - position2.y;
    return Math.sqrt(dx * dx + dy * dy).toFixed(2); // Returns the distance in pixels
  };

      // Function to calculate square angles based on current positions and visited order
      export const calculateAngles = ( visitedOrder, squares, setSquareAngles ) => {
        const newAngles = {};
        visitedOrder.forEach((id, index) => {
          const currentSquare = squares.find(sq => sq.id === id);
          const nextSquare = squares.find(sq => sq.id === visitedOrder[(index + 1) % visitedOrder.length]);
          if (currentSquare && nextSquare) {
            const dx = nextSquare.position.x - currentSquare.position.x;
            const dy = nextSquare.position.y - currentSquare.position.y;
            newAngles[id] = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
          }
        });
        setSquareAngles(newAngles);
      };
