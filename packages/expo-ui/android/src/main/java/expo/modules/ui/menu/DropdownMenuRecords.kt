package expo.modules.ui.menu

import android.graphics.Color
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.ui.ModifierList

enum class ActivationMethod(val value: String) : Enumerable {
  SINGLE_PRESS("singlePress"),
  LONG_PRESS("longPress")
}

data class DropdownMenuProps(
  val activationMethod: ActivationMethod = ActivationMethod.SINGLE_PRESS,
  val expanded: Boolean = false,
  val color: Color? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps
