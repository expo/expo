"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMaterialIconSource = useMaterialIconSource;
const expo_symbols_1 = require("expo-symbols");
const react_1 = require("react");
/**
 * Resolves an Android Material Design icon name to an `ImageSourcePropType`.
 * Returns `undefined` while the icon is loading or if `name` is `undefined`.
 *
 * @platform android
 */
function useMaterialIconSource(name) {
    const [source, setSource] = (0, react_1.useState)(undefined);
    (0, react_1.useEffect)(() => {
        if (!name) {
            setSource(undefined);
            return;
        }
        setSource(undefined);
        let cancelled = false;
        (0, expo_symbols_1.unstable_getMaterialSymbolSourceAsync)(name, 24, 'white')
            .then((result) => {
            if (!cancelled && result) {
                setSource(result);
            }
        })
            .catch(() => {
            console.warn(`[expo-router] Failed to load Material icon "${name}".`);
        });
        return () => {
            cancelled = true;
        };
    }, [name]);
    return source;
}
//# sourceMappingURL=materialIcon.android.js.map