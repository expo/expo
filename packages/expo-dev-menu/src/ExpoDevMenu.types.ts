export type ExpoDevMenuItem = {
  name: string;
  callback: () => void;
};

export type ExpoDevMenu = {
  openMenu();
  addDevMenuCallbacks(names: string[]);
};
