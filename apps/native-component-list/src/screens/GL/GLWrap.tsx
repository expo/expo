import * as GL from 'expo-gl';
import React from 'react';
import { View, LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';

import { Colors } from '../../constants';

export default <P extends { style?: StyleProp<ViewStyle> } = object>(
  title: string,
  onContextCreate: (gl: GL.ExpoWebGLRenderingContext) => Promise<{
    onLayout?: (event: LayoutChangeEvent) => void;
    onTick?: (gl: GL.ExpoWebGLRenderingContext) => void;
  } | void>
): React.ComponentType<P> & { title: string } =>
  class extends React.Component<P> {
    static title = title;

    _gl?: GL.ExpoWebGLRenderingContext;
    _rafID?: number;

    componentWillUnmount() {
      this._gl = undefined;
      if (this._rafID !== undefined) {
        cancelAnimationFrame(this._rafID);
      }
    }

    onLayout = (event: LayoutChangeEvent) => {};

    render() {
      return (
        <View
          onLayout={(event) => this.onLayout(event)}
          style={[
            {
              flex: 1,
              backgroundColor: Colors.tintColor,
            },
            this.props.style,
          ]}>
          <GL.GLView style={{ flex: 1 }} onContextCreate={this._onContextCreate} />
        </View>
      );
    }

    _onContextCreate = async (gl: GL.ExpoWebGLRenderingContext) => {
      this._gl = gl;
      const { onTick = () => {}, onLayout } = (await onContextCreate(this._gl)) || {};

      if (onLayout) this.onLayout = onLayout;

      const animate = () => {
        if (this._gl) {
          this._rafID = requestAnimationFrame(animate);
          onTick(this._gl);
        }
      };
      animate();
    };
  };
