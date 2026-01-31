@file:OptIn(ExperimentalMaterial3ExpressiveApi::class)

package expo.modules.ui

import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.ToggleButtonDefaults
import androidx.compose.runtime.remember
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.viewevent.getValue
import expo.modules.ui.button.ButtonContent
import expo.modules.ui.button.ButtonPressedEvent
import expo.modules.ui.button.ButtonProps
import expo.modules.ui.button.IconButtonContent
import expo.modules.ui.button.IconButtonProps
import expo.modules.ui.icon.IconView
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

    Constant("SwitchDefaultIconSize") {
      return@Constant SwitchDefaults.IconSize.value
    }
    Constant("ToggleButtonIconSpacing") {
      return@Constant ToggleButtonDefaults.IconSpacing.value
    }
    Constant("ToggleButtonIconSize") {
      return@Constant ToggleButtonDefaults.IconSize.value
    }

    View(RNHostView::class)

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

    View(SlotView::class) {
      Events("onSlotEvent")
    }
    View(IconView::class)
    View(LazyColumnView::class)

    //endregion Views use expo-modules-core DSL for uncommon features

    //region Expo UI views

    ExpoUIView("ModalBottomSheetView", events = {
      Events("onDismissRequest")
    }) { props: ModalBottomSheetProps ->
      val onDismissRequest by remember { EventDispatcher<Unit>() }
      ModalBottomSheetContent(props) { onDismissRequest(Unit) }
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

    ExpoUIView("BoxView") { props: LayoutProps ->
      BoxContent(props)
    }

    ExpoUIView("RowView") { props: LayoutProps ->
      RowContent(props)
    }

    ExpoUIView("FlowRowView") { props: LayoutProps ->
      FlowRowContent(props)
    }

    ExpoUIView("ColumnView") { props: LayoutProps ->
      ColumnContent(props)
    }

    ExpoUIView("TextView") { props: TextProps ->
      TextContent(props)
    }

    ExpoUIView("SearchBarView", events = {
      Events("onSearch")
    }) { props: SearchBarProps ->
      val onSearch by remember { EventDispatcher<GenericEventPayload1<String>>() }
      SearchBarContent(props) { onSearch(it) }
    }

    ExpoUIView("DockedSearchBarView", events = {
      Events("onQueryChange")
    }) { props: DockedSearchBarProps ->
      val onQueryChange by remember { EventDispatcher<GenericEventPayload1<String>>() }
      DockedSearchBarContent(props) { onQueryChange(it) }
    }

    ExpoUIView("HorizontalFloatingToolbarView") { props: HorizontalFloatingToolbarProps ->
      HorizontalFloatingToolbarContent(props)
    }

    ExpoUIView("PullToRefreshBoxView", events = {
      Events("onRefresh")
    }) { props: PullToRefreshBoxProps ->
      val onRefresh by remember { EventDispatcher<Unit>() }
      PullToRefreshBoxContent(props) { onRefresh(Unit) }
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

    ExpoUIView("FilterChipView", events = {
      Events("onPress")
    }) { props: FilterChipProps ->
      val onPress by remember { EventDispatcher<FilterChipPressedEvent>() }
      FilterChipContent(props) { onPress(it) }
    }

    ExpoUIView("TextButtonView", events = {
      Events("onButtonPressed")
    }) { props: TextButtonProps ->
      val onButtonPressed by remember { EventDispatcher<expo.modules.ui.button.ButtonPressedEvent>() }
      TextButtonContent(props) { onButtonPressed(it) }
    }

    ExpoUIView("ToggleButtonView", events = {
      Events("onCheckedChange")
    }) { props: ToggleButtonProps ->
      val onCheckedChange by remember { EventDispatcher<ToggleButtonValueChangeEvent>() }
      ToggleButtonContent(props) { onCheckedChange(it) }
    }

    ExpoUIView("CardView") { props: CardProps ->
      CardContent(props)
    }

    ExpoUIView("ListItemView") { props: ListItemProps ->
      ListItemContent(props)
    }

    ExpoUIView("SpacerView") { props: SpacerProps ->
      SpacerContent(props)
    }

    ExpoUIView("BasicAlertDialogView", events = {
      Events("onDismissRequest")
    }) { props: BasicAlertDialogProps ->
      val onDismissRequest by remember { EventDispatcher<Unit>() }
      BasicAlertDialogContent(props) { onDismissRequest(Unit) }
    }

    ExpoUIView("SurfaceView") { props: SurfaceProps ->
      SurfaceContent(props)
    }

    ExpoUIView("RadioButtonView", events = {
      Events("onNativeClick")
    }) { props: RadioButtonProps ->
      val onNativeClick by remember { EventDispatcher<Unit>() }
      RadioButtonContent(props) { onNativeClick(Unit) }
    }

    //endregion Expo UI views
  }
}
