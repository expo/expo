'use dom';

import React from 'react';

export default function DomButtonWithConsoleError({ title }: { title: string, dom?: import('expo/dom').DOMProps }) {
  return (
    <span
      style={{ fontSize: 24, backgroundColor: 'darkcyan', color: 'white', padding: 16, flex: 1, }}
      onClick={() => {
        console.error('DOM Button clicked');
      }}>
      {title}
    </span>
  );
}
