import { useEffect, useState } from 'react';
import interact from 'interactjs';

const useInteract = (ref, rotateHandleRef, position, rotation, onDrag, onRotate) => {
  const [startRotation, setStartRotation] = useState({ x: 0, y: 0, angle: rotation });

  useEffect(() => {
    if (ref.current && rotateHandleRef.current) {
      interact(ref.current).draggable({
        inertia: true,
        modifiers: [
          interact.modifiers.restrictRect({
            restriction: 'parent',
            endOnly: true
          })
        ],
        autoScroll: true,
        listeners: {
          move: (event) => {
            const newPos = {
              x: position.x + event.dx,
              y: position.y + event.dy
            };
            onDrag(newPos);
          }
        }
      });

      interact(rotateHandleRef.current).draggable({
        onstart: (event) => {
          const rect = ref.current.getBoundingClientRect();
          const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
          const mouseAngle = Math.atan2(event.clientY - center.y, event.clientX - center.x) * (180 / Math.PI);
          setStartRotation({ ...startRotation, angle: rotation - mouseAngle });
        },
        onmove: (event) => {
          const center = {
            x: ref.current.offsetLeft + ref.current.offsetWidth / 2,
            y: ref.current.offsetTop + ref.current.offsetHeight / 2
          };
          const currentAngle = Math.atan2(event.clientY - center.y, event.clientX - center.x) * (180 / Math.PI);
          onRotate(startRotation.angle + currentAngle);
        }
      });
    }
  }, [ref, rotateHandleRef, position, rotation, onDrag, onRotate, startRotation]);
  

  return startRotation;
};

export default useInteract;
