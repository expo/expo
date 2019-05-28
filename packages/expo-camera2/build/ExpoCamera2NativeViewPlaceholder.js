import * as React from 'react';
import { View, StyleSheet } from 'react-native';
export default class ExpoCamera2NativeViewPlaceholder extends React.Component {
    render() {
        return (<View {...this.props} style={[this.props.style, styles.placeholder]}/>);
    }
}
const styles = StyleSheet.create({
    placeholder: {
        backgroundColor: 'rgba(70, 70, 60, 0.8)',
    },
});
//# sourceMappingURL=ExpoCamera2NativeViewPlaceholder.js.map