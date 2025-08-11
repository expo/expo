package expo.modules.ui

import android.graphics.Color
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Outline
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.zIndex
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.ui.button.Button
import expo.modules.ui.menu.ContextMenu
import kotlin.collections.emptyMap

class ExpoUIModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoUI")

    Class("ExpoModifier", ExpoModifier::class) {
      Constructor {
        // Create an instance of ExpoModifier with a null reference
        ExpoModifier(null)
      }

      Function("toString") { ref: ExpoModifier ->
        // Return a string representation of the modifier
        "ExpoModifier(ref=${ref.ref})"
      }
    }

    // Defines a single view for now – a single choice segmented control
    View(PickerView::class) {
      Events("onOptionSelected")
    }

    View(SwitchView::class) {
      Events("onValueChange")
    }

    View(Button::class) {
      Events("onButtonPressed")
    }

    View(SliderView::class) {
      Events("onValueChanged")
    }

    View(ShapeView::class)

    View(DateTimePickerView::class) {
      Events("onDateSelected")
    }

    View(ContextMenu::class) {
      Events(
        "onContextMenuButtonPressed",
        "onContextMenuPickerOptionSelected",
        "onContextMenuSwitchValueChanged",
        "onExpandedChanged"
      )
    }

    View(ProgressView::class)

    View(TextInputView::class) {
      Events("onValueChanged")
      Prop("defaultValue", "") { view: TextInputView, text: String ->
        if (view.text == null) {
          view.text = text
        }
      }
      AsyncFunction("setText") { view: TextInputView, text: String ->
        view.text = text
      }
    }

    View(RowView::class)
    View(ColumnView::class)
    View(ContainerView::class)
    View(TextView::class)

    View(AlertDialogView::class) {
      Events(
        "onDismissPressed",
        "onConfirmPressed"
      )
    }

    Function("padding") { all: Int ->
      return@Function ExpoModifier(Modifier.padding(Dp(all.toFloat())))
    }

    Function("size") { width: Int, height: Int ->
      return@Function ExpoModifier(Modifier.size(width.dp, height.dp))
    }

    Function("fillMaxSize") {
      return@Function ExpoModifier(Modifier.fillMaxSize())
    }

    Function("offset") { x: Int, y: Int ->
      return@Function ExpoModifier(Modifier.offset(x.dp, y.dp))
    }

    Function("background") { color: Color ->
      return@Function ExpoModifier(Modifier.background(color.compose))
    }

    Function("border") { borderWidth: Int, borderColor: Color ->
      return@Function ExpoModifier(Modifier.border(BorderStroke(borderWidth.dp, borderColor.compose)))
    }

    Function("shadow") { elevation: Int ->
      return@Function ExpoModifier(Modifier.shadow(elevation.dp )) // todo more options
    }

    Function("alpha") { alpha: Float ->
      return@Function ExpoModifier(Modifier.alpha(alpha))
    }

    Function("blur") { radius: Int ->
      return@Function ExpoModifier(Modifier.blur(radius.dp))
    }



//    Function("clip") { shape: Shape ->
//      return@Function ExpoModifier(Modifier.clip(shape))
//    }

    Function("clickable") {
      class ClickListener {
        var onClick: (() -> Unit)? = null
      }

      val clickListener = ClickListener()

      val modifier = ExpoModifier(Modifier.clickable(
        onClick = {
          clickListener.onClick?.invoke()
        }
      ))

      clickListener.onClick = { modifier.emit("onClick") }

      return@Function modifier
  }

//    Function("enabled") { isEnabled: Boolean ->
//      return@Function ExpoModifier(if (isEnabled) Modifier else Modifier.disabled())
//    }
//
//    Function("draggable") { state: DraggableState, orientation: Orientation ->
//      return@Function ExpoModifier(Modifier.draggable())
//    }
//
//    Function("graphicsLayer") {
//      return@Function ExpoModifier(Modifier.graphicsLayer())
//    }

    Function("rotate") { degrees: Float ->
      return@Function ExpoModifier(Modifier.rotate(degrees))
    }

//    Function("semantics") { drawBehind drawWithContent

//    Function("layoutId") { id: String ->
//      return@Function ExpoModifier(Modifier.layoutId(id))
//    }

    Function("zIndex") { index: Float ->
      return@Function ExpoModifier(Modifier.zIndex(index))
    }

//    Function("navigationBarsPadding") {
//      return@Function ExpoModifier(Modifier.navigationBarsPadding())
//    }
//
//    Function("systemBarsPadding") {
//      return@Function ExpoModifier(Modifier.systemBarsPadding())
//    }
  }
}
