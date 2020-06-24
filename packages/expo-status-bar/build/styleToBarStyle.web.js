export default function styleToBarStyle(style = 'auto', colorScheme) {
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
//# sourceMappingURL=styleToBarStyle.web.js.map