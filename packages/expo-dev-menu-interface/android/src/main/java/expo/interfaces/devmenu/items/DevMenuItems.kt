package expo.interfaces.devmenu.items

import android.os.Bundle
import android.view.KeyCharacterMap
import com.facebook.react.bridge.ReadableMap

val keyCharacterMap: KeyCharacterMap = KeyCharacterMap.load(KeyCharacterMap.VIRTUAL_KEYBOARD)

// Android virtual keyboard only supports `SHIFT` as a modifier.
data class KeyCommand(val code: Int, val withShift: Boolean = false)

/**
 * An abstract representation of the single dev menu item.
 */
sealed class DevMenuItem {
  /**
   * Represent how this item will be treated by the js.
   *  1 - [DevMenuAction]
   *  2 - [DevMenuGroup]
   *  3 - [DevMenuScreen]
   *  4 - [DevMenuLink]
   *  5 - [DevMenuSelectionList]
   */
  abstract fun getExportedType(): Int

  open fun serialize() = Bundle().apply {
    putInt("type", getExportedType())
  }
}

abstract class DevMenuScreenItem : DevMenuItem() {
  var importance = DevMenuItemImportance.MEDIUM.value
}

class DevMenuScreen(
  val screenName: String,
  itemsContainer: DevMenuDSLItemsContainerInterface = DevMenuItemsContainer()
) : DevMenuItem(), DevMenuDSLItemsContainerInterface by itemsContainer {
  override fun getExportedType() = 3

  override fun serialize() = super.serialize().apply {
    putString("screenName", screenName)
    putParcelableArray("items", serializeItems())
  }
}

class DevMenuGroup(
  itemsContainer: DevMenuDSLItemsContainerInterface = DevMenuItemsContainer()
) : DevMenuScreenItem(), DevMenuDSLItemsContainerInterface by itemsContainer {
  override fun getExportedType() = 2

  override fun serialize() = super.serialize().apply {
    putParcelableArray("items", serializeItems())
  }
}

class DevMenuAction(
  actionId: String,
  action: () -> Unit
) : DevMenuScreenItem(), DevMenuCallableProvider {
  val callable = DevMenuExportedAction(actionId, action)
  var isAvailable: () -> Boolean
    get() = callable.isAvailable
    set(value) {
      callable.isAvailable = value
    }
  var isEnabled = { false }
  var label = { "" }
  var detail = { "" }
  var glyphName = { "" }

  var keyCommand: KeyCommand?
    get() = callable.keyCommand
    set(value) {
      callable.registerKeyCommand(value)
    }

  override fun getExportedType() = 1

  override fun serialize() = super.serialize().apply {
    putString("actionId", callable.id)
    putBoolean("isAvailable", isAvailable())
    putBoolean("isEnabled", isEnabled())
    putString("label", label())
    putString("detail", detail())
    putString("glyphName", glyphName())

    putBundle(
      "keyCommand",
      keyCommand?.let { keyCommand ->
        Bundle().apply {
          putString("input", keyCharacterMap.getDisplayLabel(keyCommand.code).toString())
          putInt("modifiers", exportKeyCommandModifiers())
        }
      }
    )
  }

  private fun exportKeyCommandModifiers(): Int {
    if (keyCommand?.withShift == true) {
      return 1 shl 3
    }
    return 0
  }

  override fun registerCallable(): DevMenuExportedCallable {
    return callable
  }
}

class DevMenuLink(private val target: String) : DevMenuScreenItem() {
  var label = { "" }
  var glyphName = { "" }

  override fun getExportedType() = 4

  override fun serialize() = super.serialize().apply {
    putString("target", target)
    putString("label", label())
    putString("glyphName", glyphName())
  }
}

class DevMenuSelectionList : DevMenuScreenItem(), DevMenuCallableProvider {
  class Item : DevMenuDataSourceItem {
    class Tag {
      var glyphName = { "" }
      var text = { "" }

      internal fun serialize() = Bundle().apply {
        putString("text", text())
        putString("glyphName", glyphName())
      }
    }

    var title = { "" }
    var tags: () -> List<Tag> = { emptyList() }
    var warning: () -> String? = { null }
    var isChecked = { false }
    var onClickData: () -> Bundle? = { null }

    override fun serialize() = Bundle().apply {
      putString("title", title())
      putString("warning", warning())
      putBoolean("isChecked", isChecked())
      putBundle("onClickData", onClickData())
      putParcelableArray("tags", tags().map { it.serialize() }.toTypedArray())
    }
  }

  private var items = ArrayList<Item>()
  private var callable: DevMenuExportedFunction? = null
  var dataSourceId: () -> String? = { null }

  fun addOnClick(handler: (ReadableMap?) -> Unit) {
    callable = DevMenuExportedFunction("expo-dev-menu.selection-list.#${ActionID++}", handler)
  }

  fun addItem(item: Item) {
    items.add(item)
  }

  override fun getExportedType(): Int {
    return 5
  }

  override fun serialize() = super.serialize().apply {
    callable?.let {
      putString("actionId", it.id)
    }
    putString("dataSourceId", dataSourceId())
    putParcelableArray("items", items.map { it.serialize() }.toTypedArray())
  }

  companion object {
    private var ActionID = 0
  }

  override fun registerCallable(): DevMenuExportedCallable? {
    return callable
  }
}
