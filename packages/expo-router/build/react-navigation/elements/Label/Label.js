import { StyleSheet, } from 'react-native';
import { Text } from '../Text';
export function Label({ tintColor, style, ...rest }) {
    return (<Text numberOfLines={1} {...rest} style={[styles.label, tintColor != null && { color: tintColor }, style]}/>);
}
const styles = StyleSheet.create({
    label: {
        textAlign: 'center',
        backgroundColor: 'transparent',
    },
});
//# sourceMappingURL=Label.js.map