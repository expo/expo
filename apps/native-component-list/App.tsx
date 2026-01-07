import { ThemeProvider } from 'ThemeProvider';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { Platform, StatusBar } from 'react-native';

import RootNavigation from './src/navigation/RootNavigation';
import loadAssetsAsync from './src/utilities/loadAssetsAsync';
import {
  Host,
  List,
  Text,
  Section,
  Label,
  Button,
  Picker,
  HStack,
  Image,
  TextField,
} from '@expo/ui/swift-ui';
import { useState } from 'react';
import {
  listStyle,
  pickerStyle,
  refreshable,
  tag,
  padding,
  listRowInsets,
  listRowBackground,
  listRowSeparator,
  badge,
  headerProminence,
  scrollDismissesKeyboard,
} from '@expo/ui/swift-ui/modifiers';

SplashScreen.preventAutoHideAsync();

function useSplashScreen(loadingFunction: () => Promise<void>) {
  const [isLoadingCompleted, setLoadingComplete] = React.useState(false);

  // Load any resources or data that we need prior to rendering the app
  React.useEffect(() => {
    async function loadAsync() {
      try {
        await loadingFunction();
      } catch (e) {
        // We might want to provide this error information to an error reporting service
        console.warn(e);
      } finally {
        setLoadingComplete(true);
        await SplashScreen.hide();
      }
    }

    loadAsync();
  }, []);

  return isLoadingCompleted;
}

export default function App() {
  const isLoadingCompleted = useSplashScreen(async () => {
    if (Platform.OS === 'ios') {
      StatusBar.setBarStyle('dark-content', false);
    }
    await loadAssetsAsync();
  });

  return <ThemeProvider>{isLoadingCompleted ? <EditableListExample /> : null}</ThemeProvider>;
}

function EditableListExample() {
  return (
    <Host style={{ flex: 1 }}>
      <List modifiers={[scrollDismissesKeyboard('interactively')]}>
        <Section title="Form">
          <TextField placeholder="Name" />
          <TextField placeholder="Email" />
          <TextField placeholder="Phone" />
        </Section>
      </List>
    </Host>
  );
}
