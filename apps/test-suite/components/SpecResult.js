import React from 'react';
import { View, Text } from 'react-native';

export default class SpecResult extends React.Component {
  render() {
    const { status = 'running', description, failedExpectations } = this.props;

    return (
      <View
        style={{
          paddingLeft: 10,
          marginVertical: 3,
          borderColor: {
            running: '#ff0',
            passed: '#0f0',
            failed: '#f00',
            disabled: '#888',
          }[status],
          borderLeftWidth: 3,
        }}>
        <Text style={{ fontSize: 16 }}>
          {
            {
              running: '😮 ',
              passed: '😄 ',
              failed: '😞 ',
            }[status]
          }
          {description} ({status})
        </Text>
        {failedExpectations.map((e, i) => (
          <Text key={i}>{e.get('message')}</Text>
        ))}
      </View>
    );
  }
}
