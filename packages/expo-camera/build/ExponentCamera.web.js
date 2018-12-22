import React from 'react';
import { StyleSheet, findNodeHandle, View } from 'react-native';
import CameraManager from './ExponentCameraManager.web';
/*
 * TODO: Bacon
 * onCameraReady?: Function;
 * onMountError?: ({ nativeEvent }: { nativeEvent: MountError }) => void;
 *
 * Handle when type: CameraManager.Type.back and back isn't available
 */
export default class ExponentCamera extends React.Component {
    constructor() {
        super(...arguments);
        this._setRef = ref => {
            this.video = findNodeHandle(ref);
        };
    }
    render() {
        const transform = this.props.type === CameraManager.Type.front ? 'rotateY(180deg)' : 'none';
        const reactStyle = StyleSheet.flatten(this.props.style);
        const style = {
            ...StyleSheet.absoluteFillObject,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform,
        };
        return (<View style={{ flex: 1, alignItems: 'stretch', ...reactStyle }}>
        <video ref={this._setRef} style={style} autoPlay playsInline/>
        {this.props.children}
      </View>);
    }
}
//# sourceMappingURL=ExponentCamera.web.js.map