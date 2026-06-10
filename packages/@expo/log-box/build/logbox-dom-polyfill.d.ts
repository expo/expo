import React from 'react';
import type { FetchTextAsync } from './fetchHelper';
type LogBoxDOMProps = Record<string, unknown>;
export default function LogBoxPolyfillDOM({ onCopyText, onMinimize, fetchTextAsync, onReload, ...props }: {
    devServerUrl: string | undefined;
    fetchTextAsync: FetchTextAsync | undefined;
    onMinimize: (() => void) | undefined;
    onReload: (() => void) | undefined;
    onCopyText: ((text: string) => void) | undefined;
    onDismiss: ((index: number) => void) | undefined;
    onChangeSelectedIndex: ((index: number) => void) | undefined;
    /**
     * LobBoxLogs from the JS Runtime
     */
    logs?: any[];
    /**
     * Logs from the native runtime (both native and JS, both iOS and Android, e.g. redbox errors)
     */
    nativeLogs?: any[];
    selectedIndex?: number;
    dom?: LogBoxDOMProps;
}): React.JSX.Element;
export {};
