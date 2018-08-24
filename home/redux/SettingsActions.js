import { NativeModules } from 'react-native';
import LocalStorage from '../storage/LocalStorage';
const { ExponentKernel } = NativeModules;

export default {
  loadSettings() {
    return async (dispatch) => {
      const settings = await LocalStorage.getSettingsAsync();

      if (settings && settings.legacyMenuGesture) {
        try {
          await ExponentKernel.setIsLegacyMenuBehaviorEnabledAsync(true);
        } catch (_) {}
      }

      return dispatch({
        type: 'loadSettings',
        payload: settings,
      });
    };
  },

  setIsLegacyMenuBehaviorEnabled(useLegacyGesture) {
    return async (dispatch) => {
      let finalGestureSetting = useLegacyGesture;
      try {
        await Promise.all([
          ExponentKernel.setIsLegacyMenuBehaviorEnabledAsync(useLegacyGesture),
          LocalStorage.updateSettingsAsync({
            legacyMenuGesture: useLegacyGesture,
          }),
        ]);
      } catch (e) {
        alert('Oops, something went wrong and we were unable to change the gesture type!');
        finalGestureSetting = !useLegacyGesture;
      }

      return dispatch({
        type: 'setIsLegacyMenuBehaviorEnabled',
        payload: { legacyMenuGesture: finalGestureSetting },
      });
    };
  },
};
