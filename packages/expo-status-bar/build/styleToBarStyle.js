import { Appearance } from 'react-native';
function getColorScheme() {
    if (Appearance) {
        return Appearance.getColorScheme();
    }
    else {
        return 'light';
    }
}
export default function styleToBarStyle(style = 'auto', colorScheme = getColorScheme()) {
    if (!colorScheme) {
        colorScheme = 'light';
    }
    let resolvedStyle = style;
    if (style === 'auto') {
        resolvedStyle = colorScheme === 'light' ? 'dark' : 'light';
    }
    else if (style === 'inverted') {
        resolvedStyle = colorScheme === 'light' ? 'light' : 'dark';
    }
    return resolvedStyle === 'light' ? 'light-content' : 'dark-content';
}
//# sourceMappingURL=styleToBarStyle.js.map