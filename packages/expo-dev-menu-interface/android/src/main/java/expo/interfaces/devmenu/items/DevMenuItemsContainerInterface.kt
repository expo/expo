package expo.interfaces.devmenu.items

import android.os.Bundle

interface DevMenuItemsContainerInterface {
  fun getRootItems(): List<DevMenuScreenItem>
  fun getAllItems(): List<DevMenuScreenItem>
  fun addItem(item: DevMenuScreenItem)
  fun serializeItems(): Array<Bundle>
}

inline fun <reified T> DevMenuItemsContainerInterface.getItemsOfType(): List<T> {
  return getAllItems().filterIsInstance<T>()
}

interface DevMenuDSLItemsContainerInterface : DevMenuItemsContainerInterface {
  fun group(init: DevMenuGroup.() -> Unit): DevMenuGroup
  fun action(actionId: String, action: () -> Unit, init: DevMenuAction.() -> Unit): DevMenuAction
  fun link(target: String, init: DevMenuLink.() -> Unit): DevMenuLink
  fun selectionList(init: DevMenuSelectionList.() -> Unit): DevMenuSelectionList
}

fun screen(name: String, init: DevMenuScreen.() -> Unit): DevMenuScreen {
  val screen = DevMenuScreen(name)
  screen.init()
  return screen
}

