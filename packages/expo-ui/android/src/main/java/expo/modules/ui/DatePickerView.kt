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
  ExpoComposeView<DateTimePickerProps>(context, appContext, withHostingView = true) {
  override val props = DateTimePickerProps()
  private val onDateSelected by EventDispatcher<DatePickerResult>()

  @Composable
  override fun Content(modifier: Modifier) {
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExpoDatePicker(modifier: Modifier = Modifier, props: DateTimePickerProps, onDateSelected: (DatePickerResult) -> Unit) {
  val locale = LocalConfiguration.current.locales[0]
  val variant = props.variant.value.toDisplayMode()
  val initialDate = props.initialDate.value

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
