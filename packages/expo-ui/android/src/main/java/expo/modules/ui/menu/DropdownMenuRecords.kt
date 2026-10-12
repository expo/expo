package expo.modules.ui.menu

import android.graphics.Color
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.ComposeProps
import expo.modules.ui.ModifierList
import expo.modules.kotlin.views.OptimizedComposeProps

enum class ActivationMethod(val value: String) : Enumerable {
  SINGLE_PRESS("singlePress"),
  LONG_PRESS("longPress")
}

@OptimizedRecord
data class ExpoPopupProperties(
  @Field val focusable: Boolean = true,
  @Field val dismissOnBackPress: Boolean = true,
  @Field val dismissOnClickOutside: Boolean = true,
  @Field val clippingEnabled: Boolean = true
) : Record

@OptimizedComposeProps
data class DropdownMenuProps(
  val activationMethod: ActivationMethod = ActivationMethod.SINGLE_PRESS,
  val expanded: Boolean = false,
  val color: Color? = null,
  val cornerRadius: Float? = null,
  val modifiers: ModifierList = emptyList(),
  val shadowElevation: Float? = null,
  val properties: ExpoPopupProperties = ExpoPopupProperties()
) : ComposeProps
