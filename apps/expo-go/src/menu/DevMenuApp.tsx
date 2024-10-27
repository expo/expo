import { ThemeProvider } from '@react-navigation/native';
import { ThemePreference, ThemeProvider as DCCThemeProvider } from 'expo-dev-client-components';
import React from 'react';
import { AppRegistry, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import DevMenuBottomSheet from './DevMenuBottomSheet';
import { DevMenuView } from './DevMenuView';
import { ColorTheme } from '../constants/Colors';
import Themes from '../constants/Themes';
import LocalStorage from '../storage/LocalStorage';

function useUserSettings(renderId: string): { preferredAppearance?: string } {
  const [settings, setSettings] = React.useState({});

  React.useEffect(() => {
    async function getUserSettings() {
      const settings = await LocalStorage.getSettingsAsync();
      setSettings(settings);
    }

    getUserSettings();
  }, [renderId]);

  return settings;
}

function useAppColorScheme(uuid: string): ColorTheme {
  const colorScheme = useColorScheme();
  const { preferredAppearance = undefined } = useUserSettings(uuid);

  let theme = preferredAppearance === undefined ? colorScheme : preferredAppearance;
  if (theme === undefined) {
    theme = 'light';
  }
  return theme === 'light' ? ColorTheme.LIGHT : ColorTheme.DARK;
}

class DevMenuRoot extends React.PureComponent<
  { task: { manifestUrl: string; manifestString: string }; uuid: string },
  any
> {
  render() {
    return <DevMenuApp {...this.props} />;
  }
}

function DevMenuApp(props: {
  task: { manifestUrl: string; manifestString: string };
  uuid: string;
}) {
  const theme = useAppColorScheme(props.uuid);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DevMenuBottomSheet uuid={props.uuid}>
          <DCCThemeProvider themePreference={theme as ThemePreference}>
            <ThemeProvider value={Themes[theme]}>
              <DevMenuView {...props} />
            </ThemeProvider>
          </DCCThemeProvider>
        </DevMenuBottomSheet>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

AppRegistry.registerComponent('HomeMenu', () => DevMenuRoot);
