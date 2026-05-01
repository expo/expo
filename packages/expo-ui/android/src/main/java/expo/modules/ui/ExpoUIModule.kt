@file:OptIn(ExperimentalMaterial3ExpressiveApi::class)

package expo.modules.ui

import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.ToggleButtonDefaults
import androidx.compose.ui.graphics.toArgb
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.ui.colors.MaterialColorsOptions
import expo.modules.ui.colors.isDynamicColorSupported
import expo.modules.ui.colors.isSystemInDarkTheme
import expo.modules.ui.colors.seedColorScheme
import expo.modules.ui.colors.toTokenMap
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
import expo.modules.kotlin.jni.worklets.Worklet
import expo.modules.ui.state.ObservableState
import expo.modules.ui.state.WorkletCallback
import expo.modules.ui.menu.ExposedDropdownMenuBoxContent
import expo.modules.ui.menu.ExposedDropdownMenuBoxProps
import expo.modules.ui.menu.ExposedDropdownMenuContent
import expo.modules.ui.menu.ExposedDropdownMenuProps
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

    // MARK: - Observable State

    Class(WorkletCallback::class) {
      Constructor { worklet: Worklet ->
        val callback = WorkletCallback()
        callback.worklet = worklet
        callback
      }
    }

    Class(ObservableState::class) {
      Constructor { initial: Map<String, Any?> ->
        ObservableState(initial["value"])
      }

      Function("getValue") { state: ObservableState ->
        state.value
      }

      Function("setValue") { state: ObservableState, wrapper: Map<String, Any?> ->
        state.value = wrapper["value"]
      }
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

    Constant("isDynamicColorAvailable") {
      return@Constant isDynamicColorSupported
    }

    Function("getMaterialColors") { options: MaterialColorsOptions? ->
      val context = appContext.currentActivity
        ?: appContext.reactContext
        ?: throw Exceptions.ReactContextLost()
      val resolvedScheme = options?.scheme
        ?: if (context.isSystemInDarkTheme()) ExpoColorScheme.DARK else ExpoColorScheme.LIGHT
      val isDark = resolvedScheme == ExpoColorScheme.DARK
      val seedArgb = options?.seedColor?.composeOrNull?.toArgb()
      val colorScheme = if (seedArgb != null) {
        seedColorScheme(seedArgb, isDark)
      } else {
        resolvedScheme.toColorScheme(context)
      }
      colorScheme.toTokenMap()
    }

    View(RNHostView::class)

    View(SlotView::class) {
      Events("onSlotEvent")
    }
    View(IconView::class)
    View(LazyColumnView::class)
    View(LazyRowView::class)

    // Class-based views so TooltipBoxView can detect them by type via findChildOfType
    View(PlainTooltipView::class)
    View(RichTooltipView::class)

    //endregion Views use expo-modules-core DSL for uncommon features

    //region Expo UI views

    ExpoUIView<ModalBottomSheetViewProps>("ModalBottomSheetView") {
      val hide by AsyncFunction()
      val expand by AsyncFunction()
      val partialExpand by AsyncFunction()
      val onDismissRequest by Event<Unit>()

      Content { props ->
        ModalBottomSheetContent(props, hide, expand, partialExpand) { onDismissRequest(Unit) }
      }
    }

    ExpoUIView<SingleChoiceSegmentedButtonRowProps>("SingleChoiceSegmentedButtonRowView") {
      Content { props ->
        SingleChoiceSegmentedButtonRowContent(props)
      }
    }

    ExpoUIView<MultiChoiceSegmentedButtonRowProps>("MultiChoiceSegmentedButtonRowView") {
      Content { props ->
        MultiChoiceSegmentedButtonRowContent(props)
      }
    }

    ExpoUIView<SegmentedButtonProps>("SegmentedButtonView") {
      val onButtonPressed by Event<Unit>()
      val onCheckedChange by Event<GenericEventPayload1<Boolean>>()

      Content { props ->
        SegmentedButtonContent(props, { onButtonPressed(Unit) }, { onCheckedChange(it) })
      }
    }

    ExpoUIView<SwitchProps>("SwitchView") {
      val onCheckedChange by Event<CheckedChangeEvent>()

      Content { props ->
        SwitchContent(props) { value -> onCheckedChange(CheckedChangeEvent(value)) }
      }
    }

    ExpoUIView<CheckboxProps>("CheckboxView") {
      val onCheckedChange by Event<CheckedChangeEvent>()

      Content { props ->
        CheckboxContent(props) { value -> onCheckedChange(CheckedChangeEvent(value)) }
      }
    }

    ExpoUIView<TriStateCheckboxProps>("TriStateCheckboxView") {
      val onNativeClick by Event<Unit>()

      Content { props ->
        TriStateCheckboxContent(props) { onNativeClick(Unit) }
      }
    }

    ExpoUIView<ButtonProps>("Button") {
      val onButtonPressed by Event<ButtonPressedEvent>()

      Content { props ->
        ButtonContent(props) { onButtonPressed(it) }
      }
    }

    ExpoUIView<ButtonProps>("FilledTonalButton") {
      val onButtonPressed by Event<ButtonPressedEvent>()

      Content { props ->
        FilledTonalButtonContent(props) { onButtonPressed(it) }
      }
    }

    ExpoUIView<ButtonProps>("OutlinedButton") {
      val onButtonPressed by Event<ButtonPressedEvent>()

      Content { props ->
        OutlinedButtonContent(props) { onButtonPressed(it) }
      }
    }

    ExpoUIView<ButtonProps>("ElevatedButton") {
      val onButtonPressed by Event<ButtonPressedEvent>()

      Content { props ->
        ElevatedButtonContent(props) { onButtonPressed(it) }
      }
    }

    ExpoUIView<ButtonProps>("TextButton") {
      val onButtonPressed by Event<ButtonPressedEvent>()

      Content { props ->
        TextButtonContent(props) { onButtonPressed(it) }
      }
    }

    ExpoUIView<ButtonProps>("IconButton") {
      val onButtonPressed by Event<ButtonPressedEvent>()

      Content { props ->
        IconButtonContent(props) { onButtonPressed(it) }
      }
    }

    ExpoUIView<ButtonProps>("FilledIconButton") {
      val onButtonPressed by Event<ButtonPressedEvent>()

      Content { props ->
        FilledIconButtonContent(props) { onButtonPressed(it) }
      }
    }

    ExpoUIView<ButtonProps>("FilledTonalIconButton") {
      val onButtonPressed by Event<ButtonPressedEvent>()

      Content { props ->
        FilledTonalIconButtonContent(props) { onButtonPressed(it) }
      }
    }

    ExpoUIView<ButtonProps>("OutlinedIconButton") {
      val onButtonPressed by Event<ButtonPressedEvent>()

      Content { props ->
        OutlinedIconButtonContent(props) { onButtonPressed(it) }
      }
    }

    ExpoUIView<SliderProps>("SliderView") {
      Events("onValueChange", "onValueChangeFinished")

      Content { props ->
        SliderContent(props)
      }
    }

    ExpoUIView<ShapeProps>("ShapeView") {
      Content { props ->
        ShapeContent(props)
      }
    }

    ExpoUIView<DividerProps>("HorizontalDividerView") {
      Content { props ->
        HorizontalDividerContent(props)
      }
    }

    ExpoUIView<DividerProps>("VerticalDividerView") {
      Content { props ->
        VerticalDividerContent(props)
      }
    }

    ExpoUIView<DateTimePickerProps>("DateTimePickerView") {
      val onDateSelected by Event<DatePickerResult>()

      Content { props ->
        DateTimePickerContent(props) { onDateSelected(it) }
      }
    }

    ExpoUIView<DatePickerDialogProps>("DatePickerDialogView") {
      val onDateSelected by Event<DatePickerResult>()
      val onDismissRequest by Event<Unit>()

      Content { props ->
        ExpoDatePickerDialogContent(props, { onDateSelected(it) }, { onDismissRequest(Unit) })
      }
    }

    ExpoUIView<TimePickerDialogProps>("TimePickerDialogView") {
      val onDateSelected by Event<DatePickerResult>()
      val onDismissRequest by Event<Unit>()

      Content { props ->
        ExpoTimePickerDialogContent(props, { onDateSelected(it) }, { onDismissRequest(Unit) })
      }
    }

    ExpoUIView<DropdownMenuProps>("DropdownMenuView") {
      val onDismissRequest by Event<Unit>()

      Content { props ->
        DropdownMenuContent(props) { onDismissRequest(Unit) }
      }
    }

    ExpoUIView<DropdownMenuItemProps>("DropdownMenuItemView") {
      val onItemPressed by Event<Unit>()

      Content { props ->
        DropdownMenuItemContent(props) { onItemPressed(Unit) }
      }
    }

    ExpoUIView<LinearProgressIndicatorProps>("LinearProgressIndicatorView") {
      Content { props ->
        LinearProgressIndicatorContent(props)
      }
    }

    ExpoUIView<CircularProgressIndicatorProps>("CircularProgressIndicatorView") {
      Content { props ->
        CircularProgressIndicatorContent(props)
      }
    }

    ExpoUIView<LinearWavyProgressIndicatorProps>("LinearWavyProgressIndicatorView") {
      Content { props ->
        LinearWavyProgressIndicatorContent(props)
      }
    }

    ExpoUIView<CircularWavyProgressIndicatorProps>("CircularWavyProgressIndicatorView") {
      Content { props ->
        CircularWavyProgressIndicatorContent(props)
      }
    }

    ExpoUIView<LayoutProps>("BoxView") {
      Content { props ->
        BoxContent(props)
      }
    }

    ExpoUIView<LayoutProps>("RowView") {
      Content { props ->
        RowContent(props)
      }
    }

    ExpoUIView<LayoutProps>("FlowRowView") {
      Content { props ->
        FlowRowContent(props)
      }
    }

    ExpoUIView<LayoutProps>("ColumnView") {
      Content { props ->
        ColumnContent(props)
      }
    }

    ExpoUIView<TextProps>("TextView") {
      Content { props ->
        TextContent(props)
      }
    }

    ExpoUIView<SearchBarProps>("SearchBarView") {
      val onSearch by Event<GenericEventPayload1<String>>()

      Content { props ->
        SearchBarContent(props) { onSearch(it) }
      }
    }

    ExpoUIView<DockedSearchBarProps>("DockedSearchBarView") {
      val onQueryChange by Event<GenericEventPayload1<String>>()

      Content { props ->
        DockedSearchBarContent(props) { onQueryChange(it) }
      }
    }

    ExpoUIView<HorizontalFloatingToolbarProps>("HorizontalFloatingToolbarView") {
      Content { props ->
        HorizontalFloatingToolbarContent(props)
      }
    }

    ExpoUIView<PullToRefreshBoxProps>("PullToRefreshBoxView") {
      val onRefresh by Event<Unit>()

      Content { props ->
        PullToRefreshBoxContent(props) { onRefresh(Unit) }
      }
    }

    ExpoUIView<HorizontalPagerProps>("HorizontalPagerView") {
      val animateScrollToPage by AsyncFunction<Int>()
      val scrollToPage by AsyncFunction<Int>()
      val onCurrentPageChange by Event<HorizontalPagerCurrentPageChangeEvent>()
      val onSettledPageChange by Event<HorizontalPagerSettledPageChangeEvent>()

      Content { props ->
        HorizontalPagerContent(
          props,
          animateScrollToPage,
          scrollToPage,
          { onCurrentPageChange(it) },
          { onSettledPageChange(it) }
        )
      }
    }

    ExpoUIView<HorizontalCenteredHeroCarouselProps>("HorizontalCenteredHeroCarouselView") {
      Content { props ->
        HorizontalCenteredHeroCarouselContent(props)
      }
    }

    ExpoUIView<HorizontalMultiBrowseCarouselProps>("HorizontalMultiBrowseCarouselView") {
      Content { props ->
        HorizontalMultiBrowseCarouselContent(props)
      }
    }

    ExpoUIView<HorizontalUncontainedCarouselProps>("HorizontalUncontainedCarouselView") {
      Content { props ->
        HorizontalUncontainedCarouselContent(props)
      }
    }

    ExpoUIView<AlertDialogProps>("AlertDialogView") {
      val onDismissRequest by Event<Unit>()

      Content { props ->
        AlertDialogContent(props) { onDismissRequest(Unit) }
      }
    }

    ExpoUIView<AssistChipProps>("AssistChipView") {
      val onNativeClick by Event<ChipPressedEvent>()

      Content { props ->
        AssistChipContent(props) { onNativeClick(it) }
      }
    }

    ExpoUIView<InputChipProps>("InputChipView") {
      val onNativeClick by Event<ChipPressedEvent>()

      Content { props ->
        InputChipContent(props) { onNativeClick(it) }
      }
    }

    ExpoUIView<SuggestionChipProps>("SuggestionChipView") {
      val onNativeClick by Event<ChipPressedEvent>()

      Content { props ->
        SuggestionChipContent(props) { onNativeClick(it) }
      }
    }

    ExpoUIView<FilterChipProps>("FilterChipView") {
      val onNativeClick by Event<ChipPressedEvent>()

      Content { props ->
        FilterChipContent(props) { onNativeClick(it) }
      }
    }

    ExpoUIView<ToggleButtonProps>("ToggleButton") {
      val onCheckedChange by Event<ToggleButtonValueChangeEvent>()

      Content { props ->
        ToggleButtonContent(props) { onCheckedChange(it) }
      }
    }

    ExpoUIView<ToggleButtonProps>("IconToggleButton") {
      val onCheckedChange by Event<ToggleButtonValueChangeEvent>()

      Content { props ->
        IconToggleButtonContent(props) { onCheckedChange(it) }
      }
    }

    ExpoUIView<ToggleButtonProps>("FilledIconToggleButton") {
      val onCheckedChange by Event<ToggleButtonValueChangeEvent>()

      Content { props ->
        FilledIconToggleButtonContent(props) { onCheckedChange(it) }
      }
    }

    ExpoUIView<ToggleButtonProps>("OutlinedIconToggleButton") {
      val onCheckedChange by Event<ToggleButtonValueChangeEvent>()

      Content { props ->
        OutlinedIconToggleButtonContent(props) { onCheckedChange(it) }
      }
    }

    ExpoUIView<CardProps>("CardView") {
      Content { props ->
        CardContent(props)
      }
    }

    ExpoUIView<ElevatedCardProps>("ElevatedCardView") {
      Content { props ->
        ElevatedCardContent(props)
      }
    }

    ExpoUIView<OutlinedCardProps>("OutlinedCardView") {
      Content { props ->
        OutlinedCardContent(props)
      }
    }

    ExpoUIView<ListItemProps>("ListItemView") {
      Content { props ->
        ListItemContent(props)
      }
    }

    ExpoUIView<BadgeProps>("BadgeView") {
      Content { props ->
        BadgeContent(props)
      }
    }

    ExpoUIView<BadgedBoxProps>("BadgedBoxView") {
      Content { props ->
        BadgedBoxContent(props)
      }
    }

    ExpoUIView<SpacerProps>("SpacerView") {
      Content { props ->
        SpacerContent(props)
      }
    }

    ExpoUIView<BasicAlertDialogProps>("BasicAlertDialogView") {
      val onDismissRequest by Event<Unit>()

      Content { props ->
        BasicAlertDialogContent(props) { onDismissRequest(Unit) }
      }
    }

    ExpoUIView<SurfaceProps>("SurfaceView") {
      val onSurfaceClick by Event<Unit>()
      val onCheckedChange by Event<GenericEventPayload1<Boolean>>()

      Content { props ->
        SurfaceContent(props, onClick = { onSurfaceClick(Unit) }, onCheckedChange = { onCheckedChange(GenericEventPayload1(it)) })
      }
    }

    ExpoUIView<AnimatedVisibilityProps>("AnimatedVisibilityView") {
      Content { props ->
        AnimatedVisibilityContent(props)
      }
    }

    ExpoUIView<TooltipBoxViewProps>("TooltipBoxView") {
      val show by AsyncFunction()
      val dismiss by AsyncFunction()

      Content { props ->
        TooltipBoxContent(props, show, dismiss)
      }
    }

    ExpoUIView<TextFieldProps>("TextFieldView") {
      val setText by AsyncFunction<String>()
      val focus by AsyncFunction()
      val blur by AsyncFunction()
      val onValueChange by Event<TextFieldValuePayload>()
      val onFocusChanged by Event<GenericEventPayload1<Boolean>>()
      val onKeyboardAction by Event<KeyboardActionEvent>()

      Content { props ->
        TextFieldContent(
          props,
          setText,
          focus,
          blur,
          onValueChanged = { onValueChange(it) },
          onFocusChange = { onFocusChanged(it) },
          onKeyboardActionTriggered = { onKeyboardAction(it) }
        )
      }
    }

    ExpoUIView<RadioButtonProps>("RadioButtonView") {
      val onButtonPressed by Event<Unit>()

      Content { props ->
        val clickHandler = if (props.clickable) {
          { onButtonPressed(Unit) }
        } else {
          null
        }
        RadioButtonContent(props, clickHandler)
      }
    }

    ExpoUIView<FloatingActionButtonProps>("FloatingActionButtonView") {
      val onButtonPressed by Event<Unit>()

      Content { props ->
        FloatingActionButtonContent(props) { onButtonPressed(Unit) }
      }
    }

    // Experimental Compose state support to trigger synchronous state updates from UI worklet.
    ExpoUIView<SyncSwitchProps>("SyncSwitchView") {
      Content { props ->
        SyncSwitchContent(props)
      }
    }

    ExpoUIView<ExposedDropdownMenuBoxProps>("ExposedDropdownMenuBoxView") {
      val onExpandedChange by Event<GenericEventPayload1<Boolean>>()

      Content { props ->
        ExposedDropdownMenuBoxContent(props) { onExpandedChange(GenericEventPayload1(it)) }
      }
    }

    ExpoUIView<ExposedDropdownMenuProps>("ExposedDropdownMenuView") {
      val onDismissRequest by Event<Unit>()

      Content { props ->
        ExposedDropdownMenuContent(props) { onDismissRequest(Unit) }
      }
    }

    //endregion Expo UI views
  }
}
