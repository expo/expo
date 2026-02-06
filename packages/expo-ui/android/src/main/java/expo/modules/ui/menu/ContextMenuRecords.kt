package expo.modules.ui.menu

import android.graphics.Color
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.ui.ModifierList
import expo.modules.ui.SwitchColors
import expo.modules.ui.ValueChangeEvent
import expo.modules.ui.button.ButtonColors
import expo.modules.ui.button.ButtonPressedEvent
import expo.modules.ui.button.ButtonVariant
import java.io.Serializable

enum class ActivationMethod(val value: String) : Enumerable {
  SINGLE_PRESS("singlePress"),
  LONG_PRESS("longPress")
}

data class Submenu(
  @Field val elements: Array<ContextMenuElement> = emptyArray(),
  @Field val button: ContextMenuButtonProps
) : Record, Serializable

data class ContextMenuElement(
  @Field var button: ContextMenuButtonProps? = null,
  @Field var switch: ContextMenuSwitchProps? = null,
  @Field var submenu: Submenu? = null,
  @Field var contextMenuElementID: String
) : Record, Serializable

data class ContextMenuProps(
  val text: String = "",
  val elements: Array<ContextMenuElement> = emptyArray(),
  val activationMethod: ActivationMethod = ActivationMethod.SINGLE_PRESS,
  val color: Color? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

class ContextMenuButtonProps(
  @Field val text: String = "",
  @Field val variant: ButtonVariant? = ButtonVariant.DEFAULT,
  @Field val elementColors: ButtonColors = ButtonColors(),
  @Field val leadingIcon: String? = null,
  @Field val trailingIcon: String? = null,
  @Field val disabled: Boolean = false
) : Record, Serializable

class ContextMenuSwitchProps(
  @Field val value: Boolean = false,
  @Field val label: String = "",
  @Field var variant: String = "",
  @Field var elementColors: SwitchColors = SwitchColors()
) : Record, Serializable

open class ContextMenuButtonPressedEvent(
  @Field val contextMenuElementID: String
) : ButtonPressedEvent()

class ContextMenuSwitchValueChangeEvent(
  @Field override val value: Boolean = false,
  @Field val contextMenuElementID: String
) : ValueChangeEvent()
