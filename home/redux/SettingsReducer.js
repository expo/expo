import { Record } from 'immutable';

const SettingsState = Record({
  preferredAppearance: 'no-preference',
});

export default (state, action) => {
  switch (action.type) {
    case 'loadSettings':
      return new SettingsState(action.payload);
    case 'setPreferredAppearance': {
      const { preferredAppearance } = action.payload;
      return state.merge({ preferredAppearance });
    }
    default:
      return state || new SettingsState();
  }
};
