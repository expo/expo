/*
 * Native web camera (Android) has a torch: boolean
 */
export function convertFlashModeJSONToNative(input) {
    switch (input) {
        case 'torch':
            return true;
        case 'on':
        case 'off':
        case 'auto':
        default:
            return false;
    }
}
export function convertAutoFocusJSONToNative(input) {
    switch (input) {
        case 'on':
        case 'auto':
            return 'continuous';
        case 'off':
            return 'manual';
        case 'singleShot':
            return 'single-shot';
        default:
            return input;
    }
}
//# sourceMappingURL=CapabilityUtils.js.map