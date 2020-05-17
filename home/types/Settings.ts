export type PreferredAppearance = 'no-preference' | 'dark' | 'light';

export type Settings = {
  preferredAppearance: PreferredAppearance;
  devMenuSettings?: any; // TODO
};
