// Copyright 2015-present 650 Industries. All rights reserved.

package abi28_0_0.host.exp.exponent.modules.api;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.AsyncTask;
import android.provider.CalendarContract;
import android.text.TextUtils;
import android.database.Cursor;
import android.util.Log;

import abi28_0_0.com.facebook.react.bridge.Promise;
import abi28_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi28_0_0.com.facebook.react.bridge.ReactContext;
import abi28_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi28_0_0.com.facebook.react.bridge.ReactMethod;
import abi28_0_0.com.facebook.react.bridge.ReadableArray;
import abi28_0_0.com.facebook.react.bridge.ReadableMap;
import abi28_0_0.com.facebook.react.bridge.ReadableType;
import abi28_0_0.com.facebook.react.bridge.WritableArray;
import abi28_0_0.com.facebook.react.bridge.WritableMap;
import abi28_0_0.com.facebook.react.bridge.WritableNativeArray;
import abi28_0_0.com.facebook.react.bridge.WritableNativeMap;
import abi28_0_0.com.facebook.react.bridge.Dynamic;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.HashMap;
import java.util.TimeZone;

import host.exp.exponent.kernel.ExperienceId;
import host.exp.expoview.Exponent;
import abi28_0_0.host.exp.exponent.modules.ExpoKernelServiceConsumerBaseModule;

public class CalendarModule extends ExpoKernelServiceConsumerBaseModule {
  private static final String TAG = CalendarModule.class.getSimpleName();

  private ReactContext reactContext;

  public CalendarModule(ReactApplicationContext reactContext, ExperienceId experienceId) {
    super(reactContext, experienceId);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "ExponentCalendar";
  }

  @ReactMethod
  public void getCalendarsAsync(final String type, final Promise promise) {
    if (isMissingPermissions()) {
      promise.reject("E_CANNOT_GET_CALENDARS", "User rejected permissions required to get calendars.");
      return;
    }
    if (type != null && type.equals("reminder")) {
      promise.reject("E_CALENDARS_NOT_FOUND", "Calendars of type `reminder` are not supported on Android");
      return;
    }
    try {
      AsyncTask.execute(new Runnable() {
        @Override
        public void run() {
          WritableArray calendars = findCalendars();
          promise.resolve(calendars);
        }
      });
    } catch (Exception e) {
      promise.reject("E_CALENDARS_NOT_FOUND", "Calendars could not be found", e);
    }
  }

  @ReactMethod
  public void saveCalendarAsync(final ReadableMap details, final Promise promise) {
    if (isMissingPermissions()) {
      promise.reject("E_CANNOT_SAVE_CALENDAR", "User rejected permissions required to save the calendar.");
      return;
    }
    try {
      AsyncTask.execute(new Runnable() {
        @Override
        public void run() {
          try {
            int calendarID = saveCalendar(details);
            promise.resolve(calendarID);
          } catch (Exception e) {
            promise.reject("E_CALENDAR_NOT_SAVED", "Calendar could not be saved", e);
          }
        }
      });
    } catch (Exception e) {
      promise.reject("E_CALENDAR_NOT_SAVED", "Calendar could not be saved", e);
    }
  }

  @ReactMethod
  public void deleteCalendarAsync(final String calendarID, final Promise promise) {
    if (isMissingPermissions()) {
      promise.reject("E_CANNOT_SAVE_CALENDAR", "User rejected permissions required to delete the calendar.");
      return;
    }
    try {
      AsyncTask.execute(new Runnable() {
        @Override
        public void run() {
          boolean successful = deleteCalendar(calendarID);
          if (successful) {
            promise.resolve(null);
          } else {
            promise.reject("E_CALENDAR_NOT_DELETED", String.format("Calendar with id %s could not be deleted", calendarID));
          }
        }
      });

    } catch (Exception e) {
      promise.reject("E_CALENDAR_NOT_DELETED", String.format("Calendar with id %s could not be deleted", calendarID), e);
    }
  }

  @ReactMethod
  public void getEventsAsync(final Dynamic startDate, final Dynamic endDate, final ReadableArray calendars, final Promise promise) {
    if (isMissingPermissions()) {
      promise.reject("E_CANNOT_SAVE_CALENDAR", "User rejected permissions required to get events.");
      return;
    }
    try {
      AsyncTask.execute(new Runnable() {
        @Override
        public void run() {
          WritableNativeArray results = findEvents(startDate, endDate, calendars);
          promise.resolve(results);
        }
      });

    } catch (Exception e) {
      promise.reject("E_EVENTS_NOT_FOUND", "Events could not be found", e);
    }
  }

  @ReactMethod
  public void getEventByIdAsync(final String eventID, final Promise promise) {
    if (isMissingPermissions()) {
      promise.reject("E_CANNOT_SAVE_CALENDAR", "User rejected permissions required to get the event.");
      return;
    }
    try {
      AsyncTask.execute(new Runnable() {
        @Override
        public void run() {
          WritableMap results = findEventById(eventID);
          promise.resolve(results);
        }
      });

    } catch (Exception e) {
      promise.reject("E_EVENT_NOT_FOUND", String.format("Event with id %s could not be found", eventID), e);
    }
  }

  @ReactMethod
  public void saveEventAsync(final ReadableMap details, final ReadableMap options, final Promise promise) {
    if (isMissingPermissions()) {
      promise.reject("E_CANNOT_SAVE_CALENDAR", "User rejected permissions required to save the event.");
      return;
    }
    try {
      AsyncTask.execute(new Runnable() {
        @Override
        public void run() {
          try {
            int eventID = saveEvent(details);
            promise.resolve(eventID);
          } catch (ParseException e) {
            promise.reject("E_EVENT_NOT_SAVED", "Event could not be saved", e);
          }
        }
      });
    } catch (Exception e) {
      promise.reject("E_EVENT_NOT_SAVED", "Event could not be saved", e);
    }
  }

  @ReactMethod
  public void deleteEventAsync(final ReadableMap details, final ReadableMap options, final Promise promise) {
    if (isMissingPermissions()) {
      promise.reject("E_CANNOT_SAVE_CALENDAR", "User rejected permissions required to delete the event.");
      return;
    }
    try {
      AsyncTask.execute(new Runnable() {
        @Override
        public void run() {
          try {
            boolean successful = removeEvent(details);
            if (successful) {
              promise.resolve(null);
            } else {
              promise.reject("E_EVENT_NOT_DELETED", String.format("Event with id %s could not be deleted", details.getString("id")));
            }
          } catch (Exception e) {
            promise.reject("E_EVENT_NOT_DELETED", String.format("Event with id %s could not be deleted", details.getString("id")), e);
          }
        }
      });

    } catch (Exception e) {
      promise.reject("E_EVENT_NOT_DELETED", String.format("Event with id %s could not be deleted", details.getString("id")), e);
    }
  }

  @ReactMethod
  public void getAttendeesForEventAsync(final String eventID, final Promise promise) {
    if (isMissingPermissions()) {
      promise.reject("E_CANNOT_SAVE_CALENDAR", "User rejected permissions required to get attendees.");
      return;
    }
    try {
      AsyncTask.execute(new Runnable() {
        @Override
        public void run() {
          WritableNativeArray results = findAttendeesByEventId(eventID);
          promise.resolve(results);
        }
      });

    } catch (Exception e) {
      promise.reject("E_ATTENDEES_NOT_FOUND", String.format("Attendees for event with id %s could not be found", eventID), e);
    }
  }

  @ReactMethod
  public void saveAttendeeForEventAsync(final ReadableMap details, final String eventID, final Promise promise) {
    if (isMissingPermissions()) {
      promise.reject("E_CANNOT_SAVE_CALENDAR", "User rejected permissions required to save the attendee.");
      return;
    }
    try {
      AsyncTask.execute(new Runnable() {
        @Override
        public void run() {
          try {
            int attendeeID = saveAttendeeForEvent(details, eventID);
            promise.resolve(attendeeID);
          } catch (Exception e) {
            promise.reject("E_ATTENDEE_NOT_SAVED", String.format("Attendees for event with id %s could not be saved", eventID), e);
          }
        }
      });
    } catch (Exception e) {
      promise.reject("E_ATTENDEE_NOT_SAVED", String.format("Attendees for event with id %s could not be saved", eventID), e);
    }
  }

  @ReactMethod
  public void deleteAttendeeAsync(final String attendeeID, final Promise promise) {
    if (isMissingPermissions()) {
      promise.reject("E_CANNOT_SAVE_CALENDAR", "User rejected permissions required to delete the attendee.");
      return;
    }
    try {
      AsyncTask.execute(new Runnable() {
        @Override
        public void run() {
          boolean successful = deleteAttendee(attendeeID);
          if (successful) {
            promise.resolve(null);
          } else {
            promise.reject("E_ATTENDEE_NOT_DELETED", String.format("Attendee with id %s could not be deleted", attendeeID));
          }
        }
      });
    } catch (Exception e) {
      promise.reject("E_ATTENDEE_NOT_DELETED", String.format("Attendee with id %s could not be deleted", attendeeID), e);
    }
  }

  @ReactMethod
  public void openEventInCalendar(int eventID) {
    Uri uri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventID);
    Intent sendIntent = new Intent(Intent.ACTION_VIEW).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK).setData(uri);

    if (sendIntent.resolveActivity(reactContext.getPackageManager()) != null) {
      reactContext.startActivity(sendIntent);
    }
  }

  private WritableNativeArray findCalendars() throws SecurityException {

    Cursor cursor = null;
    ContentResolver cr = reactContext.getContentResolver();

    Uri uri = CalendarContract.Calendars.CONTENT_URI;

    cursor = cr.query(uri, new String[]{
        CalendarContract.Calendars._ID,
        CalendarContract.Calendars.CALENDAR_DISPLAY_NAME,
        CalendarContract.Calendars.ACCOUNT_NAME,
        CalendarContract.Calendars.IS_PRIMARY,
        CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL,
        CalendarContract.Calendars.ALLOWED_AVAILABILITY,
        CalendarContract.Calendars.NAME,
        CalendarContract.Calendars.ACCOUNT_TYPE,
        CalendarContract.Calendars.CALENDAR_COLOR,
        CalendarContract.Calendars.OWNER_ACCOUNT,
        CalendarContract.Calendars.CALENDAR_TIME_ZONE,
        CalendarContract.Calendars.ALLOWED_REMINDERS,
        CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES,
        CalendarContract.Calendars.VISIBLE,
        CalendarContract.Calendars.SYNC_EVENTS
    }, null, null, null);

    return serializeEventCalendars(cursor);
  }

  private WritableNativeArray findEvents(Dynamic startDate, Dynamic endDate, ReadableArray calendars) {
    String dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";
    SimpleDateFormat sdf = new SimpleDateFormat(dateFormat);
    sdf.setTimeZone(TimeZone.getTimeZone("GMT"));

    Calendar eStartDate = Calendar.getInstance();
    Calendar eEndDate = Calendar.getInstance();

    try {
      if (startDate.getType() == ReadableType.String) {
        eStartDate.setTime(sdf.parse(startDate.asString()));
      } else if (startDate.getType() == ReadableType.Number) {
        eStartDate.setTimeInMillis((long) startDate.asDouble());
      }

      if (endDate.getType() == ReadableType.String) {
        eEndDate.setTime(sdf.parse(endDate.asString()));
      } else if (endDate.getType() == ReadableType.Number) {
        eEndDate.setTimeInMillis((long) endDate.asDouble());
      }
    } catch (ParseException e) {
      Log.e(TAG, "error parsing", e);
    } catch (Exception e) {
      Log.e(TAG, "misc error parsing", e);
    }

    Cursor cursor = null;
    ContentResolver cr = reactContext.getContentResolver();

    Uri.Builder uriBuilder = CalendarContract.Instances.CONTENT_URI.buildUpon();
    ContentUris.appendId(uriBuilder, eStartDate.getTimeInMillis());
    ContentUris.appendId(uriBuilder, eEndDate.getTimeInMillis());

    Uri uri = uriBuilder.build();

    String selection = "((" + CalendarContract.Instances.BEGIN + " >= " + eStartDate.getTimeInMillis() + ") " +
        "AND (" + CalendarContract.Instances.END + " <= " + eEndDate.getTimeInMillis() + ") " +
        "AND (" + CalendarContract.Instances.VISIBLE + " = 1) ";

    if (calendars.size() > 0) {
      String calendarQuery = "AND (";
      for (int i = 0; i < calendars.size(); i++) {
        calendarQuery += CalendarContract.Instances.CALENDAR_ID + " = " + calendars.getString(i);
        if (i != calendars.size() - 1) {
          calendarQuery += " OR ";
        }
      }
      calendarQuery += ")";
      selection += calendarQuery;
    }

    selection += ")";

    cursor = cr.query(uri, new String[]{
        CalendarContract.Instances.EVENT_ID,
        CalendarContract.Instances.TITLE,
        CalendarContract.Instances.DESCRIPTION,
        CalendarContract.Instances.BEGIN,
        CalendarContract.Instances.END,
        CalendarContract.Instances.ALL_DAY,
        CalendarContract.Instances.EVENT_LOCATION,
        CalendarContract.Instances.RRULE,
        CalendarContract.Instances.CALENDAR_ID,
        CalendarContract.Instances.AVAILABILITY,
        CalendarContract.Instances.ORGANIZER,
        CalendarContract.Instances.EVENT_TIMEZONE,
        CalendarContract.Instances.EVENT_END_TIMEZONE,
        CalendarContract.Instances.ACCESS_LEVEL,
        CalendarContract.Instances.GUESTS_CAN_MODIFY,
        CalendarContract.Instances.GUESTS_CAN_INVITE_OTHERS,
        CalendarContract.Instances.GUESTS_CAN_SEE_GUESTS,
        CalendarContract.Instances.ORIGINAL_ID,
        CalendarContract.Instances._ID
    }, selection, null, null);

    return serializeEvents(cursor);
  }

  private WritableNativeMap findEventById(String eventID) {

    WritableNativeMap result = new WritableNativeMap();
    Cursor cursor = null;
    ContentResolver cr = reactContext.getContentResolver();
    Uri uri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, Integer.parseInt(eventID));

    String selection = "((" + CalendarContract.Events.DELETED + " != 1))";

    cursor = cr.query(uri, new String[]{
        CalendarContract.Events._ID,
        CalendarContract.Events.TITLE,
        CalendarContract.Events.DESCRIPTION,
        CalendarContract.Events.DTSTART,
        CalendarContract.Events.DTEND,
        CalendarContract.Events.ALL_DAY,
        CalendarContract.Events.EVENT_LOCATION,
        CalendarContract.Events.RRULE,
        CalendarContract.Events.CALENDAR_ID,
        CalendarContract.Events.AVAILABILITY,
        CalendarContract.Events.ORGANIZER,
        CalendarContract.Events.EVENT_TIMEZONE,
        CalendarContract.Events.EVENT_END_TIMEZONE,
        CalendarContract.Events.ACCESS_LEVEL,
        CalendarContract.Events.GUESTS_CAN_MODIFY,
        CalendarContract.Events.GUESTS_CAN_INVITE_OTHERS,
        CalendarContract.Events.GUESTS_CAN_SEE_GUESTS,
        CalendarContract.Events.ORIGINAL_ID
    }, selection, null, null);

    if (cursor.getCount() > 0) {
      cursor.moveToFirst();
      result = serializeEvent(cursor);
    } else {
      result = null;
    }

    cursor.close();

    return result;
  }

  private WritableNativeMap findCalendarById(String calendarID) {

    WritableNativeMap result = new WritableNativeMap();
    Cursor cursor = null;
    ContentResolver cr = reactContext.getContentResolver();
    Uri uri = ContentUris.withAppendedId(CalendarContract.Calendars.CONTENT_URI, Integer.parseInt(calendarID));

    cursor = cr.query(uri, new String[]{
        CalendarContract.Calendars._ID,
        CalendarContract.Calendars.CALENDAR_DISPLAY_NAME,
        CalendarContract.Calendars.ACCOUNT_NAME,
        CalendarContract.Calendars.IS_PRIMARY,
        CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL,
        CalendarContract.Calendars.ALLOWED_AVAILABILITY,
        CalendarContract.Calendars.NAME,
        CalendarContract.Calendars.ACCOUNT_TYPE,
        CalendarContract.Calendars.CALENDAR_COLOR,
        CalendarContract.Calendars.OWNER_ACCOUNT,
        CalendarContract.Calendars.CALENDAR_TIME_ZONE,
        CalendarContract.Calendars.ALLOWED_REMINDERS,
        CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES,
        CalendarContract.Calendars.VISIBLE,
        CalendarContract.Calendars.SYNC_EVENTS
    }, null, null, null);

    if (cursor.getCount() > 0) {
      cursor.moveToFirst();
      result = serializeEventCalendar(cursor);
    } else {
      result = null;
    }

    cursor.close();

    return result;
  }

  private WritableNativeArray findAttendeesByEventId(String eventID) {

    WritableNativeMap result = new WritableNativeMap();
    Cursor cursor = null;
    ContentResolver cr = reactContext.getContentResolver();

    cursor = CalendarContract.Attendees.query(cr, Long.parseLong(eventID), new String[]{
        CalendarContract.Attendees._ID,
        CalendarContract.Attendees.ATTENDEE_NAME,
        CalendarContract.Attendees.ATTENDEE_EMAIL,
        CalendarContract.Attendees.ATTENDEE_RELATIONSHIP,
        CalendarContract.Attendees.ATTENDEE_TYPE,
        CalendarContract.Attendees.ATTENDEE_STATUS
    });

    return serializeAttendees(cursor);
  }

  private int saveCalendar(ReadableMap details) throws Exception, SecurityException {
    ContentResolver cr = reactContext.getContentResolver();
    ContentValues calendarValues = new ContentValues();

    if (details.hasKey("name")) {
      calendarValues.put(CalendarContract.Calendars.NAME, details.getString("name"));
    }

    if (details.hasKey("title")) {
      calendarValues.put(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME, details.getString("title"));
    }

    if (details.hasKey("isVisible")) {
      calendarValues.put(CalendarContract.Calendars.VISIBLE, details.getBoolean("isVisible") ? 1 : 0);
    }

    if (details.hasKey("isSynced")) {
      calendarValues.put(CalendarContract.Calendars.SYNC_EVENTS, details.getBoolean("isSynced") ? 1 : 0);
    }

    if (details.hasKey("id")) {
      int calendarID = Integer.parseInt(details.getString("id"));
      Uri updateUri = ContentUris.withAppendedId(CalendarContract.Calendars.CONTENT_URI, calendarID);
      cr.update(updateUri, calendarValues, null, null);
      return calendarID;
    } else {
      // required fields for new calendars
      if (!details.hasKey("source")) {
        throw new Exception("new calendars require `source` object");
      }
      if (!details.hasKey("name")) {
        throw new Exception("new calendars require `name`");
      }
      if (!details.hasKey("title")) {
        throw new Exception("new calendars require `title`");
      }
      if (!details.hasKey("color")) {
        throw new Exception("new calendars require `color`");
      }
      if (!details.hasKey("accessLevel")) {
        throw new Exception("new calendars require `accessLevel`");
      }
      if (!details.hasKey("ownerAccount")) {
        throw new Exception("new calendars require `ownerAccount`");
      }

      ReadableMap source = details.getMap("source");

      if (!source.hasKey("name")) {
        throw new Exception("new calendars require a `source` object with a `name`");
      }

      Boolean isLocalAccount = false;
      if (source.hasKey("isLocalAccount")) {
        isLocalAccount = source.getBoolean("isLocalAccount");
      }

      if (!source.hasKey("type") && isLocalAccount == false) {
        throw new Exception("new calendars require a `source` object with a `type`, or `isLocalAccount`: true");
      }

      calendarValues.put(CalendarContract.Calendars.ACCOUNT_NAME, source.getString("name"));
      calendarValues.put(CalendarContract.Calendars.ACCOUNT_TYPE, isLocalAccount ? CalendarContract.ACCOUNT_TYPE_LOCAL : source.getString("type"));
      calendarValues.put(CalendarContract.Calendars.CALENDAR_COLOR, details.getInt("color"));
      calendarValues.put(CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL, calAccessConstantMatchingString(details.getString("accessLevel")));
      calendarValues.put(CalendarContract.Calendars.OWNER_ACCOUNT, details.getString("ownerAccount"));
      // end required fields

      if (details.hasKey("timeZone")) {
        calendarValues.put(CalendarContract.Calendars.CALENDAR_TIME_ZONE, details.getString("timeZone"));
      }

      if (details.hasKey("allowedReminders")) {
        ReadableArray array = details.getArray("allowedReminders");
        Integer[] values = new Integer[array.size()];
        for (int i = 0; i < array.size(); i++) {
          values[i] = reminderConstantMatchingString(array.getString(i));
        }
        calendarValues.put(CalendarContract.Calendars.ALLOWED_REMINDERS, TextUtils.join(",", values));
      }

      if (details.hasKey("allowedAvailabilities")) {
        ReadableArray array = details.getArray("allowedAvailabilities");
        Integer[] values = new Integer[array.size()];
        for (int i = 0; i < array.size(); i++) {
          values[i] = availabilityConstantMatchingString(array.getString(i));
        }
        calendarValues.put(CalendarContract.Calendars.ALLOWED_AVAILABILITY, TextUtils.join(",", values));
      }

      if (details.hasKey("allowedAttendeeTypes")) {
        ReadableArray array = details.getArray("allowedAttendeeTypes");
        Integer[] values = new Integer[array.size()];
        for (int i = 0; i < array.size(); i++) {
          values[i] = attendeeTypeConstantMatchingString(array.getString(i));
        }
        calendarValues.put(CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES, TextUtils.join(",", values));
      }


      Uri.Builder uriBuilder = CalendarContract.Calendars.CONTENT_URI.buildUpon();
      uriBuilder.appendQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER, "true");
      uriBuilder.appendQueryParameter(CalendarContract.Calendars.ACCOUNT_NAME, source.getString("name"));
      uriBuilder.appendQueryParameter(CalendarContract.Calendars.ACCOUNT_TYPE, isLocalAccount ? CalendarContract.ACCOUNT_TYPE_LOCAL : source.getString("type"));

      Uri calendarsUri = uriBuilder.build();

      Uri calendarUri = cr.insert(calendarsUri, calendarValues);
      return Integer.parseInt(calendarUri.getLastPathSegment());
    }
  }

  private boolean deleteCalendar(String calendarId) throws SecurityException {
    int rows = 0;

    ContentResolver cr = reactContext.getContentResolver();
    Uri uri = ContentUris.withAppendedId(CalendarContract.Calendars.CONTENT_URI, Integer.parseInt(calendarId));

    rows = cr.delete(uri, null, null);

    return rows > 0;
  }

  private int saveEvent(ReadableMap details) throws ParseException, SecurityException {
    String dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";
    SimpleDateFormat sdf = new SimpleDateFormat(dateFormat);
    sdf.setTimeZone(TimeZone.getTimeZone("GMT"));

    ContentResolver cr = reactContext.getContentResolver();
    ContentValues eventValues = new ContentValues();

    if (details.hasKey("title")) {
      eventValues.put(CalendarContract.Events.TITLE, details.getString("title"));
    }
    if (details.hasKey("notes")) {
      eventValues.put(CalendarContract.Events.DESCRIPTION, details.getString("notes"));
    }
    if (details.hasKey("location")) {
      eventValues.put(CalendarContract.Events.EVENT_LOCATION, details.getString("location"));
    }

    if (details.hasKey("startDate")) {
      Calendar startCal = Calendar.getInstance();
      ReadableType type = details.getType("startDate");

      try {
        if (type == ReadableType.String) {
          startCal.setTime(sdf.parse(details.getString("startDate")));
          eventValues.put(CalendarContract.Events.DTSTART, startCal.getTimeInMillis());
        } else if (type == ReadableType.Number) {
          eventValues.put(CalendarContract.Events.DTSTART, (long) details.getDouble("startDate"));
        }
      } catch (ParseException e) {
        Log.e(TAG, "error", e);
        throw e;
      }
    }

    if (details.hasKey("endDate")) {
      Calendar endCal = Calendar.getInstance();
      ReadableType type = details.getType("endDate");

      try {
        if (type == ReadableType.String) {
          endCal.setTime(sdf.parse(details.getString("endDate")));
          eventValues.put(CalendarContract.Events.DTEND, endCal.getTimeInMillis());
        } else if (type == ReadableType.Number) {
          eventValues.put(CalendarContract.Events.DTEND, (long) details.getDouble("endDate"));
        }
      } catch (ParseException e) {
        Log.e(TAG, "error", e);
        throw e;
      }
    }

    if (details.hasKey("recurrenceRule")) {
      ReadableMap recurrenceRule = details.getMap("recurrenceRule");

      if (recurrenceRule.hasKey("frequency")) {
        String frequency = recurrenceRule.getString("frequency");
        Integer interval = null;
        Integer occurrence = null;
        String endDate = null;

        if (recurrenceRule.hasKey("interval")) {
          interval = recurrenceRule.getInt("interval");
        }

        if (recurrenceRule.hasKey("occurrence")) {
          occurrence = recurrenceRule.getInt("occurrence");
        }

        if (recurrenceRule.hasKey("endDate")) {
          ReadableType type = recurrenceRule.getType("endDate");
          SimpleDateFormat format = new SimpleDateFormat("yyyyMMdd'T'HHmmss'Z'");

          if (type == ReadableType.String) {
            endDate = format.format(sdf.parse(recurrenceRule.getString("endDate")));
          } else if (type == ReadableType.Number) {
            Calendar calendar = Calendar.getInstance();
            calendar.setTimeInMillis((long) recurrenceRule.getDouble("endDate"));
            endDate = format.format(calendar.getTime());
          }
        }

        String rule = createRecurrenceRule(frequency, interval, endDate, occurrence);
        if (rule != null) {
          eventValues.put(CalendarContract.Events.RRULE, rule);
        }
      }
    }

    if (details.hasKey("allDay")) {
      eventValues.put(CalendarContract.Events.ALL_DAY, details.getBoolean("allDay") ? 1 : 0);
    }

    if (details.hasKey("alarms")) {
      eventValues.put(CalendarContract.Events.HAS_ALARM, true);
    }

    if (details.hasKey("availability")) {
      eventValues.put(CalendarContract.Events.AVAILABILITY, availabilityConstantMatchingString(details.getString("availability")));
    }

    if (details.hasKey("organizer_email")) {
      eventValues.put(CalendarContract.Events.ORGANIZER, details.getString("organizerEmail"));
    }

    if (details.hasKey("timeZone")) {
      eventValues.put(CalendarContract.Events.EVENT_TIMEZONE, details.getString("timeZone"));
    }

    if (details.hasKey("endTimeZone")) {
      eventValues.put(CalendarContract.Events.EVENT_END_TIMEZONE, details.getString("endTimeZone"));
    }

    if (details.hasKey("accessLevel")) {
      eventValues.put(CalendarContract.Events.ACCESS_LEVEL, accessConstantMatchingString(details.getString("accessLevel")));
    }

    if (details.hasKey("guestsCanModify")) {
      eventValues.put(CalendarContract.Events.GUESTS_CAN_MODIFY, details.getBoolean("guestsCanModify") ? 1 : 0);
    }

    if (details.hasKey("guestsCanInviteOthers")) {
      eventValues.put(CalendarContract.Events.GUESTS_CAN_INVITE_OTHERS, details.getBoolean("guestsCanInviteOthers") ? 1 : 0);
    }

    if (details.hasKey("guestsCanSeeGuests")) {
      eventValues.put(CalendarContract.Events.GUESTS_CAN_SEE_GUESTS, details.getBoolean("guestsCanSeeGuests") ? 1 : 0);
    }

    if (details.hasKey("id")) {
      int eventID = Integer.parseInt(details.getString("id"));
      Uri updateUri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventID);
      cr.update(updateUri, eventValues, null, null);

      removeRemindersForEvent(cr, eventID);
      if (details.hasKey("alarms")) {
        createRemindersForEvent(cr, eventID, details.getArray("alarms"));
      }
      return eventID;
    } else {

      if (details.hasKey("calendarId")) {
        WritableNativeMap calendar = findCalendarById(details.getString("calendarId"));

        if (calendar != null) {
          eventValues.put(CalendarContract.Events.CALENDAR_ID, Integer.parseInt(calendar.getString("id")));
        } else {
          eventValues.put(CalendarContract.Events.CALENDAR_ID, 1);
        }

      } else {
        eventValues.put(CalendarContract.Events.CALENDAR_ID, 1);
      }

      Uri eventsUri = CalendarContract.Events.CONTENT_URI;
      Uri eventUri = cr.insert(eventsUri, eventValues);
      int eventID = Integer.parseInt(eventUri.getLastPathSegment());

      if (details.hasKey("alarms")) {
        createRemindersForEvent(cr, eventID, details.getArray("alarms"));
      }
      return eventID;
    }
  }

  private boolean removeEvent(ReadableMap details) throws ParseException, SecurityException {
    int rows = 0;

    Integer eventID = Integer.parseInt(details.getString("id"));

    ContentResolver cr = reactContext.getContentResolver();

    if (!details.hasKey("instanceStartDate")) {
      Uri uri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventID);
      rows = cr.delete(uri, null, null);
      return rows > 0;
    } else {
      ContentValues exceptionValues = new ContentValues();
      String dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";
      SimpleDateFormat sdf = new SimpleDateFormat(dateFormat);
      sdf.setTimeZone(TimeZone.getTimeZone("GMT"));

      Calendar startCal = Calendar.getInstance();
      ReadableType type = details.getType("instanceStartDate");

      try {
        if (type == ReadableType.String) {
          startCal.setTime(sdf.parse(details.getString("instanceStartDate")));
          exceptionValues.put(CalendarContract.Events.ORIGINAL_INSTANCE_TIME, startCal.getTimeInMillis());
        } else if (type == ReadableType.Number) {
          exceptionValues.put(CalendarContract.Events.ORIGINAL_INSTANCE_TIME, (long) details.getDouble("instanceStartDate"));
        }
      } catch (ParseException e) {
        Log.e(TAG, "error", e);
        throw e;
      }

      exceptionValues.put(CalendarContract.Events.STATUS, CalendarContract.Events.STATUS_CANCELED);

      Uri exceptionUri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_EXCEPTION_URI, eventID);
      cr.insert(exceptionUri, exceptionValues);
    }

    return true;
  }

  private int saveAttendeeForEvent(ReadableMap details, String eventID) throws Exception, SecurityException {
    ContentResolver cr = reactContext.getContentResolver();
    ContentValues attendeeValues = new ContentValues();
    boolean isNew = !details.hasKey("id");

    if (details.hasKey("name")) {
      attendeeValues.put(CalendarContract.Attendees.ATTENDEE_NAME, details.getString("name"));
    }

    if (details.hasKey("email")) {
      attendeeValues.put(CalendarContract.Attendees.ATTENDEE_EMAIL, details.getString("email"));
    } else {
      if (isNew) {
        throw new Exception("new attendees require `email`");
      }
    }

    if (details.hasKey("role")) {
      attendeeValues.put(CalendarContract.Attendees.ATTENDEE_RELATIONSHIP, attendeeRelationshipConstantMatchingString(details.getString("role")));
    } else {
      if (isNew) {
        throw new Exception("new attendees require `role`");
      }
    }

    if (details.hasKey("type")) {
      attendeeValues.put(CalendarContract.Attendees.ATTENDEE_TYPE, attendeeTypeConstantMatchingString(details.getString("type")));
    } else {
      if (isNew) {
        throw new Exception("new attendees require `type`");
      }
    }

    if (details.hasKey("status")) {
      attendeeValues.put(CalendarContract.Attendees.ATTENDEE_STATUS, attendeeStatusConstantMatchingString(details.getString("status")));
    } else {
      if (isNew) {
        throw new Exception("new attendees require `status`");
      }
    }

    if (isNew) {
      attendeeValues.put(CalendarContract.Attendees.EVENT_ID, Integer.parseInt(eventID));
      Uri attendeesUri = CalendarContract.Attendees.CONTENT_URI;
      Uri attendeeUri = cr.insert(attendeesUri, attendeeValues);
      return Integer.parseInt(attendeeUri.getLastPathSegment());
    } else {
      int attendeeID = Integer.parseInt(details.getString("id"));
      Uri updateUri = ContentUris.withAppendedId(CalendarContract.Attendees.CONTENT_URI, attendeeID);
      cr.update(updateUri, attendeeValues, null, null);
      return attendeeID;
    }
  }

  private boolean deleteAttendee(String attendeeID) throws SecurityException {
    int rows = 0;

    ContentResolver cr = reactContext.getContentResolver();
    Uri uri = ContentUris.withAppendedId(CalendarContract.Attendees.CONTENT_URI, Integer.parseInt(attendeeID));

    rows = cr.delete(uri, null, null);

    return rows > 0;
  }

  private void createRemindersForEvent(ContentResolver resolver, int eventID, ReadableArray reminders) throws SecurityException {
    for (int i = 0; i < reminders.size(); i++) {
      ReadableMap reminder = reminders.getMap(i);
      ReadableType type = reminder.getType("relativeOffset");
      if (type == ReadableType.Number) {
        int minutes = -reminder.getInt("relativeOffset");
        ContentValues reminderValues = new ContentValues();

        int method = CalendarContract.Reminders.METHOD_DEFAULT;
        if (reminder.hasKey("method")) {
          method = reminderConstantMatchingString(reminder.getString("method"));
        }

        reminderValues.put(CalendarContract.Reminders.EVENT_ID, eventID);
        reminderValues.put(CalendarContract.Reminders.MINUTES, minutes);
        reminderValues.put(CalendarContract.Reminders.METHOD, method);

        resolver.insert(CalendarContract.Reminders.CONTENT_URI, reminderValues);
      }
    }
  }

  private void removeRemindersForEvent(ContentResolver resolver, int eventID) throws SecurityException {
    Cursor cursor = CalendarContract.Reminders.query(resolver, eventID, new String[]{
        CalendarContract.Reminders._ID
    });

    while (cursor.moveToNext()) {
      Uri reminderUri = ContentUris.withAppendedId(CalendarContract.Reminders.CONTENT_URI, cursor.getLong(0));
      resolver.delete(reminderUri, null, null);
    }
  }

  private String reminderStringMatchingConstant(Integer constant) {
    switch (constant) {
      case CalendarContract.Reminders.METHOD_ALARM:
        return "alarm";
      case CalendarContract.Reminders.METHOD_ALERT:
        return "alert";
      case CalendarContract.Reminders.METHOD_EMAIL:
        return "email";
      case CalendarContract.Reminders.METHOD_SMS:
        return "sms";
      case CalendarContract.Reminders.METHOD_DEFAULT:
      default:
        return "default";
    }
  }

  private Integer reminderConstantMatchingString(String string) {
    if (string.equals("alert")) {
      return CalendarContract.Reminders.METHOD_ALERT;
    }
    if (string.equals("alarm")) {
      return CalendarContract.Reminders.METHOD_ALARM;
    }
    if (string.equals("email")) {
      return CalendarContract.Reminders.METHOD_EMAIL;
    }
    if (string.equals("sms")) {
      return CalendarContract.Reminders.METHOD_SMS;
    }
    return CalendarContract.Reminders.METHOD_DEFAULT;
  }

  private WritableNativeArray calendarAllowedRemindersFromDBString(String dbString) {
    WritableNativeArray array = new WritableNativeArray();
    for (String constant : dbString.split(",")) {
      array.pushString(reminderStringMatchingConstant(Integer.parseInt(constant)));
    }
    return array;
  }

  private WritableNativeArray calendarAllowedAvailabilitiesFromDBString(String dbString) {
    WritableNativeArray availabilitiesStrings = new WritableNativeArray();
    for (String availabilityId : dbString.split(",")) {
      switch (Integer.parseInt(availabilityId)) {
        case CalendarContract.Events.AVAILABILITY_BUSY:
          availabilitiesStrings.pushString("busy");
          break;
        case CalendarContract.Events.AVAILABILITY_FREE:
          availabilitiesStrings.pushString("free");
          break;
        case CalendarContract.Events.AVAILABILITY_TENTATIVE:
          availabilitiesStrings.pushString("tentative");
          break;
      }
    }

    return availabilitiesStrings;
  }

  private String availabilityStringMatchingConstant(Integer constant) {
    switch (constant) {
      case CalendarContract.Events.AVAILABILITY_BUSY:
      default:
        return "busy";
      case CalendarContract.Events.AVAILABILITY_FREE:
        return "free";
      case CalendarContract.Events.AVAILABILITY_TENTATIVE:
        return "tentative";
    }
  }

  private Integer availabilityConstantMatchingString(String string) throws IllegalArgumentException {
    if (string.equals("free")) {
      return CalendarContract.Events.AVAILABILITY_FREE;
    }

    if (string.equals("tentative")) {
      return CalendarContract.Events.AVAILABILITY_TENTATIVE;
    }

    return CalendarContract.Events.AVAILABILITY_BUSY;
  }

  private String accessStringMatchingConstant(Integer constant) {
    switch (constant) {
      case CalendarContract.Events.ACCESS_CONFIDENTIAL:
        return "confidential";
      case CalendarContract.Events.ACCESS_PRIVATE:
        return "private";
      case CalendarContract.Events.ACCESS_PUBLIC:
        return "public";
      case CalendarContract.Events.ACCESS_DEFAULT:
      default:
        return "default";
    }
  }

  private Integer accessConstantMatchingString(String string) {
    if (string.equals("confidential")) {
      return CalendarContract.Events.ACCESS_CONFIDENTIAL;
    }
    if (string.equals("private")) {
      return CalendarContract.Events.ACCESS_PRIVATE;
    }
    if (string.equals("public")) {
      return CalendarContract.Events.ACCESS_PUBLIC;
    }
    return CalendarContract.Events.ACCESS_DEFAULT;
  }

  private String calAccessStringMatchingConstant(Integer constant) {
    switch (constant) {
      case CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR:
        return "contributor";
      case CalendarContract.Calendars.CAL_ACCESS_EDITOR:
        return "editor";
      case CalendarContract.Calendars.CAL_ACCESS_FREEBUSY:
        return "freebusy";
      case CalendarContract.Calendars.CAL_ACCESS_OVERRIDE:
        return "override";
      case CalendarContract.Calendars.CAL_ACCESS_OWNER:
        return "owner";
      case CalendarContract.Calendars.CAL_ACCESS_READ:
        return "read";
      case CalendarContract.Calendars.CAL_ACCESS_RESPOND:
        return "respond";
      case CalendarContract.Calendars.CAL_ACCESS_ROOT:
        return "root";
      case CalendarContract.Calendars.CAL_ACCESS_NONE:
      default:
        return "none";
    }
  }

  private Integer calAccessConstantMatchingString(String string) {
    if (string.equals("contributor")) {
      return CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR;
    }
    if (string.equals("editor")) {
      return CalendarContract.Calendars.CAL_ACCESS_EDITOR;
    }
    if (string.equals("freebusy")) {
      return CalendarContract.Calendars.CAL_ACCESS_FREEBUSY;
    }
    if (string.equals("override")) {
      return CalendarContract.Calendars.CAL_ACCESS_OVERRIDE;
    }
    if (string.equals("owner")) {
      return CalendarContract.Calendars.CAL_ACCESS_OWNER;
    }
    if (string.equals("read")) {
      return CalendarContract.Calendars.CAL_ACCESS_READ;
    }
    if (string.equals("respond")) {
      return CalendarContract.Calendars.CAL_ACCESS_RESPOND;
    }
    if (string.equals("root")) {
      return CalendarContract.Calendars.CAL_ACCESS_ROOT;
    }
    return CalendarContract.Calendars.CAL_ACCESS_NONE;
  }

  private String attendeeRelationshipStringMatchingConstant(Integer constant) {
    switch (constant) {
      case CalendarContract.Attendees.RELATIONSHIP_ATTENDEE:
        return "attendee";
      case CalendarContract.Attendees.RELATIONSHIP_ORGANIZER:
        return "organizer";
      case CalendarContract.Attendees.RELATIONSHIP_PERFORMER:
        return "performer";
      case CalendarContract.Attendees.RELATIONSHIP_SPEAKER:
        return "speaker";
      case CalendarContract.Attendees.RELATIONSHIP_NONE:
      default:
        return "none";
    }
  }

  private Integer attendeeRelationshipConstantMatchingString(String string) {
    if (string.equals("attendee")) {
      return CalendarContract.Attendees.RELATIONSHIP_ATTENDEE;
    }
    if (string.equals("organizer")) {
      return CalendarContract.Attendees.RELATIONSHIP_ORGANIZER;
    }
    if (string.equals("performer")) {
      return CalendarContract.Attendees.RELATIONSHIP_PERFORMER;
    }
    if (string.equals("speaker")) {
      return CalendarContract.Attendees.RELATIONSHIP_SPEAKER;
    }
    return CalendarContract.Attendees.RELATIONSHIP_NONE;
  }

  private String attendeeTypeStringMatchingConstant(Integer constant) {
    switch (constant) {
      case CalendarContract.Attendees.TYPE_OPTIONAL:
        return "optional";
      case CalendarContract.Attendees.TYPE_REQUIRED:
        return "required";
      case CalendarContract.Attendees.TYPE_RESOURCE:
        return "resource";
      case CalendarContract.Attendees.TYPE_NONE:
      default:
        return "none";
    }
  }

  private Integer attendeeTypeConstantMatchingString(String string) {
    if (string.equals("optional")) {
      return CalendarContract.Attendees.TYPE_OPTIONAL;
    }
    if (string.equals("required")) {
      return CalendarContract.Attendees.TYPE_REQUIRED;
    }
    if (string.equals("resource")) {
      return CalendarContract.Attendees.TYPE_RESOURCE;
    }
    return CalendarContract.Attendees.TYPE_NONE;
  }

  private WritableNativeArray calendarAllowedAttendeeTypesFromDBString(String dbString) {
    WritableNativeArray array = new WritableNativeArray();
    for (String constant : dbString.split(",")) {
      array.pushString(attendeeTypeStringMatchingConstant(Integer.parseInt(constant)));
    }
    return array;
  }

  private String attendeeStatusStringMatchingConstant(Integer constant) {
    switch (constant) {
      case CalendarContract.Attendees.ATTENDEE_STATUS_ACCEPTED:
        return "accepted";
      case CalendarContract.Attendees.ATTENDEE_STATUS_DECLINED:
        return "declined";
      case CalendarContract.Attendees.ATTENDEE_STATUS_INVITED:
        return "invited";
      case CalendarContract.Attendees.ATTENDEE_STATUS_TENTATIVE:
        return "tentative";
      case CalendarContract.Attendees.ATTENDEE_STATUS_NONE:
      default:
        return "none";
    }
  }

  private Integer attendeeStatusConstantMatchingString(String string) {
    if (string.equals("accepted")) {
      return CalendarContract.Attendees.ATTENDEE_STATUS_ACCEPTED;
    }
    if (string.equals("declined")) {
      return CalendarContract.Attendees.ATTENDEE_STATUS_DECLINED;
    }
    if (string.equals("invited")) {
      return CalendarContract.Attendees.ATTENDEE_STATUS_INVITED;
    }
    if (string.equals("tentative")) {
      return CalendarContract.Attendees.ATTENDEE_STATUS_TENTATIVE;
    }
    return CalendarContract.Attendees.ATTENDEE_STATUS_NONE;
  }

  private String createRecurrenceRule(String recurrence, Integer interval, String endDate, Integer occurrence) {
    String rrule = "";

    if (recurrence.equals("daily")) {
      rrule = "FREQ=DAILY";
    } else if (recurrence.equals("weekly")) {
      rrule = "FREQ=WEEKLY";
    } else if (recurrence.equals("monthly")) {
      rrule = "FREQ=MONTHLY";
    } else if (recurrence.equals("yearly")) {
      rrule = "FREQ=YEARLY";
    } else {
      return null;
    }

    if (interval != null) {
      rrule += ";INTERVAL=" + interval;
    }

    if (endDate != null) {
      rrule += ";UNTIL=" + endDate;
    } else if (occurrence != null) {
      rrule += ";COUNT=" + occurrence;
    }

    return rrule;
  }

  private WritableNativeArray serializeEvents(Cursor cursor) {
    WritableNativeArray results = new WritableNativeArray();

    while (cursor.moveToNext()) {
      results.pushMap(serializeEvent(cursor));
    }

    cursor.close();

    return results;
  }

  private WritableNativeMap serializeEvent(Cursor cursor) {
    WritableNativeMap event = new WritableNativeMap();

    String dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";
    SimpleDateFormat sdf = new SimpleDateFormat(dateFormat);
    sdf.setTimeZone(TimeZone.getTimeZone("GMT"));

    Calendar foundStartDate = Calendar.getInstance();
    Calendar foundEndDate = Calendar.getInstance();

    String startDateUTC = "";
    String endDateUTC = "";

    // may be CalendarContract.Instances.BEGIN or CalendarContract.Events.DTSTART (which have different string values)
    String startDate = cursor.getString(3);
    if (startDate != null) {
      foundStartDate.setTimeInMillis(Long.parseLong(startDate));
      startDateUTC = sdf.format(foundStartDate.getTime());
    }

    // may be CalendarContract.Instances.END or CalendarContract.Events.DTEND (which have different string values)
    String endDate = cursor.getString(4);
    if (endDate != null) {
      foundEndDate.setTimeInMillis(Long.parseLong(endDate));
      endDateUTC = sdf.format(foundEndDate.getTime());
    }

    String rrule = optStringFromCursor(cursor, CalendarContract.Events.RRULE);
    if (rrule != null) {
      WritableNativeMap recurrenceRule = new WritableNativeMap();
      String[] recurrenceRules = rrule.split(";");
      SimpleDateFormat format = new SimpleDateFormat("yyyyMMdd'T'HHmmss'Z'");

      recurrenceRule.putString("frequency", recurrenceRules[0].split("=")[1].toLowerCase());

      if (recurrenceRules.length >= 2 && recurrenceRules[1].split("=")[0].equals("INTERVAL")) {
        recurrenceRule.putInt("interval", Integer.parseInt(recurrenceRules[1].split("=")[1]));
      }

      if (recurrenceRules.length >= 3) {
        if (recurrenceRules[2].split("=")[0].equals("UNTIL")) {
          try {
            recurrenceRule.putString("endDate", sdf.format(format.parse(recurrenceRules[2].split("=")[1])));
          } catch (ParseException e) {
            Log.e(TAG, "error", e);
          }
        } else if (recurrenceRules[2].split("=")[0].equals("COUNT")) {
          recurrenceRule.putInt("occurrence", Integer.parseInt(recurrenceRules[2].split("=")[1]));
        }

      }

      event.putMap("recurrenceRule", recurrenceRule);
    }


    // may be CalendarContract.Instances.EVENT_ID or CalendarContract.Events._ID (which have different string values)
    event.putString("id", cursor.getString(0));
    event.putString("calendarId", optStringFromCursor(cursor, CalendarContract.Events.CALENDAR_ID));
    event.putString("title", optStringFromCursor(cursor, CalendarContract.Events.TITLE));
    event.putString("notes", optStringFromCursor(cursor, CalendarContract.Events.DESCRIPTION));
    event.putString("startDate", startDateUTC);
    event.putString("endDate", endDateUTC);
    event.putBoolean("allDay", optIntFromCursor(cursor, CalendarContract.Events.ALL_DAY) != 0);
    event.putString("location", optStringFromCursor(cursor, CalendarContract.Events.EVENT_LOCATION));
    event.putString("availability", availabilityStringMatchingConstant(optIntFromCursor(cursor, CalendarContract.Events.AVAILABILITY)));
    event.putArray("alarms", serializeAlarms(cursor.getLong(0)));
    event.putString("organizerEmail", optStringFromCursor(cursor, CalendarContract.Events.ORGANIZER));
    event.putString("timeZone", optStringFromCursor(cursor, CalendarContract.Events.EVENT_TIMEZONE));
    event.putString("endTimeZone", optStringFromCursor(cursor, CalendarContract.Events.EVENT_END_TIMEZONE));
    event.putString("accessLevel", accessStringMatchingConstant(optIntFromCursor(cursor, CalendarContract.Events.ACCESS_LEVEL)));
    event.putBoolean("guestsCanModify", optIntFromCursor(cursor, CalendarContract.Events.GUESTS_CAN_MODIFY) != 0);
    event.putBoolean("guestsCanInviteOthers", optIntFromCursor(cursor, CalendarContract.Events.GUESTS_CAN_INVITE_OTHERS) != 0);
    event.putBoolean("guestsCanSeeGuests", optIntFromCursor(cursor, CalendarContract.Events.GUESTS_CAN_SEE_GUESTS) != 0);
    event.putString("originalId", optStringFromCursor(cursor, CalendarContract.Events.ORIGINAL_ID));

    // unfortunately the string values of CalendarContract.Events._ID and CalendarContract.Instances._ID are equal
    // so we'll use the somewhat brittle column number from the query
    if (cursor.getColumnCount() > 18) {
      event.putString("instanceId", cursor.getString(18));
    }

    return event;
  }

  private WritableNativeArray serializeAlarms(long eventID) {
    WritableNativeArray alarms = new WritableNativeArray();
    ContentResolver cr = reactContext.getContentResolver();
    Cursor cursor = CalendarContract.Reminders.query(cr, eventID, new String[]{
        CalendarContract.Reminders.MINUTES,
        CalendarContract.Reminders.METHOD
    });

    while (cursor.moveToNext()) {
      WritableNativeMap thisAlarm = new WritableNativeMap();
      thisAlarm.putInt("relativeOffset", -cursor.getInt(0));
      int method = cursor.getInt(1);
      thisAlarm.putString("method", reminderStringMatchingConstant(method));
      alarms.pushMap(thisAlarm);
    }

    return alarms;
  }

  private WritableNativeArray serializeEventCalendars(Cursor cursor) {
    WritableNativeArray results = new WritableNativeArray();

    while (cursor.moveToNext()) {
      results.pushMap(serializeEventCalendar(cursor));
    }

    cursor.close();

    return results;
  }

  private WritableNativeMap serializeEventCalendar(Cursor cursor) {

    WritableNativeMap calendar = new WritableNativeMap();

    calendar.putString("id", optStringFromCursor(cursor, CalendarContract.Calendars._ID));
    calendar.putString("title", optStringFromCursor(cursor, CalendarContract.Calendars.CALENDAR_DISPLAY_NAME));
    calendar.putBoolean("isPrimary", optStringFromCursor(cursor, CalendarContract.Calendars.IS_PRIMARY) == "1");
    calendar.putArray("allowedAvailabilities", calendarAllowedAvailabilitiesFromDBString(optStringFromCursor(cursor, CalendarContract.Calendars.ALLOWED_AVAILABILITY)));
    calendar.putString("name", optStringFromCursor(cursor, CalendarContract.Calendars.NAME));
    calendar.putString("color", String.format("#%06X", (0xFFFFFF & optIntFromCursor(cursor, CalendarContract.Calendars.CALENDAR_COLOR))));
    calendar.putString("ownerAccount", optStringFromCursor(cursor, CalendarContract.Calendars.OWNER_ACCOUNT));
    calendar.putString("timeZone", optStringFromCursor(cursor, CalendarContract.Calendars.CALENDAR_TIME_ZONE));
    calendar.putArray("allowedReminders", calendarAllowedRemindersFromDBString(optStringFromCursor(cursor, CalendarContract.Calendars.ALLOWED_REMINDERS)));
    calendar.putArray("allowedAttendeeTypes", calendarAllowedAttendeeTypesFromDBString(optStringFromCursor(cursor, CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES)));
    calendar.putBoolean("isVisible", optIntFromCursor(cursor, CalendarContract.Calendars.VISIBLE) != 0);
    calendar.putBoolean("isSynced", optIntFromCursor(cursor, CalendarContract.Calendars.SYNC_EVENTS) != 0);

    WritableNativeMap source = new WritableNativeMap();
    source.putString("name", optStringFromCursor(cursor, CalendarContract.Calendars.ACCOUNT_NAME));
    String type = optStringFromCursor(cursor, CalendarContract.Calendars.ACCOUNT_TYPE);
    source.putString("type", type);
    source.putBoolean("isLocalAccount", type.equals(CalendarContract.ACCOUNT_TYPE_LOCAL));
    calendar.putMap("source", source);

    int accessLevel = optIntFromCursor(cursor, CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL);
    calendar.putString("accessLevel", calAccessStringMatchingConstant(accessLevel));

    if (accessLevel == CalendarContract.Calendars.CAL_ACCESS_ROOT ||
        accessLevel == CalendarContract.Calendars.CAL_ACCESS_OWNER ||
        accessLevel == CalendarContract.Calendars.CAL_ACCESS_EDITOR ||
        accessLevel == CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR) {
      calendar.putBoolean("allowsModifications", true);
    } else {
      calendar.putBoolean("allowsModifications", false);
    }

    return calendar;
  }

  private WritableNativeArray serializeAttendees(Cursor cursor) {
    WritableNativeArray results = new WritableNativeArray();

    while (cursor.moveToNext()) {
      results.pushMap(serializeAttendee(cursor));
    }

    cursor.close();

    return results;
  }

  private WritableNativeMap serializeAttendee(Cursor cursor) {

    WritableNativeMap attendee = new WritableNativeMap();

    attendee.putString("id", optStringFromCursor(cursor, CalendarContract.Attendees._ID));
    attendee.putString("name", optStringFromCursor(cursor, CalendarContract.Attendees.ATTENDEE_NAME));
    attendee.putString("email", optStringFromCursor(cursor, CalendarContract.Attendees.ATTENDEE_EMAIL));
    attendee.putString("role", attendeeRelationshipStringMatchingConstant(optIntFromCursor(cursor, CalendarContract.Attendees.ATTENDEE_RELATIONSHIP)));
    attendee.putString("type", attendeeTypeStringMatchingConstant(optIntFromCursor(cursor, CalendarContract.Attendees.ATTENDEE_TYPE)));
    attendee.putString("status", attendeeStatusStringMatchingConstant(optIntFromCursor(cursor, CalendarContract.Attendees.ATTENDEE_STATUS)));

    return attendee;
  }

  private String optStringFromCursor(Cursor cursor, String columnName) {
    int index = cursor.getColumnIndex(columnName);
    if (index == -1) {
      return null;
    }
    return cursor.getString(index);
  }

  private int optIntFromCursor(Cursor cursor, String columnName) {
    int index = cursor.getColumnIndex(columnName);
    if (index == -1) {
      return 0;
    }
    return cursor.getInt(index);
  }

  private boolean isMissingPermissions() {
    return !Exponent.getInstance().getPermissions(Manifest.permission.READ_CALENDAR, this.experienceId) &&
        !Exponent.getInstance().getPermissions(Manifest.permission.WRITE_CALENDAR, this.experienceId);
  }
}
