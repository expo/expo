@file:OptIn(ExperimentalMaterial3ExpressiveApi::class)

package expo.modules.ui

import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.ToggleButtonDefaults
import androidx.compose.runtime.remember
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.viewevent.getValue
import expo.modules.ui.button.ButtonContent
import expo.modules.ui.button.ButtonPressedEvent
import expo.modules.ui.button.ButtonProps
import expo.modules.ui.button.ElevatedButtonContent
import expo.modules.ui.button.FilledTonalButtonContent
import expo.modules.ui.button.OutlinedButtonContent
import expo.modules.ui.button.TextButtonContent
import expo.modules.ui.button.FloatingActionButtonContent
import expo.modules.ui.button.FloatingActionButtonProps
import expo.modules.ui.button.IconButtonContent
import expo.modules.ui.button.FilledIconButtonContent
import expo.modules.ui.button.FilledTonalIconButtonContent
import expo.modules.ui.button.OutlinedIconButtonContent
import expo.modules.ui.icon.IconView
import expo.modules.ui.menu.DropdownMenuContent
import expo.modules.ui.menu.DropdownMenuProps
import expo.modules.ui.menu.DropdownMenuItemContent
import expo.modules.ui.menu.DropdownMenuItemProps
import expo.modules.ui.menu.ItemPressedEvent
import okhttp3.OkHttpClient

class ExpoUIModule : Module() {
  var okHttpClient: OkHttpClient? = null
    private set

  override fun definition() = ModuleDefinition {
    Name("ExpoUI")

    OnCreate {
      okHttpClient = OkHttpClient.Builder().build()
    }

    OnDestroy {
      okHttpClient?.dispatcher?.executorService?.shutdown()
      okHttpClient?.connectionPool?.evictAll()
      okHttpClient?.cache?.close()
      okHttpClient = null
    }

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

    View(ModalBottomSheetView::class) {
      Events("onDismissRequest")
      AsyncFunction("hide") Coroutine { view: ModalBottomSheetView ->
        view.hide()
      }
    }

    ExpoUIView("SingleChoiceSegmentedButtonRowView") { props: SingleChoiceSegmentedButtonRowProps ->
      SingleChoiceSegmentedButtonRowContent(props)
    }

    ExpoUIView("MultiChoiceSegmentedButtonRowView") { props: MultiChoiceSegmentedButtonRowProps ->
      MultiChoiceSegmentedButtonRowContent(props)
    }

    ExpoUIView("SegmentedButtonView", events = {
      Events("onButtonPressed", "onCheckedChange")
    }) { props: SegmentedButtonProps ->
      val onButtonPressed by remember { EventDispatcher<Unit>() }
      val onCheckedChange by remember { EventDispatcher<GenericEventPayload1<Boolean>>() }
      SegmentedButtonContent(props, { onButtonPressed(Unit) }, { onCheckedChange(it) })
    }

    ExpoUIView("SwitchView", events = {
      Events("onCheckedChange")
    }) { props: SwitchProps ->
      val onCheckedChange by remember { EventDispatcher<CheckedChangeEvent>() }
      SwitchContent(props) { value -> onCheckedChange(CheckedChangeEvent(value)) }
    }

    ExpoUIView("CheckboxView", events = {
      Events("onCheckedChange")
    }) { props: CheckboxProps ->
      val onCheckedChange by remember { EventDispatcher<CheckedChangeEvent>() }
      CheckboxContent(props) { value -> onCheckedChange(CheckedChangeEvent(value)) }
    }

    ExpoUIView("TriStateCheckboxView", events = {
      Events("onNativeClick")
    }) { props: TriStateCheckboxProps ->
      val onNativeClick by remember { EventDispatcher<Unit>() }
      TriStateCheckboxContent(props) { onNativeClick(Unit) }
    }

    ExpoUIView("Button", events = {
      Events("onButtonPressed")
    }) { props: ButtonProps ->
      val onButtonPressed by remember { EventDispatcher<ButtonPressedEvent>() }
      ButtonContent(props) { onButtonPressed(it) }
    }

    ExpoUIView("FilledTonalButton", events = {
      Events("onButtonPressed")
    }) { props: ButtonProps ->
      val onButtonPressed by remember { EventDispatcher<ButtonPressedEvent>() }
      FilledTonalButtonContent(props) { onButtonPressed(it) }
    }

    ExpoUIView("OutlinedButton", events = {
      Events("onButtonPressed")
    }) { props: ButtonProps ->
      val onButtonPressed by remember { EventDispatcher<ButtonPressedEvent>() }
      OutlinedButtonContent(props) { onButtonPressed(it) }
    }

    ExpoUIView("ElevatedButton", events = {
      Events("onButtonPressed")
    }) { props: ButtonProps ->
      val onButtonPressed by remember { EventDispatcher<ButtonPressedEvent>() }
      ElevatedButtonContent(props) { onButtonPressed(it) }
    }

    ExpoUIView("TextButton", events = {
      Events("onButtonPressed")
    }) { props: ButtonProps ->
      val onButtonPressed by remember { EventDispatcher<ButtonPressedEvent>() }
      TextButtonContent(props) { onButtonPressed(it) }
    }

    ExpoUIView("IconButton", events = {
      Events("onButtonPressed")
    }) { props: ButtonProps ->
      val onButtonPressed by remember { EventDispatcher<ButtonPressedEvent>() }
      IconButtonContent(props) { onButtonPressed(it) }
    }

    ExpoUIView("FilledIconButton", events = {
      Events("onButtonPressed")
    }) { props: ButtonProps ->
      val onButtonPressed by remember { EventDispatcher<ButtonPressedEvent>() }
      FilledIconButtonContent(props) { onButtonPressed(it) }
    }

    ExpoUIView("FilledTonalIconButton", events = {
      Events("onButtonPressed")
    }) { props: ButtonProps ->
      val onButtonPressed by remember { EventDispatcher<ButtonPressedEvent>() }
      FilledTonalIconButtonContent(props) { onButtonPressed(it) }
    }

    ExpoUIView("OutlinedIconButton", events = {
      Events("onButtonPressed")
    }) { props: ButtonProps ->
      val onButtonPressed by remember { EventDispatcher<ButtonPressedEvent>() }
      OutlinedIconButtonContent(props) { onButtonPressed(it) }
    }

    ExpoUIView("SliderView", events = {
      Events("onValueChange", "onValueChangeFinished")
    }) { props: SliderProps ->
      SliderContent(props)
    }

    ExpoUIView("ShapeView") { props: ShapeProps ->
      ShapeContent(props)
    }

    ExpoUIView("HorizontalDividerView") { props: DividerProps ->
      HorizontalDividerContent(props)
    }

    ExpoUIView("VerticalDividerView") { props: DividerProps ->
      VerticalDividerContent(props)
    }

    ExpoUIView("DateTimePickerView", events = {
      Events("onDateSelected")
    }) { props: DateTimePickerProps ->
      val onDateSelected by remember { EventDispatcher<DatePickerResult>() }
      DateTimePickerContent(props) { onDateSelected(it) }
    }

    ExpoUIView("DatePickerDialogView", events = {
      Events("onDateSelected", "onDismissRequest")
    }) { props: DatePickerDialogProps ->
      val onDateSelected by remember { EventDispatcher<DatePickerResult>() }
      val onDismissRequest by remember { EventDispatcher<Unit>() }
      ExpoDatePickerDialogContent(props, { onDateSelected(it) }, { onDismissRequest(Unit) })
    }

    ExpoUIView("TimePickerDialogView", events = {
      Events("onDateSelected", "onDismissRequest")
    }) { props: TimePickerDialogProps ->
      val onDateSelected by remember { EventDispatcher<DatePickerResult>() }
      val onDismissRequest by remember { EventDispatcher<Unit>() }
      ExpoTimePickerDialogContent(props, { onDateSelected(it) }, { onDismissRequest(Unit) })
    }

    ExpoUIView("DropdownMenuView", events = {
      Events("onDismissRequest")
    }) { props: DropdownMenuProps ->
      val onDismissRequest by remember { EventDispatcher<Unit>() }
      DropdownMenuContent(props) { onDismissRequest(Unit) }
    }

    ExpoUIView("DropdownMenuItemView", events = {
      Events("onItemPressed")
    }) { props: DropdownMenuItemProps ->
      val onItemPressed by remember { EventDispatcher<ItemPressedEvent>() }
      DropdownMenuItemContent(props) { onItemPressed(it) }
    }

    ExpoUIView("LinearProgressIndicatorView") { props: LinearProgressIndicatorProps ->
      LinearProgressIndicatorContent(props)
    }

    ExpoUIView("CircularProgressIndicatorView") { props: CircularProgressIndicatorProps ->
      CircularProgressIndicatorContent(props)
    }

    ExpoUIView("LinearWavyProgressIndicatorView") { props: LinearWavyProgressIndicatorProps ->
      LinearWavyProgressIndicatorContent(props)
    }

    ExpoUIView("CircularWavyProgressIndicatorView") { props: CircularWavyProgressIndicatorProps ->
      CircularWavyProgressIndicatorContent(props)
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

    ExpoUIView("HorizontalCenteredHeroCarouselView") { props: HorizontalCenteredHeroCarouselProps ->
      HorizontalCenteredHeroCarouselContent(props)
    }

    ExpoUIView("HorizontalMultiBrowseCarouselView") { props: HorizontalMultiBrowseCarouselProps ->
      HorizontalMultiBrowseCarouselContent(props)
    }

    ExpoUIView("HorizontalUncontainedCarouselView") { props: HorizontalUncontainedCarouselProps ->
      HorizontalUncontainedCarouselContent(props)
    }

    ExpoUIView("AlertDialogView", events = {
      Events("onDismissRequest")
    }) { props: AlertDialogProps ->
      val onDismissRequest by remember { EventDispatcher<Unit>() }
      AlertDialogContent(props) { onDismissRequest(Unit) }
    }

    ExpoUIView("AssistChipView", events = {
      Events("onNativeClick")
    }) { props: AssistChipProps ->
      val onNativeClick by remember { EventDispatcher<ChipPressedEvent>() }
      AssistChipContent(props) { onNativeClick(it) }
    }

    ExpoUIView("InputChipView", events = {
      Events("onNativeClick")
    }) { props: InputChipProps ->
      val onNativeClick by remember { EventDispatcher<ChipPressedEvent>() }
      InputChipContent(props) { onNativeClick(it) }
    }

    ExpoUIView("SuggestionChipView", events = {
      Events("onNativeClick")
    }) { props: SuggestionChipProps ->
      val onNativeClick by remember { EventDispatcher<ChipPressedEvent>() }
      SuggestionChipContent(props) { onNativeClick(it) }
    }

    ExpoUIView("FilterChipView", events = {
      Events("onNativeClick")
    }) { props: FilterChipProps ->
      val onNativeClick by remember { EventDispatcher<ChipPressedEvent>() }
      FilterChipContent(props) { onNativeClick(it) }
    }

    ExpoUIView("ToggleButton", events = {
      Events("onCheckedChange")
    }) { props: ToggleButtonProps ->
      val onCheckedChange by remember { EventDispatcher<ToggleButtonValueChangeEvent>() }
      ToggleButtonContent(props) { onCheckedChange(it) }
    }

    ExpoUIView("IconToggleButton", events = {
      Events("onCheckedChange")
    }) { props: ToggleButtonProps ->
      val onCheckedChange by remember { EventDispatcher<ToggleButtonValueChangeEvent>() }
      IconToggleButtonContent(props) { onCheckedChange(it) }
    }

    ExpoUIView("FilledIconToggleButton", events = {
      Events("onCheckedChange")
    }) { props: ToggleButtonProps ->
      val onCheckedChange by remember { EventDispatcher<ToggleButtonValueChangeEvent>() }
      FilledIconToggleButtonContent(props) { onCheckedChange(it) }
    }

    ExpoUIView("OutlinedIconToggleButton", events = {
      Events("onCheckedChange")
    }) { props: ToggleButtonProps ->
      val onCheckedChange by remember { EventDispatcher<ToggleButtonValueChangeEvent>() }
      OutlinedIconToggleButtonContent(props) { onCheckedChange(it) }
    }

    ExpoUIView("CardView") { props: CardProps ->
      CardContent(props)
    }

    ExpoUIView("ElevatedCardView") { props: ElevatedCardProps ->
      ElevatedCardContent(props)
    }

    ExpoUIView("OutlinedCardView") { props: OutlinedCardProps ->
      OutlinedCardContent(props)
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

    ExpoUIView("SurfaceView", events = {
      Events("onSurfaceClick", "onCheckedChange")
    }) { props: SurfaceProps ->
      val onSurfaceClick by remember { EventDispatcher<Unit>() }
      val onCheckedChange by remember { EventDispatcher<GenericEventPayload1<Boolean>>() }
      SurfaceContent(props, onClick = { onSurfaceClick(Unit) }, onCheckedChange = { onCheckedChange(GenericEventPayload1(it)) })
    }

    ExpoUIView("AnimatedVisibilityView") { props: AnimatedVisibilityProps ->
      AnimatedVisibilityContent(props)
    }

    ExpoUIView("RadioButtonView", events = {
      Events("onButtonPressed")
    }) { props: RadioButtonProps ->
      val onButtonPressed by remember { EventDispatcher<Unit>() }
      val clickHandler = if (props.clickable) { { onButtonPressed(Unit) } } else null
      RadioButtonContent(props, clickHandler)
    }

    ExpoUIView("FloatingActionButtonView", events = {
      Events("onButtonPressed")
    }) { props: FloatingActionButtonProps ->
      val onButtonPressed by remember { EventDispatcher<Unit>() }
      FloatingActionButtonContent(props) { onButtonPressed(Unit) }
    }

    //endregion Expo UI views
  }
}
