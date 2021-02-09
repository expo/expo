import MaterialIcons from '@expo/vector-icons/build/MaterialIcons';
import * as React from 'react';
import {
  Alert,
  findNodeHandle,
  NativeModules,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

export default function OptionsButton() {
  const _anchor = React.useRef<View>(null);

  const _handlePress = React.useCallback(() => {
    const handle = findNodeHandle(_anchor.current);
    NativeModules.UIManager.showPopupMenu(
      handle,
      ['Report this user'],
      () => {},
      (action, selectedIndex) => {
        if (selectedIndex === 0) {
          // TODO(Bacon): Anything...
          Alert.alert(
            'Thank you for your report',
            'We will investigate the case as soon as we can.'
          );
        }
      }
    );
  }, [_anchor.current]);
  return (
    <View style={{ flex: 1 }}>
      <View collapsable={false} ref={_anchor} style={{ position: 'absolute', top: 5, left: 0 }} />
      <TouchableOpacity style={styles.buttonContainer} onPress={_handlePress}>
        <MaterialIcons name="more-vert" size={27} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 15,
  },
});
