import { StyleSheet, Text, type TextStyle } from 'react-native';

import { useTheme } from '../../common/ThemeProvider';
import Statuses, { type Status } from '../constants/Statuses';

const indicators: Record<string, string> = {
  [Statuses.Passed]: '✓',
  [Statuses.Failed]: '✗',
  [Statuses.Disabled]: '–',
  [Statuses.Pending]: '–',
  [Statuses.Excluded]: '–',
  [Statuses.Running]: '○',
};

const colorKeys: Record<string, string> = {
  [Statuses.Passed]: 'success',
  [Statuses.Failed]: 'danger',
  [Statuses.Disabled]: 'tertiary',
  [Statuses.Pending]: 'tertiary',
  [Statuses.Excluded]: 'tertiary',
  [Statuses.Running]: 'warning',
};

type StatusIndicatorProps = {
  status?: Status;
  style?: TextStyle;
};

export default function StatusIndicator({
  status = Statuses.Running,
  style,
}: StatusIndicatorProps) {
  const { theme } = useTheme();

  return (
    <Text
      style={[styles.indicator, { color: theme.icon[colorKeys[status] ?? 'secondary'] }, style]}>
      {indicators[status] ?? indicators[Statuses.Running]}
    </Text>
  );
}

const styles = StyleSheet.create({
  indicator: {
    fontSize: 16,
    fontWeight: '800',
    width: 22,
    textAlign: 'center',
  },
});
