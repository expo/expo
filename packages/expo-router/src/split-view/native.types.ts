export interface SplitViewColumnOptions {
  /**
   * Title shown in the navigation bar of the column.
   */
  title?: string;
  /**
   * Whether the navigation bar of the column shows a large title.
   * In compact width, columns share one navigation bar, so a large title can also show on the other columns.
   */
  headerLargeTitle?: boolean;
  /**
   * Whether the navigation bar of the column is visible.
   * In compact width, hiding the bar also removes the back button and the swipe-back gesture.
   */
  headerShown?: boolean;
}

export interface SplitViewColumnOptionsViewProps extends SplitViewColumnOptions {
  showSecondaryToggleButton?: boolean;
}
