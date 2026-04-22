import { StyleSheet } from 'react-native';
import { Text } from './Text';
export function MissingIcon({ color, size, style }) {
    return <Text style={[styles.icon, { color, fontSize: size }, style]}>⏷</Text>;
}
const styles = StyleSheet.create({
    icon: {
        backgroundColor: 'transparent',
    },
});
//# sourceMappingURL=MissingIcon.js.map