import React from 'react';
export default function LogBoxPolyfillDOM({ onDismiss, onMinimize, onChangeSelectedIndex, logs, selectedIndex, }: {
    onDismiss: () => void;
    onMinimize: () => void;
    onChangeSelectedIndex: (index: number) => void;
    logs: any[];
    selectedIndex: number;
    dom?: import('expo/dom').DOMProps;
}): React.JSX.Element;
//# sourceMappingURL=logbox-polyfill-dom.d.ts.map