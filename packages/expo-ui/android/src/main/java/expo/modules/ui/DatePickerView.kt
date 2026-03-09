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

  val elementColors = props.elementColors
  val colorProp = props.color.composeOrNull
  val defaults = DatePickerDefaults.colors()

  DatePicker(
    modifier = modifier,
    state = state,
    showModeToggle = props.showVariantToggle,
    colors = DatePickerDefaults.colors().copy(
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

  val elementColors = props.elementColors
  val colorProp = props.color.composeOrNull
  val defaults = TimePickerDefaults.colors()

  TimePicker(
    modifier = modifier,
    state = state,
    layoutType = TimePickerLayoutType.Vertical,
    colors = TimePickerDefaults.colors().copy(
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
  )
}
