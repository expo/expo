import Expo from 'expo';
import React from 'react';
import { View } from 'react-native';

import { Colors } from '../../constants';

export default (title, onContextCreate) =>
  class extends React.Component {
    static title = title;

    componentWillUnmount() {
      this._gl = null;
      cancelAnimationFrame(this._rafID);
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
          ]}>
          <Expo.GLView style={{ flex: 1 }} onContextCreate={this._onContextCreate} />
        </View>
      );
    }

    _onContextCreate = async gl => {
      this._gl = gl;
      const { result: { onTick = () => {} } = {} } = {
        result: await onContextCreate(this._gl),
      };

      const animate = () => {
        if (this._gl) {
          this._rafID = requestAnimationFrame(animate);
          onTick(this._gl);
        }
      };
      animate();
    };
  };
