import regular from './android/weights/regular';
export function getFont(weight) {
    const platformWeight = typeof weight === 'object' ? weight.android : null;
    if (!platformWeight)
        return regular;
    return platformWeight;
}
//# sourceMappingURL=utils.js.map