'use client';
import { Text as NativeText } from 'react-native';
import { useTheme } from '../native';
// eslint-disable-next-line no-restricted-imports
export function Text({ style, ...rest }) {
    const { colors, fonts } = useTheme();
    return <NativeText {...rest} style={[{ color: colors.text }, fonts.regular, style]}/>;
}
//# sourceMappingURL=Text.js.map