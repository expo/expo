import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { loadAsync } from 'expo-font';
import { useState, useEffect, useMemo } from 'react';
import { Platform, PlatformColor, Text, View } from 'react-native';
import { androidSymbolToString } from './android';
import { getFont } from './utils';
// trying to mirror iOS implementation
const DEFAULT_SYMBOL_COLOR = Platform.OS === 'android' ? PlatformColor('@android:color/system_primary_dark') : '#7d9bd4';
export function SymbolView(props) {
    const font = useMemo(() => getFont(props.weight), [props.weight]);
    const name = typeof props.name === 'object'
        ? props.name[Platform.OS === 'android' ? 'android' : 'web']
        : null;
    const [loaded, setLoaded] = useState(false);
    useEffect(() => {
        loadAsync({
            [font.name]: {
                uri: font.font,
                testString: name ? androidSymbolToString(name) : undefined,
            },
        })
            .then(() => setLoaded(true))
            .catch(() => {
            /* noop */
        });
    }, []);
    if (!name) {
        return _jsx(_Fragment, { children: props.fallback });
    }
    if (!loaded) {
        return _jsx(View, { style: { width: props.size ?? 24, height: props.size ?? 24 } });
    }
    return (_jsx(View, { style: { width: props.size ?? 24, height: props.size ?? 24 }, children: _jsx(Text, { style: {
                fontFamily: font.name,
                color: props.tintColor ?? DEFAULT_SYMBOL_COLOR,
                fontSize: props.size ?? 24,
                lineHeight: props.size ?? 24,
            }, children: androidSymbolToString(name) }) }));
}
//# sourceMappingURL=SymbolView.js.map