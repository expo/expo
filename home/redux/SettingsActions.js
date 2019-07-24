import * as Kernel from '../kernel/Kernel';
import LocalStorage from '../storage/LocalStorage';

export default {
  loadSettings() {
    return async dispatch => {
      const settings = await LocalStorage.getSettingsAsync();

      if (settings && settings.legacyMenuGesture) {
        try {
          await Kernel.setLegacyMenuBehaviorEnabledAsync(true);
        } catch (_) {}
      }

      return dispatch({
        type: 'loadSettings',
        payload: settings,
      });
    };
  },

  setIsLegacyMenuBehaviorEnabled(useLegacyGesture) {
    return async dispatch => {
      let finalGestureSetting = useLegacyGesture;
      try {
        await Promise.all([
          Kernel.setLegacyMenuBehaviorEnabledAsync(useLegacyGesture),
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
