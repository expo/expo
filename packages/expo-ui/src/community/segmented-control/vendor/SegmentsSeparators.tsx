/**
 * Vendored from @react-native-segmented-control/segmented-control (MIT license).
 * https://github.com/react-native-segmented-control/segmented-control
 */

import { StyleSheet, View, useColorScheme } from 'react-native';

export function SegmentsSeparators({
  values,
  selectedIndex,
}: {
  values: number;
  selectedIndex?: number;
}) {
  const colorScheme = useColorScheme();
  const hide = (val: number) => {
    return selectedIndex === val || selectedIndex === val + 1;
  };

  return (
    <View style={styles.separatorsContainer}>
      {[...Array(values - 1).keys()].map((val) => (
        <View
          key={val}
          style={[
            styles.separator,
            colorScheme === 'dark' && styles.darkSeparator,
            hide(val) && styles.hide,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  separatorsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  separator: {
    width: 1,
    height: '50%',
    backgroundColor: '#D1D1D4',
  },
  darkSeparator: {
    backgroundColor: '#3F3F42',
  },
  hide: {
    backgroundColor: 'transparent',
  },
});
