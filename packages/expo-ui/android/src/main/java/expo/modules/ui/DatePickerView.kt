package expo.modules.ui

import android.annotation.SuppressLint
import android.content.Context
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
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.kotlin.views.ComposableScope
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
      else -> DisplayMode.Picker
    }
  }
}

data class DateTimePickerProps(
  val title: MutableState<String> = mutableStateOf(""),
  val initialDate: MutableState<Long?> = mutableStateOf(null),
  val minimumDate: MutableState<Long?> = mutableStateOf(null),
  val maximumDate: MutableState<Long?> = mutableStateOf(null),
  val variant: MutableState<Variant> = mutableStateOf(Variant.PICKER),
  val displayedComponents: MutableState<DisplayedComponents> = mutableStateOf(DisplayedComponents.DATE),
  val showVariantToggle: MutableState<Boolean> = mutableStateOf(true),
  val is24Hour: MutableState<Boolean> = mutableStateOf(true),
  val color: MutableState<AndroidColor?> = mutableStateOf(null),
  val modifiers: MutableState<List<ExpoModifier>> = mutableStateOf(emptyList())
) : ComposeProps

@SuppressLint("ViewConstructor")
@OptIn(ExperimentalMaterial3Api::class)
class DateTimePickerView(context: Context, appContext: AppContext) :
  ExpoComposeView<DateTimePickerProps>(context, appContext) {
  override val props = DateTimePickerProps()
  private val onDateSelected by EventDispatcher<DatePickerResult>()

  @Composable
  override fun ComposableScope.Content() {
    if (props.displayedComponents.value == DisplayedComponents.HOUR_AND_MINUTE) {
      ExpoTimePicker(props = props, modifier = Modifier.fromExpoModifiers(props.modifiers.value)) {
        onDateSelected(it)
      }
    } else {
      ExpoDatePicker(props = props, modifier = Modifier.fromExpoModifiers(props.modifiers.value)) {
        onDateSelected(it)
      }
    }
  }
}

/**
 * Normalizes a timestamp to UTC midnight (00:00:00.000) to ensure
 * minimum dates are inclusive from the start of the day.
 */
private fun normalizeToUtcMidnight(timestamp: Long): Long {
  val calendar = Calendar.getInstance(java.util.TimeZone.getTimeZone("UTC"))
  calendar.timeInMillis = timestamp
  calendar.set(Calendar.HOUR_OF_DAY, 0)
  calendar.set(Calendar.MINUTE, 0)
  calendar.set(Calendar.SECOND, 0)
  calendar.set(Calendar.MILLISECOND, 0)
  return calendar.timeInMillis
}

/**
 * Normalizes a timestamp to end of UTC day (23:59:59.999) to ensure
 * maximum dates are inclusive through the end of the day.
 */
private fun normalizeToUtcEndOfDay(timestamp: Long): Long {
  val calendar = Calendar.getInstance(java.util.TimeZone.getTimeZone("UTC"))
  calendar.timeInMillis = timestamp
  calendar.set(Calendar.HOUR_OF_DAY, 23)
  calendar.set(Calendar.MINUTE, 59)
  calendar.set(Calendar.SECOND, 59)
  calendar.set(Calendar.MILLISECOND, 999)
  return calendar.timeInMillis
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExpoDatePicker(modifier: Modifier = Modifier, props: DateTimePickerProps, onDateSelected: (DatePickerResult) -> Unit) {
  val locale = LocalConfiguration.current.locales[0]
  val variant = props.variant.value.toDisplayMode()
  val initialDate = props.initialDate.value

  // Normalize dates to ensure inclusive behavior:
  // - minimumDate: start of day (00:00:00.000)
  // - maximumDate: end of day (23:59:59.999)
  val minimumDate = props.minimumDate.value?.let { normalizeToUtcMidnight(it) }
  val maximumDate = props.maximumDate.value?.let { normalizeToUtcEndOfDay(it) }

  val selectableDates = remember(minimumDate, maximumDate) {
    createSelectableDates(minimumDate, maximumDate)
  }

  val yearRange = remember(minimumDate, maximumDate) {
    val cal = Calendar.getInstance()
    val minYear = minimumDate?.let {
      cal.apply { timeInMillis = it }.get(Calendar.YEAR)
    } ?: DatePickerDefaults.YearRange.first

    val maxYear = maximumDate?.let {
      cal.apply { timeInMillis = it }.get(Calendar.YEAR)
    } ?: DatePickerDefaults.YearRange.last

    minYear..maxYear
  }

  val state = remember(variant, initialDate, minimumDate, maximumDate) {
    DatePickerState(
      initialDisplayMode = variant,
      locale = locale,
      initialSelectedDateMillis = initialDate ?: Date().time,
      initialDisplayedMonthMillis = initialDate ?: Date().time,
      yearRange = yearRange,
      selectableDates = selectableDates
    )
  }

  LaunchedEffect(state.selectedDateMillis) {
    onDateSelected(DatePickerResult(date = state.selectedDateMillis))
  }

  DynamicTheme {
    DatePicker(
      modifier = modifier,
      state = state,
      showModeToggle = props.showVariantToggle.value,
      colors = DatePickerDefaults.colors().copy(
        titleContentColor = colorToComposeColor(props.color.value),
        selectedDayContainerColor = colorToComposeColor(props.color.value),
        todayDateBorderColor = colorToComposeColor(props.color.value),
        headlineContentColor = colorToComposeColor(props.color.value)
      )
    )
  }
}

@OptIn(ExperimentalMaterial3Api::class)
private fun createSelectableDates(minimumDate: Long?, maximumDate: Long?): androidx.compose.material3.SelectableDates {
  if (minimumDate != null && maximumDate != null && minimumDate > maximumDate) {
    android.util.Log.w(
      "ExpoDatePicker",
      "minimumDate ($minimumDate) is greater than maximumDate ($maximumDate). Using maximumDate as both bounds."
    )
  }

  return object : androidx.compose.material3.SelectableDates {
    override fun isSelectableDate(utcTimeMillis: Long): Boolean {
      // If min > max, only allow the max date
      if (minimumDate != null && maximumDate != null && minimumDate > maximumDate) {
        return utcTimeMillis == maximumDate
      }

      if (minimumDate != null && utcTimeMillis < minimumDate) {
        return false
      }

      if (maximumDate != null && utcTimeMillis > maximumDate) {
        return false
      }

      return true
    }

    override fun isSelectableYear(year: Int): Boolean {
      val cal = Calendar.getInstance()

      if (minimumDate != null && maximumDate != null && minimumDate > maximumDate) {
        cal.timeInMillis = maximumDate
        return year == cal.get(Calendar.YEAR)
      }

      if (minimumDate != null) {
        cal.timeInMillis = minimumDate
        val minYear = cal.get(Calendar.YEAR)
        if (year < minYear) return false
      }

      if (maximumDate != null) {
        cal.timeInMillis = maximumDate
        val maxYear = cal.get(Calendar.YEAR)
        if (year > maxYear) return false
      }

      return true
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExpoTimePicker(modifier: Modifier = Modifier, props: DateTimePickerProps, onDateSelected: (DatePickerResult) -> Unit) {
  val cal = Calendar.getInstance()

  val state = remember(props.initialDate.value, props.is24Hour.value) {
    val initialDate = props.initialDate.value
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
      is24Hour = props.is24Hour.value
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
      selectorColor = colorToComposeColor(props.color.value),
      timeSelectorSelectedContainerColor = colorToComposeColor(props.color.value),
      clockDialColor = colorToComposeColor(props.color.value).copy(alpha = 0.3f)
    )
  )
}
