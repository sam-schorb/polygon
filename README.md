# Polygon - Spatial Computing Drum Machine

## Overview

Polygon is a web-based drum machine that uses spatial computing to generate drum patterns. It provides an intuitive and visually engaging way to create rhythms based on the spatial arrangement of nodes on the screen. Each node corresponds to a distinct sound, and their placement, rotation, and distance from each other dynamically influence the audio output. Polygon is hosted at [Polygon Drum Machine](https://polygon.iimaginary.com/).

## Features

- **Interactive Node Placement**: Click to add nodes which represent different drum sounds in the sequence.
- **Spatial Sound Control**: Drag nodes to reposition and right-click to cycle through sounds. Rotate to adjust sound characteristics.
- **Visual and Sonic Patterns**: The arrangement of nodes creates visual patterns that map to the rhythm and texture of the drum sequence.
- **Dynamic Sequence Timing**: Control the timing gaps in the sequence by adjusting the distance between nodes.
- **Node Manipulation**: Select and delete nodes as needed to refine your drum pattern.

## Getting Started

To get started with Polygon, simply visit the website and begin by adding nodes. No installation or additional setup is required.

### Controls

- **Add Node**: Places a new node on the screen.
- **Drag Node**: Repositions the node which alters the sound dynamically.
- **Right-Click Node**: Cycles through available sound types for the selected node.
- **Rotate Node**: Changes the node's sound characteristics.
- **Delete Node**: Select a node and press the backspace key to remove it.

## Development

Polygon is built with web technologies and leverages the RNBO framework for audio processing. Users with an interest in audio software development are encouraged to contribute and utilize the codebase for creating new instruments or projects.

### Prerequisites

- A web browser with support for the Web Audio API.
- Familiarity with JavaScript for development and customization purposes.

### Customization

Polygon is designed with modularity in mind, facilitating easy customization and extension:

- Add new sound samples or synthesis methods to expand the sonic palette.
- Modify the visual representation of nodes and sequences for a personalized experience.
- Integrate with MIDI devices or other web-based music tools for extended functionality.

## Contributing

Contributions to the Polygon project are welcome. Whether it's a new feature, bug fix, or an improvement in the code or documentation, feel free to fork the repository and submit your pull requests.

## License

Polygon is an open-source project licensed under the [MIT License](LICENSE.md).

## Acknowledgements

- The RNBO team at Cycling '74 for providing the audio engine that powers Polygon.
- The [Future of Coding](https://futureofcoding.org/) community and Alex McClean for the inspiration.
