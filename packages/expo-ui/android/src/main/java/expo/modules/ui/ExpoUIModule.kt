package expo.modules.ui

import android.graphics.Color
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.zIndex
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.viewevent.getValue
import expo.modules.ui.button.Button
import expo.modules.ui.button.IconButton
import expo.modules.ui.icon.IconView
import expo.modules.ui.menu.ContextMenu

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

    View("BottomSheetView", events = {
      Events("onIsOpenedChange")
    }) { props: BottomSheetProps ->
      val onIsOpenedChange by remember { EventDispatcher<IsOpenedChangeEvent>() }
      BottomSheetContent(props) { onIsOpenedChange(it) }
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

    View(IconButton::class) {
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

    View(SearchBarView::class)
//      Events("onValueChanged")
//      Prop("defaultValue", "") { view: SearchBarView, text: String ->
//        if (view.text == null) {
//          view.text = text
//        }
//      }
//      AsyncFunction("setText") { view: SearchBarView, text: String ->
//        view.text = text
//      }
//    }
    View(HorizontalFloatingToolbarView::class)
    View(SlotView::class) {
      Events("onSlotEvent")
    }
    View(IconView::class)

    View(BoxView::class)
    View(RowView::class)
    View(ColumnView::class)
    View(HostView::class) {
      Events("onLayoutContent")

      OnViewDidUpdateProps { view ->
        view.onViewDidUpdateProps()
      }
    }
    View(TextView::class)
    View(CarouselView::class)

    View(AlertDialogView::class) {
      Events(
        "onDismissPressed",
        "onConfirmPressed"
      )
    }

    View(ChipView::class) {
      Events(
        "onPress",
        "onDismiss"
      )
    }

    Function("paddingAll") { all: Int ->
      return@Function ExpoModifier(Modifier.padding(all.dp))
    }

    Function("padding") { start: Int, top: Int, end: Int, bottom: Int ->
      return@Function ExpoModifier(Modifier.padding(start.dp, top.dp, end.dp, bottom.dp))
    }

    Function("size") { width: Int, height: Int ->
      return@Function ExpoModifier(Modifier.size(width.dp, height.dp))
    }

    Function("fillMaxSize") { fraction: Float? ->
      return@Function ExpoModifier(Modifier.fillMaxSize(fraction = fraction ?: 1.0f))
    }

    Function("fillMaxWidth") { fraction: Float? ->
      return@Function ExpoModifier(Modifier.fillMaxWidth(fraction = fraction ?: 1.0f))
    }

    Function("fillMaxHeight") { fraction: Float? ->
      return@Function ExpoModifier(Modifier.fillMaxHeight(fraction = fraction ?: 1.0f))
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
      return@Function ExpoModifier(Modifier.shadow(elevation.dp)) // TODO: Support more options
    }

    Function("alpha") { alpha: Float ->
      return@Function ExpoModifier(Modifier.alpha(alpha))
    }

    Function("blur") { radius: Int ->
      return@Function ExpoModifier(Modifier.blur(radius.dp))
    }

    Function("clickable") { callback: JavaScriptFunction<Any?> ->
      return@Function ExpoModifier(
        Modifier.clickable(
          onClick = {
            appContext.executeOnJavaScriptThread {
              callback.invoke()
            }
          }
        )
      )
    }

    Function("rotate") { degrees: Float ->
      return@Function ExpoModifier(Modifier.rotate(degrees))
    }

    Function("zIndex") { index: Float ->
      return@Function ExpoModifier(Modifier.zIndex(index))
    }

    Function("animateContentSize") { dampingRatio: Float?, stiffness: Float? ->
      return@Function ExpoModifier(
        Modifier.animateContentSize(
          spring(dampingRatio = dampingRatio ?: Spring.DampingRatioNoBouncy, stiffness = stiffness ?: Spring.StiffnessMedium)
        )
      )
    }

    Function("weight") { weight: Float ->
      val scopedExpoModifier = ExpoModifier {
        it.rowScope?.run {
          Modifier.weight(weight)
        } ?: it.columnScope?.run {
          Modifier.weight(weight)
        } ?: Modifier
      }
      return@Function scopedExpoModifier
    }

    Function("align") { alignmentType: AlignmentType ->
      val scopedExpoModifier = ExpoModifier {
        it.boxScope?.run {
          alignmentType.toAlignment()?.let { alignment -> Modifier.align(alignment) }
        } ?: it.rowScope?.run {
          alignmentType.toVerticalAlignment()?.let { alignment -> Modifier.align(alignment) }
        } ?:it.columnScope?.run {
          alignmentType.toHorizontalAlignment()?.let { alignment -> Modifier.align(alignment) }
        } ?: Modifier
      }
      return@Function scopedExpoModifier
    }

    Function("matchParentSize") {
      val scopedExpoModifier = ExpoModifier {
        it.boxScope?.run {
          Modifier.matchParentSize()
        } ?: Modifier
      }
      return@Function scopedExpoModifier
    }

    Function("testID") { testID: String ->
      return@Function ExpoModifier(Modifier.applyTestTag(testID))
    }

    Function("clip") { shapeRecord: ShapeRecord ->
      val shape = shapeFromShapeRecord(shapeRecord)
        ?: return@Function Modifier
      return@Function ExpoModifier(Modifier.clip(shape))
    }

    // TODO: Consider implementing semantics, layoutId, clip, navigationBarsPadding, systemBarsPadding
  }
}

enum class AlignmentType(val value: String) : Enumerable {
  TOP_START("topStart"),
  TOP_CENTER("topCenter"),
  TOP_END("topEnd"),
  CENTER_START("centerStart"),
  CENTER("center"),
  CENTER_END("centerEnd"),
  BOTTOM_START("bottomStart"),
  BOTTOM_CENTER("bottomCenter"),
  BOTTOM_END("bottomEnd"),
  TOP("top"),
  CENTER_VERTICALLY("centerVertically"),
  BOTTOM("bottom"),
  START("start"),
  CENTER_HORIZONTALLY("centerHorizontally"),
  END("end");

  fun toAlignment(): Alignment? {
    return when (this) {
      TOP_START -> Alignment.TopStart
      TOP_CENTER -> Alignment.TopCenter
      TOP_END -> Alignment.TopEnd
      CENTER_START -> Alignment.CenterStart
      CENTER -> Alignment.Center
      CENTER_END -> Alignment.CenterEnd
      BOTTOM_START -> Alignment.BottomStart
      BOTTOM_CENTER -> Alignment.BottomCenter
      BOTTOM_END -> Alignment.BottomEnd
      else -> null
    }
  }

  fun toVerticalAlignment(): Alignment.Vertical? {
    return when (this) {
      TOP -> Alignment.Top
      CENTER_VERTICALLY -> Alignment.CenterVertically
      BOTTOM -> Alignment.Bottom
      else -> null
    }
  }

  fun toHorizontalAlignment(): Alignment.Horizontal? {
    return when (this) {
      START -> Alignment.Start
      CENTER_HORIZONTALLY -> Alignment.CenterHorizontally
      END -> Alignment.End
      else -> null
    }
  }
}
