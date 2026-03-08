package expo.modules.ui

import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDefaults
import androidx.compose.material3.DatePickerState
import androidx.compose.material3.DisplayMode
import androidx.compose.material3.ExperimentalMaterial3Api
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

data class DatePickerResult(
  @Field
  val date: Long?
) : Record

enum class DisplayedComponents(val value: String) : Enumerable {
  DATE("date"),
  HOUR_AND_MINUTE("hourAndMinute"),
  DATE_AND_TIME("dateAndTime")
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

data class DateTimePickerProps(
  val title: String = "",
  val initialDate: Long? = null,
  val variant: Variant = Variant.PICKER,
  val displayedComponents: DisplayedComponents = DisplayedComponents.DATE,
  val showVariantToggle: Boolean = true,
  val is24Hour: Boolean = true,
  val color: AndroidColor? = null,
  val elementColors: DateTimePickerColorOverrides = DateTimePickerColorOverrides(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FunctionalComposableScope.DateTimePickerContent(props: DateTimePickerProps, onDateSelected: (DatePickerResult) -> Unit) {
  if (props.displayedComponents == DisplayedComponents.HOUR_AND_MINUTE) {
    ExpoTimePicker(props = props, modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)) {
      onDateSelected(it)
    }
  } else {
    ExpoDatePicker(props = props, modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)) {
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

  val state = remember(variant, initialDate) {
    DatePickerState(
      initialDisplayMode = variant,
      locale = locale,
      initialSelectedDateMillis = initialDate ?: Date().time,
      initialDisplayedMonthMillis = initialDate ?: Date().time,
      yearRange = DatePickerDefaults.YearRange,
      selectableDates = DatePickerDefaults.AllDates
    )
  }

  LaunchedEffect(state.selectedDateMillis) {
    onDateSelected(DatePickerResult(date = state.selectedDateMillis))
  }

  val ec = props.elementColors
  val defaults = DatePickerDefaults.colors()

  DatePicker(
    modifier = modifier,
    state = state,
    showModeToggle = props.showVariantToggle,
    colors = DatePickerDefaults.colors().copy(
      containerColor = ec.containerColor.composeOrNull ?: defaults.containerColor,
      titleContentColor = ec.titleContentColor.composeOrNull ?: defaults.titleContentColor,
      headlineContentColor = ec.headlineContentColor.composeOrNull ?: defaults.headlineContentColor,
      weekdayContentColor = ec.weekdayContentColor.composeOrNull ?: defaults.weekdayContentColor,
      subheadContentColor = ec.subheadContentColor.composeOrNull ?: defaults.subheadContentColor,
      navigationContentColor = ec.navigationContentColor.composeOrNull ?: defaults.navigationContentColor,
      yearContentColor = ec.yearContentColor.composeOrNull ?: defaults.yearContentColor,
      disabledYearContentColor = ec.disabledYearContentColor.composeOrNull ?: defaults.disabledYearContentColor,
      currentYearContentColor = ec.currentYearContentColor.composeOrNull ?: defaults.currentYearContentColor,
      selectedYearContentColor = ec.selectedYearContentColor.composeOrNull ?: defaults.selectedYearContentColor,
      disabledSelectedYearContentColor = ec.disabledSelectedYearContentColor.composeOrNull ?: defaults.disabledSelectedYearContentColor,
      selectedYearContainerColor = ec.selectedYearContainerColor.composeOrNull ?: defaults.selectedYearContainerColor,
      disabledSelectedYearContainerColor = ec.disabledSelectedYearContainerColor.composeOrNull ?: defaults.disabledSelectedYearContainerColor,
      dayContentColor = ec.dayContentColor.composeOrNull ?: defaults.dayContentColor,
      disabledDayContentColor = ec.disabledDayContentColor.composeOrNull ?: defaults.disabledDayContentColor,
      selectedDayContentColor = ec.selectedDayContentColor.composeOrNull ?: defaults.selectedDayContentColor,
      disabledSelectedDayContentColor = ec.disabledSelectedDayContentColor.composeOrNull ?: defaults.disabledSelectedDayContentColor,
      selectedDayContainerColor = ec.selectedDayContainerColor.composeOrNull ?: defaults.selectedDayContainerColor,
      disabledSelectedDayContainerColor = ec.disabledSelectedDayContainerColor.composeOrNull ?: defaults.disabledSelectedDayContainerColor,
      todayContentColor = ec.todayContentColor.composeOrNull ?: defaults.todayContentColor,
      todayDateBorderColor = ec.todayDateBorderColor.composeOrNull ?: defaults.todayDateBorderColor,
      dayInSelectionRangeContentColor = ec.dayInSelectionRangeContentColor.composeOrNull ?: defaults.dayInSelectionRangeContentColor,
      dayInSelectionRangeContainerColor = ec.dayInSelectionRangeContainerColor.composeOrNull ?: defaults.dayInSelectionRangeContainerColor,
      dividerColor = ec.dividerColor.composeOrNull ?: defaults.dividerColor
    )
  )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExpoTimePicker(modifier: Modifier = Modifier, props: DateTimePickerProps, onDateSelected: (DatePickerResult) -> Unit) {
  val cal = Calendar.getInstance()

  val state = remember(props.initialDate, props.is24Hour) {
    val initialDate = props.initialDate
    if (initialDate != null) {
      cal.timeInMillis = initialDate
    } else {
      cal.time = Date()
    }
    val hour = cal.get(Calendar.HOUR_OF_DAY)
    val minute = cal.get(Calendar.MINUTE)

    TimePickerState(
      initialHour = hour,
      initialMinute = minute,
      is24Hour = props.is24Hour
    )
  }

  LaunchedEffect(state.hour, state.minute) {
    cal.set(Calendar.HOUR_OF_DAY, state.hour)
    cal.set(Calendar.MINUTE, state.minute)
    cal.isLenient = false

    onDateSelected(DatePickerResult(date = cal.time.time))
  }

  val ec = props.elementColors
  val defaults = TimePickerDefaults.colors()

  TimePicker(
    modifier = modifier,
    state = state,
    layoutType = TimePickerLayoutType.Vertical,
    colors = TimePickerDefaults.colors().copy(
      containerColor = ec.containerColor.composeOrNull ?: defaults.containerColor,
      clockDialColor = ec.clockDialColor.composeOrNull ?: defaults.clockDialColor,
      clockDialSelectedContentColor = ec.clockDialSelectedContentColor.composeOrNull ?: defaults.clockDialSelectedContentColor,
      clockDialUnselectedContentColor = ec.clockDialUnselectedContentColor.composeOrNull ?: defaults.clockDialUnselectedContentColor,
      selectorColor = ec.selectorColor.composeOrNull ?: defaults.selectorColor,
      periodSelectorBorderColor = ec.periodSelectorBorderColor.composeOrNull ?: defaults.periodSelectorBorderColor,
      periodSelectorSelectedContainerColor = ec.periodSelectorSelectedContainerColor.composeOrNull ?: defaults.periodSelectorSelectedContainerColor,
      periodSelectorUnselectedContainerColor = ec.periodSelectorUnselectedContainerColor.composeOrNull ?: defaults.periodSelectorUnselectedContainerColor,
      periodSelectorSelectedContentColor = ec.periodSelectorSelectedContentColor.composeOrNull ?: defaults.periodSelectorSelectedContentColor,
      periodSelectorUnselectedContentColor = ec.periodSelectorUnselectedContentColor.composeOrNull ?: defaults.periodSelectorUnselectedContentColor,
      timeSelectorSelectedContainerColor = ec.timeSelectorSelectedContainerColor.composeOrNull ?: defaults.timeSelectorSelectedContainerColor,
      timeSelectorUnselectedContainerColor = ec.timeSelectorUnselectedContainerColor.composeOrNull ?: defaults.timeSelectorUnselectedContainerColor,
      timeSelectorSelectedContentColor = ec.timeSelectorSelectedContentColor.composeOrNull ?: defaults.timeSelectorSelectedContentColor,
      timeSelectorUnselectedContentColor = ec.timeSelectorUnselectedContentColor.composeOrNull ?: defaults.timeSelectorUnselectedContentColor
    )
  )
}
