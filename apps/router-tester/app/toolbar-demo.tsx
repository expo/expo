import { enableLegacyHeaderAppearance, Stack } from 'expo-router';
import { View } from 'react-native';

import {
  deleteIcon,
  favoriteIcon,
  filterIcon,
  infoIcon,
  newIcon,
  shareIcon,
} from '../components/toolbar-demo/icons';

// enableLegacyHeaderAppearance();

export default function ToolbarDemoScreen() {
  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon={filterIcon} />
        <Stack.Toolbar.Button icon={newIcon} />
      </Stack.Toolbar>
      <Stack.Toolbar placement="left"></Stack.Toolbar>
      <>
        <Stack.Title style={{ color: '#fff' }}>Expo Router</Stack.Title>
      </>
      <View style={{ flex: 1, backgroundColor: 'black' }} />
      <Stack.Toolbar>
        <Stack.Toolbar.Button icon={shareIcon} />
        <Stack.Toolbar.Button icon={favoriteIcon} />
        <Stack.Toolbar.Button icon={infoIcon} />
        <Stack.Toolbar.Button icon={deleteIcon} />
      </Stack.Toolbar>
    </>
  );
}
