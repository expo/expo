import { Record } from 'immutable';

const SettingsState = Record({
  legacyMenuGesture: false,
  preferredAppearance: 'no-preference',
});

export default (state, action) => {
  switch (action.type) {
    case 'loadSettings':
      return new SettingsState(action.payload);
    case 'setIsLegacyMenuBehaviorEnabled': {
      const { legacyMenuGesture } = action.payload;
      return state.merge({ legacyMenuGesture });
    }
    case 'setPreferredAppearance': {
      const { preferredAppearance } = action.payload;
      return state.merge({ preferredAppearance });
    }
    default:
      return state || new SettingsState();
  }
};
