import SettingsActions from './SettingsActions';
import { Record } from 'immutable';

const SettingsState = Record({
  legacyMenuGesture: false,
});

export default (state, action) => {
  switch (action.type) {
  case 'loadSettings':
    return new SettingsState(action.payload);
  case 'setIsLegacyMenuBehaviorEnabled':
    const { legacyMenuGesture } = action.payload;
    return state.merge({ legacyMenuGesture });
  default:
    return (state) ? state : new SettingsState();
  }
};
