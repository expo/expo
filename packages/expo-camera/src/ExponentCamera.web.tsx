import React, { CSSProperties } from 'react';
import { StyleSheet } from 'react-native';

import { NativePropsType } from './Camera.types';
import CameraManager from './ExponentCameraManager.web';

/*
 * TODO: Bacon
 * onCameraReady?: Function;
 * onMountError?: ({ nativeEvent }: { nativeEvent: MountError }) => void;
 *
 */
export default class ExponentCamera extends React.Component<NativePropsType> {
  render() {
    const transform = this.props.type === CameraManager.Type.back ? 'rotateY(180deg)' : 'none';
    const reactStyle = StyleSheet.flatten(this.props.style);
    const style: CSSProperties = {
      ...reactStyle,
      objectFit: 'cover',
      transform,
    };

    return <video style={style} autoPlay playsInline />;
  }
}
