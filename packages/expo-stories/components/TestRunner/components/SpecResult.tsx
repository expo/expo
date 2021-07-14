import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Colors from '../constants/Colors';
import StatusEmojis from '../constants/StatusEmojis';
import Statuses from '../constants/Statuses';

function getStatusEmoji(status) {
  if (status in StatusEmojis) {
    return StatusEmojis[status];
  }
  return getStatusEmoji(Statuses.Disabled);
}

export default function SpecResult({ status = Statuses.Running, description, failedExpectations }) {
  const renderExpectations = React.useMemo(
    () => (e, i) => (
      <Text testID="test_suite_text_spec_exception" key={i}>
        {e.get('message')}
      </Text>
    ),
    []
  );

  const borderColor = Colors[status];

  const message = `${getStatusEmoji(status)} ${description} (${status})`;
  return (
    <View
      testID="test_suite_view_spec_container"
      style={[
        styles.container,
        {
          borderColor,
        },
      ]}>
      <Text testID="test_suite_text_spec_description" style={styles.text}>
        {message}
      </Text>
      {failedExpectations.map(renderExpectations)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingLeft: 10,
    marginVertical: 3,
    borderLeftWidth: 3,
  },
  text: {
    fontSize: 16,
  },
});
