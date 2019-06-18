import LocalStorage from '../storage/LocalStorage';

export default {
  setImage(url) {
    return async dispatch => {
      await LocalStorage.saveProfileBannerImageAsync(url);
      return dispatch({
        type: 'setImage',
        payload: { url },
      });
    };
  },
  load() {
    return async dispatch => {
      const url = await LocalStorage.getProfileBannerImageAsync();
      return dispatch({
        type: 'setImage',
        payload: { url },
      });
    };
  },
  clearImage() {
    return async dispatch => {
      await LocalStorage.clearProfileBannerImageAsync();
      return dispatch({
        type: 'clearImage',
      });
    };
  },
};
