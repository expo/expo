import React, { useState, useEffect, useRef } from 'react';

export const Tooltip = ({ children, visible }) => {
  const marginX = 10;
  const marginY = 30;
  const nodeRef = useRef(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  useEffect(() => {
    const handleMouseMove = (event) => {
      const mouseCoords = {
        x: event.pageX,
        y: event.pageY,
      };

      if (visible) {
        updatePosition(mouseCoords);
      }
    };

    document.addEventListener('mousemove', handleMouseMove, true);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove, true);
    };
  }, [visible]);

  const updatePosition = (mouseCoords) => {
    let pos = {
      left: mouseCoords.x + marginX,
      top: mouseCoords.y + marginY,
    };

    const boundingRect = nodeRef.current.getBoundingClientRect();

    if (pos.left + boundingRect.width > window.innerWidth) {
      pos.left = window.innerWidth - boundingRect.width;
    }

    if (pos.top + boundingRect.height > window.innerHeight) {
      pos.top = mouseCoords.y - marginY - boundingRect.height;
    }

    setPosition(pos);
  };

  return (
    <div
      ref={nodeRef}
      className={`font-main absolute p-2.5 rounded bg-black border border-gray-400 
                    transition-opacity ease-out duration-200
                    ${visible ? 'opacity-90 visible' : 'opacity-0 invisible'}`}
      style={{ left: position.left, top: position.top }}>
      {children}
    </div>
  );
};
