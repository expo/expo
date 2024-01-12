package expo.interfaces.devmenu.items

/**
 * Tells how important the dev menu item is. To use it with [DevMenuItem], you need to pass its [value].
 */
enum class DevMenuItemImportance(val value: Int) {
  LOWEST(-200),
  LOW(-100),
  MEDIUM(0),
  HIGH(100),
  HIGHEST(200)
}
