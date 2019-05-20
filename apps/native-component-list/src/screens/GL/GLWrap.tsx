import React from 'react';
import * as GL from 'expo-gl';
import { View, StyleProp, ViewStyle } from 'react-native';

import { Colors } from '../../constants';

export default <P extends { style?: StyleProp<ViewStyle> } = {}>(
  title: string,
  onContextCreate:
    (gl: GL.ExpoWebGLRenderingContext) => Promise<{ onTick?: (gl: GL.ExpoWebGLRenderingContext) => void } | void>
): React.ComponentType<P> & { title: string } =>
  (class extends React.Component<P> {
    static title = title;

    _gl?: GL.ExpoWebGLRenderingContext;
    _rafID?: number;

    componentWillUnmount() {
      this._gl = undefined;
      if (this._rafID !== undefined) {
        cancelAnimationFrame(this._rafID);
      }
    }

    render() {
      return (
        <View
          style={[
            {
              flex: 1,
              backgroundColor: Colors.tintColor,
            },
            this.props.style,
          ]}
        >
          <GL.GLView style={{ flex: 1 }} onContextCreate={this._onContextCreate} />
        </View>
      );
    }

    _onContextCreate = async (gl: GL.ExpoWebGLRenderingContext) => {
      this._gl = gl;
      const { onTick = () => {} } = await onContextCreate(this._gl) || {};

      const animate = () => {
        if (this._gl) {
          this._rafID = requestAnimationFrame(animate);
          onTick(this._gl);
        }
      };
      animate();
    }
  });
