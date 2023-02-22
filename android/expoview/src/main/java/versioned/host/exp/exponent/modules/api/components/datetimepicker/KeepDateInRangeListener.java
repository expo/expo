package versioned.host.exp.exponent.modules.api.components.datetimepicker;

import android.os.Bundle;
import android.widget.DatePicker;

import androidx.annotation.NonNull;

import java.util.Calendar;

// fix for https://issuetracker.google.com/issues/169602180
// TODO revisit day, month, year with timezoneoffset fixes
public class KeepDateInRangeListener implements DatePicker.OnDateChangedListener {

  private final Bundle args;

  public KeepDateInRangeListener(@NonNull Bundle args) {
    this.args = args;
  }

  @Override
  public void onDateChanged(DatePicker view, int year, int month, int day) {
    fixPotentialMaxDateBug(view, year, month, day);
    fixPotentialMinDateBug(view, year, month, day);
  }

  private void fixPotentialMaxDateBug(DatePicker datePicker, int year, int month, int day) {
    if (!isDateAfterMaxDate(args, year, month, day)) {
      return;
    }
    Calendar maxDate = Calendar.getInstance();
    maxDate.setTimeInMillis(args.getLong(RNConstants.ARG_MAXDATE));
    datePicker.updateDate(maxDate.get(Calendar.YEAR), maxDate.get(Calendar.MONTH), maxDate.get(Calendar.DAY_OF_MONTH));
  }

  private void fixPotentialMinDateBug(DatePicker datePicker, int year, int month, int day) {
    if (!isDateBeforeMinDate(args, year, month, day)) {
      return;
    }
    Calendar c = Calendar.getInstance();
    c.setTimeInMillis(args.getLong(RNConstants.ARG_MINDATE));
    datePicker.updateDate(c.get(Calendar.YEAR), c.get(Calendar.MONTH), c.get(Calendar.DAY_OF_MONTH));
  }

  public static boolean isDateAfterMaxDate(Bundle args, int year, int month, int day) {
    if (!args.containsKey(RNConstants.ARG_MAXDATE)) {
      return false;
    }
    Calendar maxDate = Calendar.getInstance();
    maxDate.setTimeInMillis(args.getLong(RNConstants.ARG_MAXDATE));
    return (year > maxDate.get(Calendar.YEAR) ||
      (year == maxDate.get(Calendar.YEAR) && month > maxDate.get(Calendar.MONTH)) ||
      (year == maxDate.get(Calendar.YEAR) && month == maxDate.get(Calendar.MONTH) && day > maxDate.get(Calendar.DAY_OF_MONTH)));
  }

  public static boolean isDateBeforeMinDate(Bundle args, int year, int month, int day) {
    if (!args.containsKey(RNConstants.ARG_MINDATE)) {
      return false;
    }
    Calendar minDate = Calendar.getInstance();
    minDate.setTimeInMillis(args.getLong(RNConstants.ARG_MINDATE));
    return (year < minDate.get(Calendar.YEAR) ||
      (year == minDate.get(Calendar.YEAR) && month < minDate.get(Calendar.MONTH)) ||
      (year == minDate.get(Calendar.YEAR) && month == minDate.get(Calendar.MONTH) && day < minDate.get(Calendar.DAY_OF_MONTH)));
  }
}
