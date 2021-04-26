import { processColor } from 'react-native';
export default function processTheme(theme = {}) {
    return Object.keys(theme).reduce((result, key) => {
        const value = theme[key];
        if (key.toLowerCase().endsWith('color')) {
            result[key] = processColor(value);
            return result;
        }
        result[key] = value;
        return result;
    }, {});
}
//# sourceMappingURL=processTheme.js.map