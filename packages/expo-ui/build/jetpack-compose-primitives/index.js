import { requireNativeView } from 'expo';
import { Platform } from 'react-native';
const RowNativeView = Platform.OS === 'android' ? requireNativeView('ExpoUI', 'RowView') : null;
export function Row(props) {
    if (!RowNativeView) {
        return null;
    }
    return <RowNativeView {...props}/>;
}
const ColumnNativeView = Platform.OS === 'android' ? requireNativeView('ExpoUI', 'ColumnView') : null;
export function Column(props) {
    if (!ColumnNativeView) {
        return null;
    }
    return <ColumnNativeView {...props}/>;
}
const ContainerNativeView = Platform.OS === 'android' ? requireNativeView('ExpoUI', 'ContainerView') : null;
export function Container(props) {
    if (!ContainerNativeView) {
        return null;
    }
    return <ContainerNativeView {...props}/>;
}
const TextNativeView = Platform.OS === 'android' ? requireNativeView('ExpoUI', 'TextView') : null;
function transformTextProps(props) {
    const { children, ...restProps } = props;
    return {
        ...restProps,
        text: children ?? '',
    };
}
export function Text(props) {
    if (!TextNativeView) {
        return null;
    }
    return <TextNativeView {...transformTextProps(props)}/>;
}
//#endregion
//# sourceMappingURL=index.js.map