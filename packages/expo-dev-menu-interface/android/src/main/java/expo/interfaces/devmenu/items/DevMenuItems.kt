package expo.interfaces.devmenu.items

import android.os.Bundle
import android.view.KeyCharacterMap

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

class DevMenuAction(val actionId: String, val action: () -> Unit) : DevMenuScreenItem() {
  var isAvailable = { true }
  var isEnabled = { false }
  var label = { "" }
  var detail = { "" }
  var glyphName = { "" }

  var keyCommand: KeyCommand? = null

  override fun getExportedType() = 1

  override fun serialize() = super.serialize().apply {
    putString("actionId", actionId)

    putBoolean("isAvailable", isAvailable())
    putBoolean("isEnabled", isEnabled())
    putString("label", label())
    putString("detail", detail())
    putString("glyphName", glyphName())

    putBundle("keyCommand", keyCommand?.let { keyCommand ->
      Bundle().apply {
        putString("input", keyCharacterMap.getDisplayLabel(keyCommand.code).toString())
        putInt("modifiers", exportKeyCommandModifiers())
      }
    })
  }

  private fun exportKeyCommandModifiers(): Int {
    if (keyCommand?.withShift == true) {
      return 1 shl 3
    }
    return 0
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
