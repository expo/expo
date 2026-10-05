package expo.modules.ui

import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DatePickerDefaults
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.DateRangePicker
import androidx.compose.material3.DateRangePickerState
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.res.stringResource
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps
import java.util.Date
import android.graphics.Color as AndroidColor

@OptimizedRecord
data class DateRangePickerResult(
  @Field
  val start: Long?,
  @Field
  val end: Long?
) : Record

@OptimizedComposeProps
data class DateRangePickerProps(
  val initialStartDate: Long? = null,
  val initialEndDate: Long? = null,
  val variant: Variant = Variant.PICKER,
  val showVariantToggle: Boolean = true,
  val color: AndroidColor? = null,
  val elementColors: DateTimePickerColorOverrides = DateTimePickerColorOverrides(),
  val selectableDates: SelectableDatesRecord? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@OptimizedComposeProps
data class DateRangePickerDialogProps(
  val initialStartDate: Long? = null,
  val initialEndDate: Long? = null,
  val variant: Variant = Variant.PICKER,
  val showVariantToggle: Boolean = true,
  val confirmButtonLabel: String? = null,
  val dismissButtonLabel: String? = null,
  val color: AndroidColor? = null,
  val elementColors: DateTimePickerColorOverrides = DateTimePickerColorOverrides(),
  val selectableDates: SelectableDatesRecord? = null
) : ComposeProps

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun rememberDateRangePickerState(
  initialStartDate: Long?,
  initialEndDate: Long?,
  variant: Variant,
  selectableDatesRecord: SelectableDatesRecord?
): DateRangePickerState {
  val locale = LocalConfiguration.current.locales[0]
  val displayMode = variant.toDisplayMode()
  val selectableDates = rememberSelectableDates(selectableDatesRecord)
  val fallbackDate = remember { Date().time }
  val initialDisplayedMonth = initialStartDate ?: fallbackDate
  val yearRange = rememberDatePickerYearRange(
    selectableDatesRecord,
    initialDisplayedMonth,
    initialEndDate
  )

  val state = remember(locale, displayMode, selectableDates, yearRange) {
    DateRangePickerState(
      locale = locale,
      initialSelectedStartDateMillis = initialStartDate,
      initialSelectedEndDateMillis = initialEndDate,
      initialDisplayedMonthMillis = initialDisplayedMonth,
      yearRange = yearRange,
      initialDisplayMode = displayMode,
      selectableDates = selectableDates
    )
  }

  LaunchedEffect(state, initialStartDate, initialEndDate) {
    if (state.selectedStartDateMillis != initialStartDate || state.selectedEndDateMillis != initialEndDate) {
      try {
        state.setSelection(initialStartDate, initialEndDate)
      } catch (e: IllegalArgumentException) {
        // Material 3 rejects a range outside the year range or an end date before the start date.
      }
    }
  }

  return state
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExpoDateRangePickerDialogContent(
  props: DateRangePickerDialogProps,
  onDateRangeSelected: (DateRangePickerResult) -> Unit,
  onDismissRequest: () -> Unit
) {
  val state = rememberDateRangePickerState(
    props.initialStartDate,
    props.initialEndDate,
    props.variant,
    props.selectableDates
  )
  val colors = buildDatePickerColors(props.elementColors, props.color.composeOrNull, DatePickerDefaults.colors())
  val buttonColors = props.color.composeOrNull
    ?.let { ButtonDefaults.textButtonColors(contentColor = it) } ?: ButtonDefaults.textButtonColors()

  DatePickerDialog(
    onDismissRequest = { onDismissRequest() },
    confirmButton = {
      TextButton(
        onClick = {
          onDateRangeSelected(
            DateRangePickerResult(
              start = state.selectedStartDateMillis,
              end = state.selectedEndDateMillis
            )
          )
        },
        enabled = state.selectedStartDateMillis != null && state.selectedEndDateMillis != null,
        colors = buttonColors
      ) {
        Text(props.confirmButtonLabel ?: stringResource(android.R.string.ok))
      }
    },
    dismissButton = {
      TextButton(onClick = { onDismissRequest() }, colors = buttonColors) {
        Text(props.dismissButtonLabel ?: stringResource(android.R.string.cancel))
      }
    },
    colors = colors
  ) {
    val displayMode = state.displayMode
    ApplyDatePickerDialogKeyboardBehavior(displayMode)

    CompositionLocalProvider(LocalContentColor provides colors.navigationContentColor) {
      DateRangePicker(
        state = state,
        showModeToggle = props.showVariantToggle,
        colors = colors
      )
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FunctionalComposableScope.DateRangePickerContent(
  props: DateRangePickerProps,
  onDateRangeSelected: (DateRangePickerResult) -> Unit
) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  val state = rememberDateRangePickerState(
    props.initialStartDate,
    props.initialEndDate,
    props.variant,
    props.selectableDates
  )

  LaunchedEffect(state.selectedStartDateMillis, state.selectedEndDateMillis) {
    onDateRangeSelected(
      DateRangePickerResult(
        start = state.selectedStartDateMillis,
        end = state.selectedEndDateMillis
      )
    )
  }

  val colors = buildDatePickerColors(props.elementColors, props.color.composeOrNull)
  CompositionLocalProvider(LocalContentColor provides colors.navigationContentColor) {
    DateRangePicker(
      modifier = modifier,
      state = state,
      showModeToggle = props.showVariantToggle,
      colors = colors
    )
  }
}
