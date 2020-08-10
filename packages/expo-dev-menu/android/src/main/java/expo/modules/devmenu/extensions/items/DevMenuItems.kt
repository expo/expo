package expo.modules.devmenu.extensions.items

import android.os.Bundle
import android.view.KeyCharacterMap

val keyCharacterMap = KeyCharacterMap.load(KeyCharacterMap.VIRTUAL_KEYBOARD)

sealed class DevMenuItem {
  var isAvailable = { true }
  var isEnabled = { false }
  var label = { "" }
  var detail = { "" }
  var glyphName = { "" }
  var importance = ItemImportance.MEDIUM.value

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
  override fun getExportedType() = 1
  var keyCommand: KeyCommand? = null

  override fun serialize() = super.serialize().apply {

    putString("actionId", actionId)

    putBundle("keyCommand", keyCommand?.let { keyCommand ->
      Bundle().apply {
        putString("input", keyCharacterMap.getDisplayLabel(keyCommand.code).toString())
        putInt("modifiers", keyCommand.modifiers)
      }
    })
  }
}

class DevMenuGroup(private val groupName: String) : DevMenuItem() {
  override fun getExportedType() = 2
  private val items: ArrayList<DevMenuItem> = ArrayList()

  fun addItem(item: DevMenuItem) {
    items.add(item)
  }

  override fun serialize() = super.serialize().apply {
    putString("groupName", groupName)
    putParcelableArray("items", items.map { it.serialize() }.toTypedArray())
  }
}



