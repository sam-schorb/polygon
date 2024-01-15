    // A component to render a path rectangle between two points
    const Path = ({ startX, startY, endX, endY }) => {
        const width = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
      
        const style = {
          position: 'absolute',
          left: `${startX}px`,
          top: `${startY}px`,
          width: `${width}px`,
          height: '2px', // Set the height to 3px
          backgroundColor: 'grey',
          border: '1px solid black', // Add a 1px black border
          transform: `rotate(${angle}deg)`,
          transformOrigin: '0 0',
          zIndex: 1, // Low z-index
  
        };
      
        return <div style={style} />;
      };

      export default Path