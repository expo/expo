import { Record } from 'immutable';

const SettingsState = Record({
  preferredAppearance: 'no-preference',
  devMenuSettings: null,
});

export default (state, action) => {
  switch (action.type) {
    case 'loadSettings':
      return new SettingsState(action.payload);
    case 'setPreferredAppearance': {
      const { preferredAppearance } = action.payload;
      return state.merge({ preferredAppearance });
    }
    case 'setDevMenuSettings': {
      const devMenuSettings = state.get('devMenuSettings');
      return state.set('devMenuSettings', { ...devMenuSettings, ...action.payload });
    }
    default:
      return state || new SettingsState();
  }
};
