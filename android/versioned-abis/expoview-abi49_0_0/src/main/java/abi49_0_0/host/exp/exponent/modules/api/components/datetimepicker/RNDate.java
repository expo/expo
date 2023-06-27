package abi49_0_0.host.exp.exponent.modules.api.components.datetimepicker;

import java.util.Calendar;
import java.util.TimeZone;
import android.os.Bundle;

public class RNDate {
  private Calendar now;

  public RNDate(Bundle args) {
    now = Calendar.getInstance();

    if (args != null && args.containsKey(RNConstants.ARG_VALUE)) {
      set(args.getLong(RNConstants.ARG_VALUE));
    }

    if (args != null && args.containsKey(RNConstants.ARG_TZOFFSET_MINS)) {
      now.setTimeZone(TimeZone.getTimeZone("GMT"));
      Long timeZoneOffsetInMinutesFallback = args.getLong(RNConstants.ARG_TZOFFSET_MINS);
      Integer timeZoneOffsetInMinutes = args.getInt(RNConstants.ARG_TZOFFSET_MINS, timeZoneOffsetInMinutesFallback.intValue());
      now.add(Calendar.MILLISECOND, timeZoneOffsetInMinutes * 60000);
    }
  }

  public void set(long value) {
    now.setTimeInMillis(value);
  }

  public int year() { return now.get(Calendar.YEAR); }
  public int month() { return now.get(Calendar.MONTH); }
  public int day() { return now.get(Calendar.DAY_OF_MONTH); }
  public int hour() { return now.get(Calendar.HOUR_OF_DAY); }
  public int minute() { return now.get(Calendar.MINUTE); }
}
