import { Children, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

interface PanelGroupProps {
  children: ReactNode;
}

export function PanelGroup({ children }: PanelGroupProps) {
  return (
    <View style={styles.group}>
      {Children.map(children, (child) => (
        <View style={styles.cell}>{child}</View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexGrow: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'stretch',
    justifyContent: 'center',
    alignSelf: 'stretch',
    gap: 24,
  },
  cell: {
    flexGrow: 1,
    flexBasis: 360,
    maxWidth: 480,
  },
});
