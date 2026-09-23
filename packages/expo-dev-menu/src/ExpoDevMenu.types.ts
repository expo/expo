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
  /**
   * Optional native icon displayed before the label. Omit a platform to show only the label there.
   */
  icon?: {
    /** SF Symbol name, for example `'person.crop.circle'`. */
    ios?: string;
    /** Drawable resource name bundled with the Android app, for example `'dev_menu_account'`. */
    android?: string;
  };
  /**
   * Section heading. Items with the same group appear together, in registration order.
   * Groups appear in the order they are first encountered. Blank or omitted groups use
   * the default "Custom Menu Items" section. Item names must remain unique across groups.
   */
  group?: string;
};

/** @hidden */
export type ExpoDevMenuCallback = Pick<ExpoDevMenuItem, 'name' | 'shouldCollapse' | 'group'> & {
  icon?: string;
};

/**
 * @hidden
 */
export type ExpoDevMenu = {
  openMenu(): void;
  closeMenu(): void;
  hideMenu(): void;
  setToolsButtonVisible(visible: boolean): void;
  addDevMenuCallbacks(callbacks: ExpoDevMenuCallback[]): void;
};
