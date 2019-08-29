import React from 'react';
import { View, Text } from 'react-native';
import Colors from '../constants/Colors';
import Statuses from '../constants/Statuses';
import StatusEmojis from '../constants/StatusEmojis';

function getStatusEmoji(status) {
  if (status in StatusEmojis) {
    return StatusEmojis[status];
  }
  return getStatusEmoji(Statuses.Disabled);
}

export default class SpecResult extends React.Component {
  render() {
    const { status = Statuses.Running, description, failedExpectations } = this.props;

    const borderColor = Colors[status];

    const message = `${getStatusEmoji(status)} ${description} (${status})`;
    return (
      <View
        testID="test_suite_view_spec_container"
        style={{
          borderColor,
          paddingLeft: 10,
          marginVertical: 3,
          borderLeftWidth: 3,
        }}>
        <Text testID="test_suite_text_spec_description" style={{ fontSize: 16 }}>
          {message}
        </Text>
        {failedExpectations.map((e, i) => (
          <Text testID="test_suite_text_spec_exception" key={i}>
            {e.get('message')}
          </Text>
        ))}
      </View>
    );
  }
}
