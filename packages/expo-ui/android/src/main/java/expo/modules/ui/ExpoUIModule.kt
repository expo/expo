package expo.modules.ui

import androidx.compose.runtime.remember
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.viewevent.getValue
import expo.modules.ui.button.ButtonContent
import expo.modules.ui.button.ButtonPressedEvent
import expo.modules.ui.button.ButtonProps
import expo.modules.ui.button.IconButtonContent
import expo.modules.ui.button.IconButtonProps
import expo.modules.ui.menu.ContextMenuButtonPressedEvent
import expo.modules.ui.menu.ContextMenuContent
import expo.modules.ui.menu.ContextMenuProps
import expo.modules.ui.menu.ContextMenuSwitchValueChangeEvent
import expo.modules.ui.menu.ExpandedChangedEvent

class ExpoUIModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoUI")

    //region Views use expo-modules-core DSL for uncommon features

    View(HostView::class) {
      Events("onLayoutContent")

      OnViewDidUpdateProps { view ->
        view.onViewDidUpdateProps()
      }
    }

    //endregion Views use expo-modules-core DSL for uncommon features

    //region Expo UI views

    ExpoUIView("BottomSheetView", events = {
      Events("onIsOpenedChange")
    }) { props: BottomSheetProps ->
      val onIsOpenedChange by remember { EventDispatcher<IsOpenedChangeEvent>() }
      BottomSheetContent(props) { onIsOpenedChange(it) }
    }

    // Defines a single view for now – a single choice segmented control
    ExpoUIView("PickerView", events = {
      Events("onOptionSelected")
    }) { props: PickerProps ->
      val onOptionSelected by remember { EventDispatcher<PickerOptionSelectedEvent>() }
      PickerContent(props) { onOptionSelected(it) }
    }

    ExpoUIView("SwitchView", events = {
      Events("onValueChange")
    }) { props: SwitchProps ->
      val onValueChange by remember { EventDispatcher<ValueChangeEvent>() }
      SwitchContent(props) { onValueChange(it) }
    }

    ExpoUIView("Button", events = {
      Events("onButtonPressed")
    }) { props: ButtonProps ->
      val onButtonPressed by remember { EventDispatcher<ButtonPressedEvent>() }
      ButtonContent(props) { onButtonPressed(it) }
    }

    ExpoUIView("IconButton", events = {
      Events("onButtonPressed")
    }) { props: IconButtonProps ->
      val onButtonPressed by remember { EventDispatcher<ButtonPressedEvent>() }
      IconButtonContent(props) { onButtonPressed(it) }
    }

    ExpoUIView("SliderView", events = {
      Events("onValueChanged")
    }) { props: SliderProps ->
      SliderContent(props)
    }

    ExpoUIView("ShapeView") { props: ShapeProps ->
      ShapeContent(props)
    }

    ExpoUIView("DividerView") { props: DividerProps ->
      DividerContent(props)
    }

    ExpoUIView("DateTimePickerView", events = {
      Events("onDateSelected")
    }) { props: DateTimePickerProps ->
      val onDateSelected by remember { EventDispatcher<DatePickerResult>() }
      DateTimePickerContent(props) { onDateSelected(it) }
    }

    ExpoUIView("ContextMenuView", events = {
      Events(
        "onContextMenuButtonPressed",
        "onContextMenuSwitchValueChanged",
        "onExpandedChanged"
      )
    }) { props: ContextMenuProps ->
      val onContextMenuButtonPressed by remember { EventDispatcher<ContextMenuButtonPressedEvent>() }
      val onContextMenuSwitchValueChanged by remember { EventDispatcher<ContextMenuSwitchValueChangeEvent>() }
      val onExpandedChanged by remember { EventDispatcher<ExpandedChangedEvent>() }
      ContextMenuContent(
        props,
        { onContextMenuButtonPressed(it) },
        { onContextMenuSwitchValueChanged(it) },
        { onExpandedChanged(it) }
      )
    }

    ExpoUIView("ProgressView") { props: ProgressProps ->
      ProgressContent(props)
    }

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

    ExpoUIView("BoxView") { props: LayoutProps ->
      BoxContent(props)
    }

    ExpoUIView("RowView") { props: LayoutProps ->
      RowContent(props)
    }

    ExpoUIView("ColumnView") { props: LayoutProps ->
      ColumnContent(props)
    }

    ExpoUIView("TextView") { props: TextProps ->
      TextContent(props)
    }

    ExpoUIView("CarouselView") { props: CarouselProps ->
      CarouselContent(props)
    }

    ExpoUIView("AlertDialogView", events = {
      Events(
        "onDismissPressed",
        "onConfirmPressed"
      )
    }) { props: AlertDialogProps ->
      val onDismissPressed by remember { EventDispatcher<AlertDialogButtonPressedEvent>() }
      val onConfirmPressed by remember { EventDispatcher<AlertDialogButtonPressedEvent>() }
      AlertDialogContent(
        props,
        { onDismissPressed(it) },
        { onConfirmPressed(it) }
      )
    }

    ExpoUIView("ChipView", events = {
      Events(
        "onPress",
        "onDismiss"
      )
    }) { props: ChipProps ->
      val onPress by remember { EventDispatcher<ChipPressedEvent>() }
      val onDismiss by remember { EventDispatcher<ChipPressedEvent>() }
      ChipContent(props, { onPress(it) }, { onDismiss(it) })
    }

    //endregion Expo UI views
  }
}
