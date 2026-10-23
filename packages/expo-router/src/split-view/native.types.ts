export interface SplitViewColumnOptions {
  /**
   * Title shown in the column navigation bar.
   */
  title?: string;
  /**
   * Shows a large title in the column navigation bar.
   */
  headerLargeTitle?: boolean;
  /**
   * Shows the column navigation bar.
   */
  headerShown?: boolean;
}

export interface SplitViewColumnOptionsViewProps extends SplitViewColumnOptions {
  showSecondaryToggleButton?: boolean;
}
