package expo.interfaces.devmenu

import expo.interfaces.devmenu.items.DevMenuItemsContainerInterface
import expo.interfaces.devmenu.items.DevMenuScreen

interface DevMenuExtensionInterface {
  /**
   * Returns a name of the module and the extension. Also required by [com.facebook.react.bridge.ReactContextBaseJavaModule].
   */
  fun getName(): String

  /**
   * Returns an `DevMenuItemsContainer` that contains the dev menu items to show on the main screen.
   * It's called only once for the extension instance — results are being cached on first dev menu launch.
   */
  fun devMenuItems(): DevMenuItemsContainerInterface?

  fun devMenuScreens(): List<DevMenuScreen>? = null
}
