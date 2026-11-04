import { Stack, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function ToolbarAxisScreen() {
  const { mode, bar } = useLocalSearchParams<{ mode?: string; bar?: string }>();
  const horizontalOnly = mode !== 'automatic';
  const placement = bar === 'toolbar' ? 'bottom' : 'right';
  const axisBehavior = horizontalOnly
    ? ({ axisBehavior: 'horizontalOnly' } as const)
    : {};

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Stack.Screen options={{ headerShown: true, title: 'Inbox', headerLargeTitle: false }} />
      {placement === 'right' ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button icon="checkmark.circle" onPress={() => {}} {...axisBehavior}>
            Select
          </Stack.Toolbar.Button>
          <Stack.Toolbar.Button icon="square.grid.2x2" onPress={() => {}}>
            Grid
          </Stack.Toolbar.Button>
        </Stack.Toolbar>
      ) : (
        <Stack.Toolbar placement="bottom">
          <Stack.Toolbar.Button icon="square.grid.2x2" onPress={() => {}}>
            Grid
          </Stack.Toolbar.Button>
          <Stack.Toolbar.Spacer />
          <Stack.Toolbar.Button icon="checkmark.circle" onPress={() => {}} {...axisBehavior}>
            Select
          </Stack.Toolbar.Button>
        </Stack.Toolbar>
      )}
      <Text testID="axis-behavior-mode">
        select axisBehavior: {horizontalOnly ? 'horizontalOnly' : 'automatic'}
      </Text>
    </View>
  );
}
