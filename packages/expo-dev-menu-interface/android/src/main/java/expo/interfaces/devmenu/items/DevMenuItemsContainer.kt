package expo.interfaces.devmenu.items

import java.util.*

open class DevMenuItemsContainer : DevMenuDSLItemsContainerInterface {
  private val items = mutableListOf<DevMenuScreenItem>()

  override fun getRootItems(): List<DevMenuScreenItem> {
    items.sortedWith(compareBy { it.importance })
    return items
  }

  override fun getAllItems(): List<DevMenuScreenItem> {
    val result = LinkedList<DevMenuScreenItem>()

    items.forEach {
      result.add(it)

      if (it is DevMenuItemsContainerInterface) {
        result.addAll(it.getAllItems())
      }
    }
    return result
  }

  private fun addItem(item: DevMenuScreenItem) {
    items.add(item)
  }

  override fun group(init: DevMenuGroup.() -> Unit) = addItem(DevMenuGroup(), init)

  override fun action(actionId: String, action: () -> Unit, init: DevMenuAction.() -> Unit) =
    addItem(DevMenuAction(actionId, action), init)

  override fun link(target: String, init: DevMenuLink.() -> Unit) = addItem(DevMenuLink(target), init)

  override fun selectionList(init: DevMenuSelectionList.() -> Unit) = addItem(DevMenuSelectionList(), init)

  private fun <T : DevMenuScreenItem> addItem(item: T, init: T.() -> Unit): T {
    item.init()
    addItem(item)
    return item
  }

  companion object {
    @JvmStatic
    fun export(init: DevMenuDSLItemsContainerInterface.() -> Unit): DevMenuItemsContainer {
      val container = DevMenuItemsContainer()
      container.init()
      return container
    }
  }
}
