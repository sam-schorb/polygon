// Path.js
// A component to render a path rectangle between two points
const Path = ({ startX, startY, endX, endY, color = 'grey', borderColor = 'black' }) => {
    const width = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
  
    const style = {
      position: 'absolute',
      left: `${startX}px`,
      top: `${startY}px`,
      width: `${width}px`,
      height: '2px',
      backgroundColor: color,
      border: `1px solid ${borderColor}`, 
      transform: `rotate(${angle}deg)`,
      transformOrigin: '0 0',
      zIndex: 1, // Low z-index

    };
  
    return <div style={style} />;
  };

export default Path
