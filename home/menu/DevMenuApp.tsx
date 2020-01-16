import React from 'react';
import { ThemeContext } from 'react-navigation';
import { AppRegistry, StyleSheet } from 'react-native';
import { AppearanceProvider, useColorScheme } from 'react-native-appearance';

import DevMenuBottomSheet from './DevMenuBottomSheet';
import DevMenuView from './DevMenuView';
import LocalStorage from '../storage/LocalStorage';

function useUserSettings(renderId): { preferredAppearance?: string } {
  let [settings, setSettings] = React.useState({});

  React.useEffect(() => {
    async function getUserSettings() {
      let settings = await LocalStorage.getSettingsAsync();
      setSettings(settings);
    }

    getUserSettings();
  }, [renderId]);

  return settings;
}

class DevMenuRoot extends React.PureComponent<any, any> {
  render() {
    return <DevMenuApp {...this.props} />;
  }
}

function DevMenuApp(props) {
  const colorScheme = useColorScheme();
  const { preferredAppearance = 'no-preference' } = useUserSettings(props.uuid);

  let theme = preferredAppearance === 'no-preference' ? colorScheme : preferredAppearance;
  if (theme === 'no-preference') {
    theme = 'light';
  }

  return (
    <AppearanceProvider style={styles.rootView}>
      <DevMenuBottomSheet uuid={props.uuid}>
        <ThemeContext.Provider value={theme}>
          <DevMenuView {...props} />
        </ThemeContext.Provider>
      </DevMenuBottomSheet>
    </AppearanceProvider>
  );
}

const styles = StyleSheet.create({
  rootView: {
    flex: 1,
  },
});

AppRegistry.registerComponent('HomeMenu', () => DevMenuRoot);
