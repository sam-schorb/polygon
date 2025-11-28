// DistanceDisplay.js
// Display the distances of each node from each other
const DistanceDisplay = ({ distances = [], sections, style, bottomOffset = 0 }) => {
  const renderDistances = (distanceList, labelSuffix) =>
    distanceList.map(distanceInfo => (
      <div key={`${labelSuffix || 'layer'}-${distanceInfo.id}`} style={{ marginBottom: '8px' }}>
        <strong>
          Node {distanceInfo.id}
          {labelSuffix ? ` - ${labelSuffix}` : ''}
        </strong>
        <ul style={{ listStyleType: 'none', paddingLeft: 0, margin: '4px 0 0 0' }}>
          {Object.entries(distanceInfo.distances).map(([key, value]) => {
            const formattedKey = key.replace('Square', 'Node');
            return (
              <li key={key} style={{ marginLeft: '20px', textIndent: '-20px' }}>
                <span style={{ marginRight: '10px' }}>&rarr;</span>
                {formattedKey}: {value} px
              </li>
            );
          })}
        </ul>
      </div>
    ));

  const hasSections = Array.isArray(sections) && sections.length > 0;
  const content = hasSections
    ? sections.flatMap((section, idx) =>
        renderDistances(section.distances || [], section.label || `Layer ${idx + 1}`)
      )
    : renderDistances(distances, null);

  return (
    <div
      style={{
        ...style,
        position: 'absolute',
        top: '70px',
        left: 0,
        width: '250px',
        overflowY: 'auto',
        maxHeight: `calc(100vh - 70px - ${bottomOffset}px)`,
        paddingRight: '8px',
        boxSizing: 'border-box',
      }}
    >
      {content}
    </div>
  );
};

export default DistanceDisplay;
