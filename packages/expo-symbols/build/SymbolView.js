import { useFonts } from '@expo-google-fonts/material-symbols';
import { useMemo } from 'react';
import { Platform, PlatformColor, Text } from 'react-native';
import { androidSymbolToString } from './android';
import regular from './android/weights/regular';
// trying to mirror iOS implementation
const DEFAULT_SYMBOL_COLOR = Platform.OS === 'android' ? PlatformColor('@android:color/system_primary_dark') : '#7d9bd4';
function getFont(weight) {
    const platformWeight = typeof weight === 'object' ? weight.android : null;
    if (!platformWeight)
        return regular;
    return platformWeight;
}
export function SymbolView(props) {
    const font = useMemo(() => getFont(props.weight), [props.weight]);
    useFonts({ [font.name]: font.font });
    const name = typeof props.name === 'object'
        ? props.name[Platform.OS === 'android' ? 'android' : 'web']
        : null;
    if (!name) {
        return <>{props.fallback}</>;
    }
    return (<Text style={{
            fontFamily: font.name,
            color: props.tintColor ?? DEFAULT_SYMBOL_COLOR,
            fontSize: props.size ?? 24,
        }}>
      {androidSymbolToString(name)}
    </Text>);
}
//# sourceMappingURL=SymbolView.js.map