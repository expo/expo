import * as Kernel from '../kernel/Kernel';
import LocalStorage from '../storage/LocalStorage';

export default {
  loadSettings() {
    return async dispatch => {
      const settings = await LocalStorage.getSettingsAsync();

      return dispatch({
        type: 'loadSettings',
        payload: settings,
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
};
