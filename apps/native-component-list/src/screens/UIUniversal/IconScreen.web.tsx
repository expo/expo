import { Column, Text } from '@expo/ui';

export default function IconScreen() {
  return (
    <Column spacing={8} alignment="center" style={{ padding: 24 }}>
      <Text textStyle={{ fontSize: 16, fontWeight: '600' }}>Icon is not supported on web</Text>
      <Text textStyle={{ fontSize: 13, color: '#666', textAlign: 'center' }}>
        {
          'The universal `Icon` component bridges SF Symbols on iOS and `@expo/material-symbols` XML drawables on Android. There is no web rendering — `<Icon>` returns null. Run this screen on an iOS or Android device to see the examples.'
        }
      </Text>
    </Column>
  );
}

IconScreen.navigationOptions = {
  title: 'Universal Icon',
};
