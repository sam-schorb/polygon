const DistanceDisplay = ({ distances, style }) => {
  return (
    <div style={{ ...style, position: 'absolute', top: 0, left: 0, width: '250px', overflowY: 'auto', maxHeight: '90%' }}>
      {distances.map(distanceInfo => (
        <div key={distanceInfo.id}>
          <strong>Node {distanceInfo.id}</strong>
          <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
            {Object.entries(distanceInfo.distances).map(([key, value]) => {
              const formattedKey = key.replace("Square", "Node");
              return (
                <li key={key} style={{ marginLeft: '20px', textIndent: '-20px' }}>
                  <span style={{ marginRight: '10px' }}>&rarr;</span>
                  {formattedKey}: {value} px
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default DistanceDisplay;
