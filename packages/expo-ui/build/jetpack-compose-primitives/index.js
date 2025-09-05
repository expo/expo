import { requireNativeView } from 'expo';
import { Platform } from 'react-native';
const BoxNativeView = Platform.OS === 'android' ? requireNativeView('ExpoUI', 'BoxView') : null;
export function Box(props) {
    if (!BoxNativeView) {
        return null;
    }
    return (<BoxNativeView {...props} 
    // @ts-ignore
    modifiers={props.modifiers?.map((m) => m.__expo_shared_object_id__)}/>);
}
const RowNativeView = Platform.OS === 'android' ? requireNativeView('ExpoUI', 'RowView') : null;
export function Row(props) {
    if (!RowNativeView) {
        return null;
    }
    return (<RowNativeView {...props} 
    // @ts-ignore
    modifiers={props.modifiers?.map((m) => m.__expo_shared_object_id__)}/>);
}
const ColumnNativeView = Platform.OS === 'android' ? requireNativeView('ExpoUI', 'ColumnView') : null;
export function Column(props) {
    if (!ColumnNativeView) {
        return null;
    }
    return (<ColumnNativeView {...props} 
    // @ts-ignore
    modifiers={props.modifiers?.map((m) => m.__expo_shared_object_id__)}/>);
}
const ContainerNativeView = Platform.OS === 'android' ? requireNativeView('ExpoUI', 'ContainerView') : null;
export function Container(props) {
    if (!ContainerNativeView) {
        return null;
    }
    return (<ContainerNativeView {...props} 
    // @ts-ignore
    modifiers={props.modifiers?.map((m) => m.__expo_shared_object_id__)}/>);
}
const TextNativeView = Platform.OS === 'android' ? requireNativeView('ExpoUI', 'TextView') : null;
function transformTextProps(props) {
    const { children, ...restProps } = props;
    return {
        ...restProps,
        text: children ?? '',
        // @ts-ignore
        modifiers: props.modifiers?.map((m) => m.__expo_shared_object_id__),
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