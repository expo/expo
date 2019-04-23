export default function getBackgroundColor(intensity, tint) {
    const opacity = intensity / 100;
    switch (tint) {
        case 'dark':
            return `rgba(0,0,0,${opacity * 0.5})`;
        case 'light':
            return `rgba(255,255,255,${opacity * 0.7})`;
        case 'default':
            return `rgba(255,255,255,${opacity * 0.4})`;
    }
    throw new Error(`Unsupported tint provided: ${tint}`);
}
//# sourceMappingURL=getBackgroundColor.js.map