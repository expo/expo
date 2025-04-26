import React from 'react';
export default function LogBoxPolyfillDOM({ onDismiss, onMinimize, onChangeSelectedIndex, onCopyText, selectedIndex, platform, fetchJsonAsync, ...props }: {
    onCopyText: (text: string) => void;
    fetchJsonAsync: (input: RequestInfo, init?: RequestInit) => Promise<any>;
    platform: string | undefined;
    onDismiss: (index: number) => void;
    onMinimize: () => void;
    onChangeSelectedIndex: (index: number) => void;
    logs: any[];
    selectedIndex: number;
    dom?: import('expo/dom').DOMProps;
}): React.JSX.Element;
//# sourceMappingURL=logbox-polyfill-dom.d.ts.map