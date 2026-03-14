@file:OptIn(ExperimentalMaterial3ExpressiveApi::class)

package expo.modules.ui

import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.ToggleButtonDefaults
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.ui.button.ButtonContent
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

    ExpoUIView("ModalBottomSheetView") { props: ModalBottomSheetProps ->
      ModalBottomSheetContent(props)
    }

    ExpoUIView("PickerView") { props: PickerProps ->
      PickerContent(props)
    }

    ExpoUIView("SwitchView") { props: SwitchProps ->
      SwitchContent(props)
    }

    ExpoUIView("Button") { props: ButtonProps ->
      ButtonContent(props)
    }

    ExpoUIView("FilledTonalButton") { props: ButtonProps ->
      FilledTonalButtonContent(props)
    }

    ExpoUIView("OutlinedButton") { props: ButtonProps ->
      OutlinedButtonContent(props)
    }

    ExpoUIView("ElevatedButton") { props: ButtonProps ->
      ElevatedButtonContent(props)
    }

    ExpoUIView("TextButton") { props: ButtonProps ->
      TextButtonContent(props)
    }

    ExpoUIView("IconButton") { props: ButtonProps ->
      IconButtonContent(props)
    }

    ExpoUIView("FilledIconButton") { props: ButtonProps ->
      FilledIconButtonContent(props)
    }

    ExpoUIView("FilledTonalIconButton") { props: ButtonProps ->
      FilledTonalIconButtonContent(props)
    }

    ExpoUIView("OutlinedIconButton") { props: ButtonProps ->
      OutlinedIconButtonContent(props)
    }

    ExpoUIView("SliderView") { props: SliderProps ->
      SliderContent(props)
    }

    ExpoUIView("ShapeView") { props: ShapeProps ->
      ShapeContent(props)
    }

    ExpoUIView("DividerView") { props: DividerProps ->
      DividerContent(props)
    }

    ExpoUIView("DateTimePickerView") { props: DateTimePickerProps ->
      DateTimePickerContent(props)
    }

    ExpoUIView("DatePickerDialogView") { props: DatePickerDialogProps ->
      ExpoDatePickerDialogContent(props)
    }

    ExpoUIView("TimePickerDialogView") { props: TimePickerDialogProps ->
      ExpoTimePickerDialogContent(props)
    }

    ExpoUIView("DropdownMenuView") { props: DropdownMenuProps ->
      DropdownMenuContent(props)
    }

    ExpoUIView("DropdownMenuItemView") { props: DropdownMenuItemProps ->
      DropdownMenuItemContent(props)
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

    ExpoUIView("SearchBarView") { props: SearchBarProps ->
      SearchBarContent(props)
    }

    ExpoUIView("DockedSearchBarView") { props: DockedSearchBarProps ->
      DockedSearchBarContent(props)
    }

    ExpoUIView("HorizontalFloatingToolbarView") { props: HorizontalFloatingToolbarProps ->
      HorizontalFloatingToolbarContent(props)
    }

    ExpoUIView("PullToRefreshBoxView") { props: PullToRefreshBoxProps ->
      PullToRefreshBoxContent(props)
    }

    ExpoUIView("CarouselView") { props: CarouselProps ->
      CarouselContent(props)
    }

    ExpoUIView("AlertDialogView") { props: AlertDialogProps ->
      AlertDialogContent(props)
    }

    ExpoUIView("AssistChipView") { props: AssistChipProps ->
      AssistChipContent(props)
    }

    ExpoUIView("InputChipView") { props: InputChipProps ->
      InputChipContent(props)
    }

    ExpoUIView("SuggestionChipView") { props: SuggestionChipProps ->
      SuggestionChipContent(props)
    }

    ExpoUIView("FilterChipView") { props: FilterChipProps ->
      FilterChipContent(props)
    }

    ExpoUIView("ToggleButtonView") { props: ToggleButtonProps ->
      ToggleButtonContent(props)
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

    ExpoUIView("BasicAlertDialogView") { props: BasicAlertDialogProps ->
      BasicAlertDialogContent(props)
    }

    ExpoUIView("SurfaceView") { props: SurfaceProps ->
      SurfaceContent(props)
    }

    ExpoUIView("AnimatedVisibilityView") { props: AnimatedVisibilityProps ->
      AnimatedVisibilityContent(props)
    }

    ExpoUIView("RadioButtonView") { props: RadioButtonProps ->
      RadioButtonContent(props)
    }

    ExpoUIView("FloatingActionButtonView") { props: FloatingActionButtonProps ->
      FloatingActionButtonContent(props)
    }

    //endregion Expo UI views
  }
}
