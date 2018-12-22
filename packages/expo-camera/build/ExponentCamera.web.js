import React from 'react';
import { StyleSheet } from 'react-native';
import CameraManager from './ExponentCameraManager.web';
/*
 * TODO: Bacon
 * onCameraReady?: Function;
 * onMountError?: ({ nativeEvent }: { nativeEvent: MountError }) => void;
 *
 */
export default class ExponentCamera extends React.Component {
    render() {
        const transform = this.props.type === CameraManager.Type.back ? 'rotateY(180deg)' : 'none';
        const reactStyle = StyleSheet.flatten(this.props.style);
        const style = {
            ...reactStyle,
            objectFit: 'cover',
            transform,
        };
        return <video style={style} autoPlay playsInline/>;
    }
}
//# sourceMappingURL=ExponentCamera.web.js.map