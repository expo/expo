package expo.modules.devmenu.interfaces

import expo.modules.devmenu.extensions.items.DevMenuItem

interface DevMenuExtensionInterface {
  /**
   * Returns an array of the dev menu items to show.
   * It's called only once for the extension instance — results are being cached on first dev menu launch.
   */
  fun devMenuItems(): List<DevMenuItem>?
}
