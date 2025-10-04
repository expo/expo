import React from 'react';
export default function LogBoxPolyfillDOM({ onMinimize, onCopyText, platform, fetchJsonAsync, reloadRuntime, devServerUrl, ...props }: {
    onCopyText?: (text: string) => void;
    fetchJsonAsync?: (input: string, init?: {
        method?: string;
        body?: string;
    }) => Promise<any>;
    reloadRuntime?: () => void;
    platform?: string;
    devServerUrl?: string;
    onDismiss?: (index: number) => void;
    onMinimize?: () => void;
    onChangeSelectedIndex?: (index: number) => void;
    logs?: any[];
    nativeLogs?: any[];
    selectedIndex?: number;
    dom?: import('expo/dom/internal').DOMPropsInternal;
}): React.JSX.Element;
