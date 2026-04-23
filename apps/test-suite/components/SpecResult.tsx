import { StyleSheet, Text, View } from 'react-native';

import StatusIndicator from './StatusIndicator';
import { useTheme } from '../../common/ThemeProvider';
import Statuses, { type Status } from '../constants/Statuses';

type SpecResultProps = {
  status?: Status;
  description: string;
  failedExpectations?: { message: string }[];
};

export default function SpecResult({
  status = Statuses.Running,
  description,
  failedExpectations,
}: SpecResultProps) {
  const { theme } = useTheme();
  const isSkipped =
    status === Statuses.Disabled || status === Statuses.Pending || status === Statuses.Excluded;

  return (
    <View testID="test_suite_view_spec_container" style={styles.container}>
      <View style={styles.row}>
        <StatusIndicator status={status} />
        <Text
          testID="test_suite_text_spec_description"
          style={[
            styles.description,
            { color: isSkipped ? theme.text.tertiary : theme.text.default },
            isSkipped && styles.strikethrough,
          ]}>
          {description}
        </Text>
      </View>
      {failedExpectations?.map((e, i) => (
        <Text
          testID="test_suite_text_spec_exception"
          key={i}
          style={[styles.expectation, { color: theme.text.danger }]}>
          {e.message}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    paddingLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  description: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  expectation: {
    fontSize: 13,
    marginLeft: 20,
    marginTop: 2,
  },
});
