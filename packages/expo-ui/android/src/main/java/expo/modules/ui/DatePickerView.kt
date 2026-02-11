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

data class DateTimePickerProps(
  val title: String = "",
  val initialDate: Long? = null,
  val variant: Variant = Variant.PICKER,
  val displayedComponents: DisplayedComponents = DisplayedComponents.DATE,
  val showVariantToggle: Boolean = true,
  val is24Hour: Boolean = true,
  val color: AndroidColor? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FunctionalComposableScope.DateTimePickerContent(props: DateTimePickerProps, onDateSelected: (DatePickerResult) -> Unit) {
  if (props.displayedComponents == DisplayedComponents.HOUR_AND_MINUTE) {
    ExpoTimePicker(props = props, modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope)) {
      onDateSelected(it)
    }
  } else {
    ExpoDatePicker(props = props, modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope)) {
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

  DatePicker(
    modifier = modifier,
    state = state,
    showModeToggle = props.showVariantToggle,
    colors = DatePickerDefaults.colors().copy(
      titleContentColor = colorToComposeColor(props.color),
      selectedDayContainerColor = colorToComposeColor(props.color),
      todayDateBorderColor = colorToComposeColor(props.color),
      headlineContentColor = colorToComposeColor(props.color)
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

  TimePicker(
    modifier = modifier,
    state = state,
    layoutType = TimePickerLayoutType.Vertical,
    colors = TimePickerDefaults.colors().copy(
      selectorColor = colorToComposeColor(props.color),
      timeSelectorSelectedContainerColor = colorToComposeColor(props.color),
      clockDialColor = colorToComposeColor(props.color).copy(alpha = 0.3f)
    )
  )
}
