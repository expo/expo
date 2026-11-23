import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { box } from './styles';

interface PanelProps {
  children: ReactNode;
}

export function Panel({ children }: PanelProps) {
  return <View style={[box.container, styles.panel]}>{children}</View>;
}

const styles = StyleSheet.create({
  panel: {
    flexGrow: 1,
  },
});
