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
   * The type of menu item. Defaults to 'action'.
   * Use 'toggle' to render a switch that the user can toggle on/off.
   */
  type?: 'action' | 'toggle';
  /**
   * The current value of the toggle. Only used when type is 'toggle'.
   * The app should manage this state and re-register items when it changes.
   */
  value?: boolean;
};

/**
 * @hidden
 */
export type ExpoDevMenu = {
  openMenu(): void;
  closeMenu(): void;
  hideMenu(): void;
  addDevMenuCallbacks(
    callbacks: {
      name: string;
      shouldCollapse?: boolean;
      type?: 'action' | 'toggle';
      value?: boolean;
    }[]
  ): void;
};
