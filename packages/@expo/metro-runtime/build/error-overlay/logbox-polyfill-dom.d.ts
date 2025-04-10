import React from 'react';
export default function LogBoxPolyfillDOM({ onDismiss, onMinimize, onChangeSelectedIndex, selectedIndex, platform, fetchJsonAsync, ...props }: {
    fetchJsonAsync: (input: RequestInfo, init?: RequestInit) => Promise<any>;
    platform: string;
    onDismiss: () => void;
    onMinimize: () => void;
    onChangeSelectedIndex: (index: number) => void;
    logs: any[];
    selectedIndex: number;
    dom?: import('expo/dom').DOMProps;
}): React.JSX.Element;
//# sourceMappingURL=logbox-polyfill-dom.d.ts.map