/**
 * An object representing the custom development client menu entry.
 */
export type ExpoDevMenuItem = {
  /**
   * Name of the entry, will be used as label.
   */
  name: string;
  /**
   * Callback to fire, when user selects an item.
   */
  callback: () => void;
  /**
   * A boolean specifying if the menu should close after the user interaction.
   * @default false
   */
  shouldCollapse?: boolean;
};

/**
 * @hidden
 */
export type ExpoDevMenu = {
  openMenu();
  closeMenu();
  hideMenu();
  addDevMenuCallbacks(callbacks: { name: string; shouldCollapse?: boolean }[]);
};
