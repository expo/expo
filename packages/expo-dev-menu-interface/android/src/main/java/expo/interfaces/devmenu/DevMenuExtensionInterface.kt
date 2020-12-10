package expo.interfaces.devmenu

import expo.interfaces.devmenu.items.DevMenuItem

interface DevMenuExtensionInterface {
  /**
   * Returns a name of the module and the extension. Also required by [com.facebook.react.bridge.ReactContextBaseJavaModule].
   */
  fun getName(): String

  /**
   * Returns an array of the dev menu items to show.
   * It's called only once for the extension instance — results are being cached on first dev menu launch.
   */
  fun devMenuItems(): List<DevMenuItem>?
}
