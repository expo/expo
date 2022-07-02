import { Record } from 'immutable';
import { Appearance } from 'react-native';

type ColorSchemeName = Appearance.AppearancePreferences['colorScheme'];

type SettingsObject = {
  preferredAppearance: null | ColorSchemeName;
  devMenuSettings: null | {
    motionGestureEnabled?: boolean;
    touchGestureEnabled?: boolean;
  };
};

export type SettingsType = Record<SettingsObject> & Readonly<SettingsObject>;

type SettingsActions =
  | {
      type: 'loadSettings';
      payload: SettingsObject;
    }
  | { type: 'setPreferredAppearance'; payload: Pick<SettingsObject, 'preferredAppearance'> }
  | { type: 'setDevMenuSettings'; payload: SettingsObject['devMenuSettings'] };

const SettingsState = Record<SettingsObject>({
  preferredAppearance: undefined,
  devMenuSettings: null,
});

export default (state: SettingsType, action: SettingsActions): SettingsType => {
  switch (action.type) {
    case 'loadSettings':
      return new SettingsState(action.payload);
    case 'setPreferredAppearance': {
      const { preferredAppearance } = action.payload;
      return state.merge({ preferredAppearance });
    }
    case 'setDevMenuSettings': {
      const devMenuSettings = state.get('devMenuSettings');
      return state.set('devMenuSettings', {
        ...devMenuSettings,
        ...action.payload,
      });
    }
    default:
      return state || new SettingsState();
  }
};
