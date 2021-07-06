import React from 'react';
import AnimatedValue from './core/AnimatedValue';

export default function useValue(initialValue) {
  const ref = React.useRef(null);
  if (ref.current === null) {
    ref.current = new AnimatedValue(initialValue);
  }
  return ref.current;
}
