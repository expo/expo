package expo.modules.ui.menu

import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.views.ComposeProps
import expo.modules.ui.button.ButtonVariant
import expo.modules.kotlin.records.Record
import expo.modules.ui.CheckedChangedEvent
import expo.modules.ui.button.ButtonPressedEvent
import java.io.Serializable

data class Submenu(
  @Field val elements: Array<MenuElement> = emptyArray(),
  @Field val button: ContextMenuButtonProps
) : Record, Serializable

data class MenuElement(
  @Field var button: ContextMenuButtonProps? = null,
  @Field var switch: ContextMenuSwitchProps? = null,
  @Field var submenu: Submenu? = null,
  @Field var contextMenuElementID: String
) : Record, Serializable

data class MenuProps(
  val text: MutableState<String> = mutableStateOf(""),
  var expanded: MutableState<Boolean> = mutableStateOf(true),
  var subMenuExpanded: MutableState<Boolean> = mutableStateOf(true),
  val elements: MutableState<Array<MenuElement>> = mutableStateOf(emptyArray())
) : ComposeProps

class ContextMenuButtonProps(
  @Field val text: String = "",
  @Field val variant: ButtonVariant? = ButtonVariant.DEFAULT
) : Record, Serializable

class ContextMenuSwitchProps(
  @Field val checked: Boolean = false,
  @Field val label: String = "",
  @Field var variant: String = ""
) : Record, Serializable

open class ContextMenuButtonPressedEvent(
  @Field val contextMenuElementID: String
) : ButtonPressedEvent()

class ContextMenuSwitchCheckedChangedEvent(
  @Field override val checked: Boolean = false,
  @Field val contextMenuElementID: String
) : CheckedChangedEvent()

class ContextMenuExpandedChangedEvent(
  @Field val expanded: Boolean = false
) : Record, Serializable
