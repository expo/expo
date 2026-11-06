package expo.modules.ui.menu

import android.graphics.Color
import androidx.compose.material3.MenuAnchorPosition
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

enum class DropdownMenuAnchorPosition(val value: String) : Enumerable {
  BELOW("below"),
  ABOVE("above"),
  START("start"),
  END("end"),
  LEFT("left"),
  RIGHT("right");

  fun toComposeAnchorPosition(): MenuAnchorPosition =
    when (this) {
      BELOW -> MenuAnchorPosition.Below
      ABOVE -> MenuAnchorPosition.Above
      START -> MenuAnchorPosition.Start
      END -> MenuAnchorPosition.End
      LEFT -> MenuAnchorPosition.Left
      RIGHT -> MenuAnchorPosition.Right
    }
}

@OptimizedRecord
data class MenuShapePosition(
  @Field val index: Int = 0,
  @Field val count: Int = 1
) : Record

@OptimizedComposeProps
data class DropdownMenuPopupProps(
  val expanded: Boolean = false,
  val anchorPosition: DropdownMenuAnchorPosition = DropdownMenuAnchorPosition.BELOW,
  val modifiers: ModifierList = emptyList(),
  val properties: ExpoPopupProperties = ExpoPopupProperties()
) : ComposeProps
