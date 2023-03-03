export type ExpoDevMenuItem = {
  name: string;
  callback: () => void;
  shouldCollapse?: boolean;
};

export type ExpoDevMenu = {
  openMenu();
  closeMenu();
  hideMenu();
  addDevMenuCallbacks(callbacks: { name: string; shouldCollapse?: boolean }[]);
};
