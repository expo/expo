export type ExpoDevMenuItem = {
  name: string;
  callback: () => void;
};

export type ExpoDevMenu = {
  openMenu();
  openProfile();
  openSettings();
  addDevMenuCallbacks(names: string[]);
};
