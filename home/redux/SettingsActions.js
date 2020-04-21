import * as DevMenu from '../menu/DevMenuModule';
import LocalStorage from '../storage/LocalStorage';

export default {
  loadSettings() {
    return async dispatch => {
      const [localStorageSettings, devMenuSettings] = await Promise.all([
        LocalStorage.getSettingsAsync(),
        DevMenu.getSettingsAsync(),
      ]);

      return dispatch({
        type: 'loadSettings',
        payload: {
          ...localStorageSettings,
          devMenuSettings,
        },
      });
    };
  },

  setPreferredAppearance(preferredAppearance) {
    return async dispatch => {
      try {
        await Promise.all([
          LocalStorage.updateSettingsAsync({
            preferredAppearance,
          }),
        ]);

        return dispatch({
          type: 'setPreferredAppearance',
          payload: { preferredAppearance },
        });
      } catch (e) {
        alert('Oops, something went wrong and we were unable to change the preferred appearance');
      }
    };
  },

  setDevMenuSetting(key, value) {
    return async dispatch => {
      try {
        await DevMenu.setSettingAsync(key, value);

        return dispatch({
          type: 'setDevMenuSettings',
          payload: { [key]: value },
        });
      } catch (e) {
        alert('Oops, something went wrong and we were unable to change dev menu settings!');
      }
    };
  },
};
