export const colorMap = {
  'red': 1,
  'green': 2,
  'pink': 3,
  'purple': 4,
  'orange': 5,
  'blue': 6
};


export const getRandomColor = () => {
  const colors = Object.keys(colorMap);
  return colors[Math.floor(Math.random() * colors.length)];
};

  
  export const normalizeRotation = (rotation) => {
    return ((rotation % 360) + 360) % 360;
  };
  

  // utils/utils.js
export const getNextColor = (currentColor) => {
  const colors = ['red', 'green', 'pink', 'purple', 'orange', 'blue'];
  const currentIndex = colors.indexOf(currentColor);
  const nextIndex = (currentIndex + 1) % colors.length;
  return colors[nextIndex];
};