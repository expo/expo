import { Appearance } from 'react-native';

import * as DevMenu from '../menu/DevMenuModule';
import LocalStorage from '../storage/LocalStorage';
import { AppDispatch, AppThunk } from './Store.types';

type ColorSchemeName = Appearance.AppearancePreferences['colorScheme'];

export default {
  loadSettings(): AppThunk {
    return async (dispatch: AppDispatch) => {
      const [localStorageSettings, devMenuSettings] = await Promise.all([
        LocalStorage.getSettingsAsync(),
        DevMenu.getSettingsAsync(),
      ]);

      return dispatch({
        type: 'loadSettings',
        payload: {
          ...localStorageSettings,
          preferredAppearance: localStorageSettings.preferredAppearance ?? undefined,
          devMenuSettings,
        },
      });
    };
  },

  setPreferredAppearance(preferredAppearance: ColorSchemeName): AppThunk {
    return async (dispatch: AppDispatch) => {
      try {
        await LocalStorage.updateSettingsAsync({
          preferredAppearance,
        });

        dispatch({
          type: 'setPreferredAppearance',
          payload: { preferredAppearance },
        });
      } catch {
        alert('Oops, something went wrong and we were unable to change the preferred appearance');
      }
    };
  },

  setDevMenuSetting(key: keyof DevMenu.DevMenuSettings, value?: boolean): AppThunk {
    return async (dispatch: AppDispatch) => {
      try {
        await DevMenu.setSettingAsync(key, value);

        dispatch({
          type: 'setDevMenuSettings',
          payload: { [key]: value },
        });
      } catch {
        alert('Oops, something went wrong and we were unable to change dev menu settings!');
      }
    };
  },
};
