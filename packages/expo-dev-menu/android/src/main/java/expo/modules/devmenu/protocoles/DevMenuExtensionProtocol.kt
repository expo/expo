package expo.modules.devmenu.protocoles

import expo.modules.devmenu.extensions.items.DevMenuItem

interface DevMenuExtensionProtocol {
  fun devMenuItems(): List<DevMenuItem>?
}
