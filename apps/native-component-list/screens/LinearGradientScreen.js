import React from 'react';
import { Button, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo';

function incrementColor(color, step) {
  const intColor = parseInt(color.substr(1), 16);
  const newIntColor = (intColor + step).toString(16);
  return `#${'0'.repeat(6 - newIntColor.length)}${newIntColor}`;
}

export default class LinearGradientScreen extends React.Component {
  static navigationOptions = {
    title: 'LinearGradient',
  };
  
  state = {
    count: 0,
    colorTop: '#000000',
    colorBottom: '#cccccc',
  };

  componentDidMount() {
    this._interval = setInterval(() => {
      this.setState({
        count: this.state.count + 1,
        colorTop: incrementColor(this.state.colorTop, 1),
        colorBottom: incrementColor(this.state.colorBottom, -1),
      });
    }, 100);
  }

  componentWillUnmount() {
    clearInterval(this._interval);
  }

  render() {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 10,
        }}>
        <LinearGradient
          colors={[this.state.colorTop, this.state.colorBottom]}
          style={{ width: 200, height: 200 }}
        />
        <Text style={{ color: this.state.colorTop }}>{this.state.colorTop}</Text>
        <Text style={{ color: this.state.colorBottom }}>{this.state.colorBottom}</Text>
      </View>
    );
  }
}
