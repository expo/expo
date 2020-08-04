import { ThemeProvider } from '@react-navigation/native';
import React from 'react';
import { AppRegistry } from 'react-native';
import { AppearanceProvider, useColorScheme } from 'react-native-appearance';

import * as Themes from '../constants/Themes';
import LocalStorage from '../storage/LocalStorage';
import DevMenuBottomSheet from './DevMenuBottomSheet';
import DevMenuView from './DevMenuView';

function useUserSettings(renderId): { preferredAppearance?: string } {
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

function useAppColorScheme(uuid: string) {
  const colorScheme = useColorScheme();
  const { preferredAppearance = 'no-preference' } = useUserSettings(uuid);

  let theme = preferredAppearance === 'no-preference' ? colorScheme : preferredAppearance;
  if (theme === 'no-preference') {
    theme = 'light';
  }
  return theme;
}

class DevMenuRoot extends React.PureComponent<any, any> {
  render() {
    return <DevMenuApp {...this.props} />;
  }
}

function DevMenuApp(props) {
  const theme = useAppColorScheme(props.uuid);
  return (
    <AppearanceProvider>
      <DevMenuBottomSheet uuid={props.uuid}>
        <ThemeProvider value={Themes[theme]}>
          <DevMenuView {...props} />
        </ThemeProvider>
      </DevMenuBottomSheet>
    </AppearanceProvider>
  );
}

AppRegistry.registerComponent('HomeMenu', () => DevMenuRoot);
