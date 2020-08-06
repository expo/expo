package expo.modules.devmenu.extensions

import expo.modules.devmenu.extensions.items.DevMenuItem

interface DevMenuExtensionProtocol {
  fun devMenuItems(): List<DevMenuItem>?
}
