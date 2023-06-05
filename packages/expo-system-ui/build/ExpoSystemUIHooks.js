import { EventEmitter } from 'expo-modules-core';
import React from 'react';
import ExpoSystemUI from './ExpoSystemUI';
const emitter = new EventEmitter(ExpoSystemUI);
/**
 * Returns the current user interface appearance. The value is updated when the locked appearance is changed.
 *
 * @example
 * ```ts
 * const interfaceStyle = useInterfaceStyle();
 * ```
 * @returns The current user interface appearance.
 */
export function useInterfaceStyle() {
    const [interfaceStyle, setInterfaceStyle] = React.useState('auto');
    React.useEffect(() => {
        async function getCurrentTheme() {
            const theme = await ExpoSystemUI.getInterfaceStyleAsync();
            setInterfaceStyle(theme);
        }
        getCurrentTheme();
    }, []);
    React.useEffect(() => {
        const subscription = emitter.addListener('onInterfaceStyleChanged', (event) => {
            setInterfaceStyle(event.theme);
        });
        return () => subscription.remove();
    }, []);
    return interfaceStyle;
}
//# sourceMappingURL=ExpoSystemUIHooks.js.map