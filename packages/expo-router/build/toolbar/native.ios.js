import { requireNativeView } from 'expo';
const RouterToolbarHostView = requireNativeView('ExpoRouterToolbarModule', 'RouterToolbarHostView');
export function RouterToolbarHost(props) {
    return (<RouterToolbarHostView {...props} style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1,
            height: 1,
            backgroundColor: 'transparent',
        }}/>);
}
const RouterToolbarItemView = requireNativeView('ExpoRouterToolbarModule', 'RouterToolbarItemView');
export function RouterToolbarItem(props) {
    // Needed to pass shared object ID to native side
    const imageObjectId = props.image?.__expo_shared_object_id__;
    return <RouterToolbarItemView {...props} image={imageObjectId}/>;
}
//# sourceMappingURL=native.ios.js.map