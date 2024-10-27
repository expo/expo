import * as KeepAwake from 'expo-keep-awake';
import { View } from 'react-native';

import Button from '../components/Button';

export default function KeepAwakeScreen() {
  const _activate = () => {
    KeepAwake.activateKeepAwakeAsync();
  };

  const _deactivate = () => {
    KeepAwake.deactivateKeepAwake();
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Button style={{ marginBottom: 10 }} onPress={_activate} title="Activate" />
      <Button onPress={_deactivate} title="Deactivate" />
    </View>
  );
}

KeepAwakeScreen.navigationOptions = {
  title: 'KeepAwake',
};
