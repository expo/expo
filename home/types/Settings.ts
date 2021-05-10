import { ColorSchemeName } from 'react-native-appearance';

export type Settings = {
  preferredAppearance: ColorSchemeName;
  devMenuSettings?: { [key: string]: any };
};
