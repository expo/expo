import {
  Host,
  SyncSwitch,
  useNativeState,
  Text as ComposeText,
  Column,
  Card,
  LazyColumn,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import { Button, View, Text } from 'react-native';
import { scheduleOnUI } from 'react-native-worklets';

export default function SyncSwitchScreen() {
  const isOn = useNativeState(false);

  const toggleFromWorklet = () => {
    scheduleOnUI(() => {
      'worklet';
      console.log('[UI thread] isOn:', isOn.value);
      isOn.value = !isOn.value;
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
          This switch is driven by ObservableState, a native SharedObject that both JS and Compose
          observe. Toggling from either side updates instantly.
        </Text>
        <Button title="Toggle from JS" onPress={() => (isOn.value = !isOn.value)} />
        <Button title="Toggle from Worklet" onPress={toggleFromWorklet} />
      </View>
      <Host style={{ flex: 1 }}>
        <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
          <Card modifiers={[fillMaxWidth()]}>
            <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
              <ComposeText>Shared State Switch</ComposeText>
              <ComposeText>Uses useNativeState to share state between JS and Compose.</ComposeText>
              <SyncSwitch
                isOn={isOn}
                onCheckedChangeSync={(checked) => {
                  'worklet';
                  console.log('[UI thread] onCheckedChangeSync:', checked);
                }}
              />
            </Column>
          </Card>
        </LazyColumn>
      </Host>
    </View>
  );
}

SyncSwitchScreen.navigationOptions = {
  title: 'SyncSwitch',
};
