import React from 'react';
import { Text, View } from 'react-native';

import Colors from '../constants/Colors';
import StatusEmojis from '../constants/StatusEmojis';
import Statuses from '../constants/Statuses';

function getStatusEmoji(status) {
  if (status in StatusEmojis) {
    return StatusEmojis[status];
  }
  return getStatusEmoji(Statuses.Disabled);
}

export default function SpecResult(props) {
  const { status = Statuses.Running, description, failedExpectations } = props;

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
