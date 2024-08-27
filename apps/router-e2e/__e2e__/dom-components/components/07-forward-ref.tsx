'use dom';

import { useDomImperativeHandle, type DOMImperativeFactory, type DOMProps } from 'expo/dom';
import { useRef, useState } from 'react';

export interface ForwardedImperativeRef extends DOMImperativeFactory {
  toggleWidth: () => void;
  updateText: (value: string) => void;
}

export default function Page(_: React.RefAttributes<ForwardedImperativeRef> & { dom?: DOMProps }) {
  const [text, setText] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useDomImperativeHandle<ForwardedImperativeRef>(
    () => ({
      toggleWidth: () => {
        ref.current?.style.setProperty(
          'width',
          ref.current?.style.width === '100px' ? '200px' : '100px'
        );
      },
      updateText: (value: string) => {
        setText(value);
      },
    }),
    []
  );

  return (
    <div style={{ width: 100, height: 50, backgroundColor: '#add8e6' }} ref={ref}>
      {text}
    </div>
  );
}
