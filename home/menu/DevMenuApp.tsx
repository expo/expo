import { ThemeProvider } from '@react-navigation/native';
import React from 'react';
import { AppRegistry } from 'react-native';
import { AppearanceProvider, useColorScheme } from 'react-native-appearance';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ColorTheme } from '../constants/Colors';
import Themes from '../constants/Themes';
import LocalStorage from '../storage/LocalStorage';
import DevMenuBottomSheet from './DevMenuBottomSheet';
import DevMenuView from './DevMenuView';

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
  const { preferredAppearance = 'no-preference' } = useUserSettings(uuid);

  let theme = preferredAppearance === 'no-preference' ? colorScheme : preferredAppearance;
  if (theme === 'no-preference') {
    theme = 'light';
  }
  return theme === 'light' ? ColorTheme.LIGHT : ColorTheme.DARK;
}

class DevMenuRoot extends React.PureComponent<{ task: { [key: string]: any }; uuid: string }, any> {
  render() {
    return <DevMenuApp {...this.props} />;
  }
}

function DevMenuApp(props: { task: { [key: string]: any }; uuid: string }) {
  const theme = useAppColorScheme(props.uuid);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppearanceProvider>
        <DevMenuBottomSheet uuid={props.uuid}>
          <ThemeProvider value={Themes[theme]}>
            <DevMenuView {...props} />
          </ThemeProvider>
        </DevMenuBottomSheet>
      </AppearanceProvider>
    </GestureHandlerRootView>
  );
}

AppRegistry.registerComponent('HomeMenu', () => DevMenuRoot);
