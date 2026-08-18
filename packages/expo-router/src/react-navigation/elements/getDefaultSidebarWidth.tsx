const APPROX_APP_BAR_HEIGHT = 56;
const DEFAULT_DRAWER_WIDTH = 360;

export const getDefaultSidebarWidth = ({ width }: { width: number }) => {
  /**
   * Default sidebar width is 360dp
   * On screens smaller than 320dp, ideally the drawer would collapse to a tab bar
   * https://m3.material.io/components/navigation-drawer/specs
   */
  if (width - APPROX_APP_BAR_HEIGHT <= 360) {
    return width - APPROX_APP_BAR_HEIGHT;
  }

  return DEFAULT_DRAWER_WIDTH;
};
