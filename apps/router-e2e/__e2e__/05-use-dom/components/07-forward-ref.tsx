'use dom';

import { useDOMImperativeHandle, type DOMImperativeFactory, type DOMProps } from 'expo/dom';
import { useRef, useState } from 'react';

export interface ForwardedImperativeRef extends DOMImperativeFactory {
  toggleWidth: () => void;
  updateText: (value: string) => void;
}

export default function Page({ ref }: { dom?: DOMProps; ref: React.Ref<ForwardedImperativeRef> }) {
  const [text, setText] = useState('');
  const divRef = useRef<HTMLDivElement>(null);

  useDOMImperativeHandle<ForwardedImperativeRef>(
    ref,
    () => ({
      toggleWidth: () => {
        divRef.current?.style.setProperty(
          'width',
          divRef.current?.style.width === '100px' ? '200px' : '100px'
        );
      },
      updateText: (value: string) => {
        setText(value);
      },
    }),
    []
  );

  return (
    <div id="rect" style={{ width: 100, height: 50, backgroundColor: '#add8e6' }} ref={divRef}>
      {text}
    </div>
  );
}
