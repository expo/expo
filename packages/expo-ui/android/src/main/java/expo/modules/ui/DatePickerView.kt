package expo.modules.ui

import androidx.compose.material3.AlertDialog
import androidx.compose.ui.res.stringResource
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDefaults
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.DatePickerState
import androidx.compose.material3.DisplayMode
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.SelectableDates
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TimePicker
import androidx.compose.material3.TimePickerDefaults
import androidx.compose.material3.TimePickerLayoutType
import androidx.compose.material3.TimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import java.util.Calendar
import java.util.Date
import android.graphics.Color as AndroidColor
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedRecord
data class DatePickerResult(
  @Field
  val date: Long?
) : Record


enum class DisplayedComponents(val value: String) : Enumerable {
  DATE("date"),
  HOUR_AND_MINUTE("hourAndMinute"),
  DATE_AND_TIME("dateAndTime") // for alignment with JS, not supported at the moment
}

enum class Variant(val value: String) : Enumerable {
  PICKER("picker"),
  INPUT("input");

  @OptIn(ExperimentalMaterial3Api::class)
  fun toDisplayMode(): DisplayMode {
    return when (this) {
      PICKER -> DisplayMode.Picker
      INPUT -> DisplayMode.Input
    }
  }
}

@OptimizedRecord
class DateTimePickerColorOverrides : Record {
  // DatePicker colors
  @Field val containerColor: AndroidColor? = null
  @Field val titleContentColor: AndroidColor? = null
  @Field val headlineContentColor: AndroidColor? = null
  @Field val weekdayContentColor: AndroidColor? = null
  @Field val subheadContentColor: AndroidColor? = null
  @Field val navigationContentColor: AndroidColor? = null
  @Field val yearContentColor: AndroidColor? = null
  @Field val disabledYearContentColor: AndroidColor? = null
  @Field val currentYearContentColor: AndroidColor? = null
  @Field val selectedYearContentColor: AndroidColor? = null
  @Field val disabledSelectedYearContentColor: AndroidColor? = null
  @Field val selectedYearContainerColor: AndroidColor? = null
  @Field val disabledSelectedYearContainerColor: AndroidColor? = null
  @Field val dayContentColor: AndroidColor? = null
  @Field val disabledDayContentColor: AndroidColor? = null
  @Field val selectedDayContentColor: AndroidColor? = null
  @Field val disabledSelectedDayContentColor: AndroidColor? = null
  @Field val selectedDayContainerColor: AndroidColor? = null
  @Field val disabledSelectedDayContainerColor: AndroidColor? = null
  @Field val todayContentColor: AndroidColor? = null
  @Field val todayDateBorderColor: AndroidColor? = null
  @Field val dayInSelectionRangeContentColor: AndroidColor? = null
  @Field val dayInSelectionRangeContainerColor: AndroidColor? = null
  @Field val dividerColor: AndroidColor? = null

  // TimePicker colors
  @Field val clockDialColor: AndroidColor? = null
  @Field val clockDialSelectedContentColor: AndroidColor? = null
  @Field val clockDialUnselectedContentColor: AndroidColor? = null
  @Field val selectorColor: AndroidColor? = null
  @Field val periodSelectorBorderColor: AndroidColor? = null
  @Field val periodSelectorSelectedContainerColor: AndroidColor? = null
  @Field val periodSelectorUnselectedContainerColor: AndroidColor? = null
  @Field val periodSelectorSelectedContentColor: AndroidColor? = null
  @Field val periodSelectorUnselectedContentColor: AndroidColor? = null
  @Field val timeSelectorSelectedContainerColor: AndroidColor? = null
  @Field val timeSelectorUnselectedContainerColor: AndroidColor? = null
  @Field val timeSelectorSelectedContentColor: AndroidColor? = null
  @Field val timeSelectorUnselectedContentColor: AndroidColor? = null
}

@OptimizedRecord
class SelectableDatesRecord : Record {
  @Field val start: Long? = null
  @Field val end: Long? = null
}

@OptimizedComposeProps
data class DateTimePickerProps(
  val initialDate: Long? = null,
  val variant: Variant = Variant.PICKER,
  val displayedComponents: DisplayedComponents = DisplayedComponents.DATE,
  val showVariantToggle: Boolean = true,
  val is24Hour: Boolean = true,
  val color: AndroidColor? = null,
  val elementColors: DateTimePickerColorOverrides = DateTimePickerColorOverrides(),
  val selectableDates: SelectableDatesRecord? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@OptimizedComposeProps
data class DatePickerDialogProps(
  val initialDate: Long? = null,
  val variant: Variant = Variant.PICKER,
  val showVariantToggle: Boolean = true,
  val confirmButtonLabel: String? = null,
  val dismissButtonLabel: String? = null,
  val color: AndroidColor? = null,
  val elementColors: DateTimePickerColorOverrides = DateTimePickerColorOverrides(),
  val selectableDates: SelectableDatesRecord? = null,
) : ComposeProps

@OptimizedComposeProps
data class TimePickerDialogProps(
  val initialDate: Long? = null,
  val is24Hour: Boolean = true,
  val confirmButtonLabel: String? = null,
  val dismissButtonLabel: String? = null,
  val color: AndroidColor? = null,
  val elementColors: DateTimePickerColorOverrides = DateTimePickerColorOverrides(),
) : ComposeProps

private fun toUtcDayMillis(localMillis: Long): Long {
  val cal = Calendar.getInstance()
  cal.timeInMillis = localMillis
  val utcCal = Calendar.getInstance(java.util.TimeZone.getTimeZone("UTC"))
  utcCal.set(cal.get(Calendar.YEAR), cal.get(Calendar.MONTH), cal.get(Calendar.DAY_OF_MONTH), 0, 0, 0)
  utcCal.set(Calendar.MILLISECOND, 0)
  return utcCal.timeInMillis
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun rememberSelectableDates(selectableDatesRecord: SelectableDatesRecord?): SelectableDates {
  val start = selectableDatesRecord?.start
  val end = selectableDatesRecord?.end
  return remember(start, end) {
    if (start != null || end != null) {
      val startUtcDayMillis = start?.let { toUtcDayMillis(it) }
      val endUtcDayMillis = end?.let { toUtcDayMillis(it) }

      val startYear = start?.let {
        val cal = Calendar.getInstance()
        cal.timeInMillis = it
        cal.get(Calendar.YEAR)
      }
      val endYear = end?.let {
        val cal = Calendar.getInstance()
        cal.timeInMillis = it
        cal.get(Calendar.YEAR)
      }

      object : SelectableDates {
        override fun isSelectableDate(utcTimeMillis: Long): Boolean {
          if (startUtcDayMillis != null && utcTimeMillis < startUtcDayMillis) return false
          if (endUtcDayMillis != null && utcTimeMillis > endUtcDayMillis) return false
          return true
        }

        override fun isSelectableYear(year: Int): Boolean {
          if (startYear != null && year < startYear) return false
          if (endYear != null && year > endYear) return false
          return true
        }
      }
    } else {
      DatePickerDefaults.AllDates
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun buildDatePickerColors(
  elementColors: DateTimePickerColorOverrides = DateTimePickerColorOverrides(),
  colorProp: androidx.compose.ui.graphics.Color? = null,
  defaults: androidx.compose.material3.DatePickerColors = DatePickerDefaults.colors()
): androidx.compose.material3.DatePickerColors {
  return defaults.copy(
    containerColor = elementColors.containerColor.composeOrNull ?: defaults.containerColor,
    titleContentColor = elementColors.titleContentColor.composeOrNull ?: colorProp ?: defaults.titleContentColor,
    headlineContentColor = elementColors.headlineContentColor.composeOrNull ?: colorProp ?: defaults.headlineContentColor,
    weekdayContentColor = elementColors.weekdayContentColor.composeOrNull ?: defaults.weekdayContentColor,
    subheadContentColor = elementColors.subheadContentColor.composeOrNull ?: defaults.subheadContentColor,
    navigationContentColor = elementColors.navigationContentColor.composeOrNull ?: defaults.navigationContentColor,
    yearContentColor = elementColors.yearContentColor.composeOrNull ?: defaults.yearContentColor,
    disabledYearContentColor = elementColors.disabledYearContentColor.composeOrNull ?: defaults.disabledYearContentColor,
    currentYearContentColor = elementColors.currentYearContentColor.composeOrNull ?: defaults.currentYearContentColor,
    selectedYearContentColor = elementColors.selectedYearContentColor.composeOrNull ?: defaults.selectedYearContentColor,
    disabledSelectedYearContentColor = elementColors.disabledSelectedYearContentColor.composeOrNull ?: defaults.disabledSelectedYearContentColor,
    selectedYearContainerColor = elementColors.selectedYearContainerColor.composeOrNull ?: defaults.selectedYearContainerColor,
    disabledSelectedYearContainerColor = elementColors.disabledSelectedYearContainerColor.composeOrNull ?: defaults.disabledSelectedYearContainerColor,
    dayContentColor = elementColors.dayContentColor.composeOrNull ?: defaults.dayContentColor,
    disabledDayContentColor = elementColors.disabledDayContentColor.composeOrNull ?: defaults.disabledDayContentColor,
    selectedDayContentColor = elementColors.selectedDayContentColor.composeOrNull ?: defaults.selectedDayContentColor,
    disabledSelectedDayContentColor = elementColors.disabledSelectedDayContentColor.composeOrNull ?: defaults.disabledSelectedDayContentColor,
    selectedDayContainerColor = elementColors.selectedDayContainerColor.composeOrNull ?: colorProp ?: defaults.selectedDayContainerColor,
    disabledSelectedDayContainerColor = elementColors.disabledSelectedDayContainerColor.composeOrNull ?: defaults.disabledSelectedDayContainerColor,
    todayContentColor = elementColors.todayContentColor.composeOrNull ?: defaults.todayContentColor,
    todayDateBorderColor = elementColors.todayDateBorderColor.composeOrNull ?: colorProp ?: defaults.todayDateBorderColor,
    dayInSelectionRangeContentColor = elementColors.dayInSelectionRangeContentColor.composeOrNull ?: defaults.dayInSelectionRangeContentColor,
    dayInSelectionRangeContainerColor = elementColors.dayInSelectionRangeContainerColor.composeOrNull ?: defaults.dayInSelectionRangeContainerColor,
    dividerColor = elementColors.dividerColor.composeOrNull ?: defaults.dividerColor
  )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun buildTimePickerColors(
  elementColors: DateTimePickerColorOverrides = DateTimePickerColorOverrides(),
  colorProp: androidx.compose.ui.graphics.Color? = null,
  defaults: androidx.compose.material3.TimePickerColors = TimePickerDefaults.colors()
): androidx.compose.material3.TimePickerColors {
  return defaults.copy(
    containerColor = elementColors.containerColor.composeOrNull ?: defaults.containerColor,
    clockDialColor = elementColors.clockDialColor.composeOrNull ?: colorProp?.copy(alpha = 0.3f) ?: defaults.clockDialColor,
    clockDialSelectedContentColor = elementColors.clockDialSelectedContentColor.composeOrNull ?: defaults.clockDialSelectedContentColor,
    clockDialUnselectedContentColor = elementColors.clockDialUnselectedContentColor.composeOrNull ?: defaults.clockDialUnselectedContentColor,
    selectorColor = elementColors.selectorColor.composeOrNull ?: colorProp ?: defaults.selectorColor,
    periodSelectorBorderColor = elementColors.periodSelectorBorderColor.composeOrNull ?: defaults.periodSelectorBorderColor,
    periodSelectorSelectedContainerColor = elementColors.periodSelectorSelectedContainerColor.composeOrNull ?: defaults.periodSelectorSelectedContainerColor,
    periodSelectorUnselectedContainerColor = elementColors.periodSelectorUnselectedContainerColor.composeOrNull ?: defaults.periodSelectorUnselectedContainerColor,
    periodSelectorSelectedContentColor = elementColors.periodSelectorSelectedContentColor.composeOrNull ?: defaults.periodSelectorSelectedContentColor,
    periodSelectorUnselectedContentColor = elementColors.periodSelectorUnselectedContentColor.composeOrNull ?: defaults.periodSelectorUnselectedContentColor,
    timeSelectorSelectedContainerColor = elementColors.timeSelectorSelectedContainerColor.composeOrNull ?: colorProp ?: defaults.timeSelectorSelectedContainerColor,
    timeSelectorUnselectedContainerColor = elementColors.timeSelectorUnselectedContainerColor.composeOrNull ?: defaults.timeSelectorUnselectedContainerColor,
    timeSelectorSelectedContentColor = elementColors.timeSelectorSelectedContentColor.composeOrNull ?: defaults.timeSelectorSelectedContentColor,
    timeSelectorUnselectedContentColor = elementColors.timeSelectorUnselectedContentColor.composeOrNull ?: defaults.timeSelectorUnselectedContentColor
  )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExpoDatePickerDialogContent(props: DatePickerDialogProps, onDateSelected: (DatePickerResult) -> Unit, onDismissRequest: () -> Unit) {
  val locale = LocalConfiguration.current.locales[0]
  val variant = props.variant.toDisplayMode()
  val selectableDates = rememberSelectableDates(props.selectableDates)
  val fallbackDate = remember { Date().time }
  val initialDate = props.initialDate ?: fallbackDate

  val state = remember(variant, initialDate, selectableDates) {
    DatePickerState(
      initialDisplayMode = variant,
      locale = locale,
      initialSelectedDateMillis = initialDate,
      initialDisplayedMonthMillis = initialDate,
      yearRange = DatePickerDefaults.YearRange,
      selectableDates = selectableDates
    )
  }

  val colors = buildDatePickerColors(props.elementColors, props.color.composeOrNull, DatePickerDefaults.colors())

  DatePickerDialog(
    onDismissRequest = { onDismissRequest() },
    confirmButton = {
      TextButton(onClick = { onDateSelected(DatePickerResult(date = state.selectedDateMillis)) }) {
        Text(props.confirmButtonLabel ?: stringResource(android.R.string.ok))
      }
    },
    dismissButton = {
      TextButton(onClick = { onDismissRequest() }) {
        Text(props.dismissButtonLabel ?: stringResource(android.R.string.cancel))
      }
    },
    colors = colors
  ) {
    DatePicker(
      state = state,
      showModeToggle = props.showVariantToggle,
      colors = colors
    )
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExpoTimePickerDialogContent(props: TimePickerDialogProps, onDateSelected: (DatePickerResult) -> Unit, onDismissRequest: () -> Unit) {
  val initialDate = props.initialDate

  val state = remember(initialDate, props.is24Hour) {
    val cal = Calendar.getInstance()
    if (initialDate != null) {
      cal.timeInMillis = initialDate
    }
    TimePickerState(
      initialHour = cal.get(Calendar.HOUR_OF_DAY),
      initialMinute = cal.get(Calendar.MINUTE),
      is24Hour = props.is24Hour
    )
  }

  val timePickerColors = buildTimePickerColors(props.elementColors, props.color.composeOrNull, TimePickerDefaults.colors())

  AlertDialog(
    onDismissRequest = { onDismissRequest() },
    confirmButton = {
      TextButton(onClick = {
        val cal = Calendar.getInstance()
        if (initialDate != null) {
          cal.timeInMillis = initialDate
        }
        cal.set(Calendar.HOUR_OF_DAY, state.hour)
        cal.set(Calendar.MINUTE, state.minute)
        onDateSelected(DatePickerResult(date = cal.time.time))
      }) {
        Text(props.confirmButtonLabel ?: stringResource(android.R.string.ok))
      }
    },
    dismissButton = {
      TextButton(onClick = { onDismissRequest() }) {
        Text(props.dismissButtonLabel ?: stringResource(android.R.string.cancel))
      }
    },
    text = {
      TimePicker(
        state = state,
        layoutType = TimePickerLayoutType.Vertical,
        colors = timePickerColors
      )
    }
  )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FunctionalComposableScope.DateTimePickerContent(props: DateTimePickerProps, onDateSelected: (DatePickerResult) -> Unit) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  if (props.displayedComponents == DisplayedComponents.HOUR_AND_MINUTE) {
    ExpoTimePicker(props = props, modifier = modifier) {
      onDateSelected(it)
    }
  } else {
    ExpoDatePicker(props = props, modifier = modifier) {
      onDateSelected(it)
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExpoDatePicker(modifier: Modifier = Modifier, props: DateTimePickerProps, onDateSelected: (DatePickerResult) -> Unit) {
  val locale = LocalConfiguration.current.locales[0]
  val variant = props.variant.toDisplayMode()
  val initialDate = props.initialDate
  val selectableDates = rememberSelectableDates(props.selectableDates)

  val state = remember(variant, initialDate, selectableDates) {
    val fallbackDate = Date().time
    DatePickerState(
      initialDisplayMode = variant,
      locale = locale,
      initialSelectedDateMillis = initialDate ?: fallbackDate,
      initialDisplayedMonthMillis = initialDate ?: fallbackDate,
      yearRange = DatePickerDefaults.YearRange,
      selectableDates = selectableDates
    )
  }

  LaunchedEffect(state.selectedDateMillis) {
    onDateSelected(DatePickerResult(date = state.selectedDateMillis))
  }

  DatePicker(
    modifier = modifier,
    state = state,
    showModeToggle = props.showVariantToggle,
    colors = buildDatePickerColors(props.elementColors, props.color.composeOrNull)
  )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExpoTimePicker(modifier: Modifier = Modifier, props: DateTimePickerProps, onDateSelected: (DatePickerResult) -> Unit) {
  val initialDate = props.initialDate

  val state = remember(initialDate, props.is24Hour) {
    val cal = Calendar.getInstance()
    cal.isLenient = false
    if (initialDate != null) {
      cal.timeInMillis = initialDate
    }
    TimePickerState(
      initialHour = cal.get(Calendar.HOUR_OF_DAY),
      initialMinute = cal.get(Calendar.MINUTE),
      is24Hour = props.is24Hour
    )
  }

  LaunchedEffect(state.hour, state.minute) {
    val cal = Calendar.getInstance()
    cal.isLenient = false
    if (initialDate != null) {
      cal.timeInMillis = initialDate
    }
    cal.set(Calendar.HOUR_OF_DAY, state.hour)
    cal.set(Calendar.MINUTE, state.minute)
    onDateSelected(DatePickerResult(date = cal.time.time))
  }

  TimePicker(
    modifier = modifier,
    state = state,
    layoutType = TimePickerLayoutType.Vertical,
    colors = buildTimePickerColors(props.elementColors, props.color.composeOrNull)
  )
}
