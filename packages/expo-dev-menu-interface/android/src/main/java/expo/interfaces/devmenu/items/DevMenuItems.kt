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
  var isAvailable = { true }
  var isEnabled = { false }
  var label = { "" }
  var detail = { "" }
  var glyphName = { "" }
  var importance = DevMenuItemImportance.MEDIUM.value

  /**
   * Represent how this item will be treated by the js.
   *  1 - [DevMenuAction]
   *  2 - [DevMenuGroup]
   */
  abstract fun getExportedType(): Int

  open fun serialize() = Bundle().apply {
    putInt("type", getExportedType())
    putBoolean("isAvailable", isAvailable())
    putBoolean("isEnabled", isEnabled())
    putString("label", label())
    putString("detail", detail())
    putString("glyphName", glyphName())
  }
}

class DevMenuAction(val actionId: String, val action: () -> Unit) : DevMenuItem() {
  var keyCommand: KeyCommand? = null

  override fun getExportedType() = 1

  override fun serialize() = super.serialize().apply {
    putString("actionId", actionId)

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

class DevMenuGroup(private val groupName: String) : DevMenuItem() {
  private val items: ArrayList<DevMenuItem> = ArrayList()

  fun addItem(item: DevMenuItem) = items.add(item)

  override fun getExportedType() = 2

  override fun serialize() = super.serialize().apply {
    putString("groupName", groupName)
    putParcelableArray("items", items.map { it.serialize() }.toTypedArray())
  }
}
