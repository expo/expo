// Copyright 2015-present 650 Industries. All rights reserved.

package versioned.host.exp.exponent.modules.api;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.pm.PackageManager;
import android.database.Cursor;

import android.net.Uri;
import android.os.Build;
import android.provider.ContactsContract;
import android.support.annotation.Nullable;
import android.support.v4.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

import host.exp.exponent.analytics.EXL;

import static android.provider.ContactsContract.*;

public class ContactsModule extends ReactContextBaseJavaModule {
  private static final String TAG = ContactsModule.class.getSimpleName();

  private static final String[] PROJECTION = new String[]{
      CommonDataKinds.Phone.CONTACT_ID,
      CommonDataKinds.Phone.NORMALIZED_NUMBER,
      CommonDataKinds.Email.DATA,
  };

  public ContactsModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "ExponentContacts";
  }

  /**
   * @param options Options including what fields to get and paging information.
   */
  @ReactMethod
  public void getContactsAsync(final ReadableMap options, final Promise promise) {
    if (isMissingPermissions()) {
      promise.reject("E_MISSING_PERMISSION", "Missing contacts permission.");
      return;
    }

    int pageOffset = options.getInt("pageOffset");
    int pageSize = options.getInt("pageSize");
    Set<String> fieldsSet = getFieldsSet(options.getArray("fields"));
    WritableArray contacts = Arguments.createArray();
    WritableMap response = Arguments.createMap();

    ContentResolver cr = getReactApplicationContext().getContentResolver();
    Cursor cursor = cr.query(CommonDataKinds.Phone.CONTENT_URI, PROJECTION, null, null, null);
    if (cursor != null) {
      try {
        cursor.move(pageOffset);
        int currentIndex = 0;

        final int contactIdIndex = cursor.getColumnIndex(CommonDataKinds.Phone.CONTACT_ID);
        while (cursor.moveToNext()) {
          if (currentIndex >= pageSize) {
            break;
          }

          WritableMap contact = Arguments.createMap();
          int id = (int) cursor.getLong(contactIdIndex);
          contact.putInt("id", id);

          contact = addIdentityFromContentResolver(fieldsSet, cr, contact, id);
          contact.putString("nickname", getNicknameFromContentResolver(cr, id));
          if (fieldsSet.contains("note")) {
            contact.putString("note", getNoteFromContentResolver(cr, id));
          }
          if (fieldsSet.contains("birthday")) {
            contact = addDatesFromContentResolver(cr, contact, id, true);
          }
          if (fieldsSet.contains("dates")) {
            contact = addDatesFromContentResolver(cr, contact, id, false);
          }
          if (fieldsSet.contains("instantMessageAddresses")) {
            contact = addInstantMessageAddressesFromContentResolver(id, contact, cr);
          }
          if (fieldsSet.contains("urlAddresses")) {
            contact = addUrlAddressesFromContentResolver(id, contact, cr);
          }

          Cursor imageCursor = cr.query(
              ContactsContract.Data.CONTENT_URI,
              null,
              ContactsContract.Data.CONTACT_ID + "= ? AND " +
                  ContactsContract.Data.MIMETYPE + "= ?",
              new String[] { Integer.toString(id), ContactsContract.CommonDataKinds.Photo.CONTENT_ITEM_TYPE },
              null
          );
          contact.putBoolean("imageAvailable", false);
          if (imageCursor != null) {
            try {
              if (imageCursor.moveToFirst()) {
                contact.putBoolean("imageAvailable", true);

                if (fieldsSet.contains("thumbnail")) {
                  Uri imageUri = Uri.withAppendedPath(
                      ContentUris.withAppendedId(ContactsContract.Contacts.CONTENT_URI, id),
                      ContactsContract.Contacts.Photo.CONTENT_DIRECTORY);

                  WritableMap thumbnail = Arguments.createMap();
                  thumbnail.putString("uri", imageUri.toString());
                  contact.putMap("thumbnail", thumbnail);
                }
              }
            } finally {
              imageCursor.close();
            }
          }

          String company = null;
          String jobTitle = null;

          HashMap<String, String> organization = getOrganizationFromContentResolver(id, cr);
          if (organization != null) {
            if (fieldsSet.contains("company")) {
              company = organization.get("company");
            }
            if (fieldsSet.contains("jobTitle")) {
              jobTitle = organization.get("jobTitle");
            }
          }

          WritableArray emails = fieldsSet.contains("emails") ? getEmailsFromContentResolver(id, cr) : null;
          WritableArray phoneNumbers = fieldsSet.contains("phoneNumbers") ? getPhoneNumbersFromContentResolver(id, cr) : null;
          WritableArray addresses = fieldsSet.contains("addresses") ? getAddressesFromContentResolver(id, cr) : null;

          if (emails != null && emails.size() > 0) {
            contact.putArray("emails", emails);
          }
          if (phoneNumbers != null && phoneNumbers.size() > 0) {
            contact.putArray("phoneNumbers", phoneNumbers);
          }
          if (addresses != null && addresses.size() > 0) {
            contact.putArray("addresses", addresses);
          }
          if (company != null && !company.isEmpty()) {
            contact.putString("company", company);
          }
          if (jobTitle != null && !jobTitle.isEmpty()) {
            contact.putString("jobTitle", jobTitle);
          }
          contacts.pushMap(contact);

          currentIndex++;
        }

        int total = cursor.getCount();
        response.putArray("data", contacts);
        response.putBoolean("hasPreviousPage", pageOffset > 0);
        response.putBoolean("hasNextPage", pageOffset + pageSize < total);
        response.putInt("total", total);
      } catch (Exception e) {
        EXL.e(TAG, e.getMessage());
        promise.reject(e);
      } finally {
        cursor.close();
      }
    }

    promise.resolve(response);
  }

  private WritableMap addIdentityFromContentResolver(Set<String> fieldsSet, ContentResolver cr, WritableMap contact, int id) {
    Cursor cursor = cr.query(
        Data.CONTENT_URI,
        null,
        Data.CONTACT_ID + " = ? AND " + Data.MIMETYPE + " = ?",
        new String[] { Integer.toString(id), CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE },
        null
    );

    if (cursor != null) {
      while (cursor.moveToNext()) {
        contact.putString("firstName", cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.GIVEN_NAME)));
        contact.putString("lastName", cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.FAMILY_NAME)));
        contact.putString("name", cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.DISPLAY_NAME)));
        contact.putString("middleName", cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.MIDDLE_NAME)));

        if (fieldsSet.contains("phoneticFirstName")) {
          contact.putString("phoneticFirstName", cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.PHONETIC_GIVEN_NAME)));
        }
        if (fieldsSet.contains("phoneticLastName")) {
          contact.putString("phoneticLastName", cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.PHONETIC_FAMILY_NAME)));
        }
        if (fieldsSet.contains("phoneticMiddleName")) {
          contact.putString("phoneticMiddleName", cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.PHONETIC_MIDDLE_NAME)));
        }
        if (fieldsSet.contains("namePrefix")) {
          contact.putString("namePrefix", cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.PREFIX)));
        }
        if (fieldsSet.contains("nameSuffix")) {
          contact.putString("nameSuffix", cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.SUFFIX)));
        }
      }
      cursor.close();
    }
    return contact;
  }

  private String getNicknameFromContentResolver(ContentResolver cr, int id) {
    Cursor cursor = cr.query(
        Data.CONTENT_URI,
        null,
        Data.CONTACT_ID + " = ? AND " + Data.MIMETYPE + " = ? AND " + CommonDataKinds.Nickname.TYPE +
        "=" + CommonDataKinds.Nickname.TYPE_DEFAULT,
        new String[] { Integer.toString(id), CommonDataKinds.Nickname.CONTENT_ITEM_TYPE },
        null
    );
    String nickNameIndex = CommonDataKinds.Nickname.NAME;
    String nickname = null;
    if (cursor != null) {
      while (cursor.moveToNext()) {
          nickname =  cursor.getString(cursor.getColumnIndex(nickNameIndex));
      }
      cursor.close();
    }
    return nickname;
  }

  private WritableArray getEmailsFromContentResolver(int id, ContentResolver cr) {
    WritableArray emails = Arguments.createArray();
    Cursor cursor = cr.query(
      CommonDataKinds.Email.CONTENT_URI,
      null,
      CommonDataKinds.Email.CONTACT_ID + " = ?",
      new String[] { Integer.toString(id) },
      null
    );
    if (cursor != null) {
      try {
        while (cursor.moveToNext()) {
          String address = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Email.ADDRESS));
          int isPrimary = cursor.getInt(cursor.getColumnIndex(CommonDataKinds.Email.IS_PRIMARY));
          int type = cursor.getInt(cursor.getColumnIndex(CommonDataKinds.Email.TYPE));

          WritableMap details = Arguments.createMap();

          if (address != null) {
            details.putString("email", address);
          }

          if (isPrimary == 1) {
            details.putBoolean("primary", true);
          }

          String label;

          switch (type) {
            case CommonDataKinds.Email.TYPE_HOME:
              label = "home";
              break;
            case CommonDataKinds.Email.TYPE_MOBILE:
              label = "mobile";
              break;
            case CommonDataKinds.Email.TYPE_OTHER:
              label = "other";
              break;
            case CommonDataKinds.Email.TYPE_WORK:
              label = "work";
              break;
            case CommonDataKinds.Email.TYPE_CUSTOM:
              label = "custom";
              break;
            default:
              label = "unknown";
          }

          details.putString("label", label);

          emails.pushMap(details);
        }
      } finally {
        cursor.close();
      }
      cursor.close();
    }
    return emails;
  }

  private boolean isMissingPermissions() {
    return Build.VERSION.SDK_INT >= 23 &&
        ContextCompat.checkSelfPermission(
            getReactApplicationContext(),
            Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED;
  }

  private WritableArray getPhoneNumbersFromContentResolver(int id, ContentResolver cr) {
    WritableArray phoneNumbers = Arguments.createArray();
    Cursor cursor = cr.query(
        CommonDataKinds.Phone.CONTENT_URI,
        null,
        CommonDataKinds.Phone.CONTACT_ID + " = ?",
        new String[] { Integer.toString(id) },
        null
    );
    if (cursor != null) {
      try {
        while (cursor.moveToNext()) {
          String number = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Phone.NORMALIZED_NUMBER));
          int isPrimary = cursor.getInt(cursor.getColumnIndex(CommonDataKinds.Phone.IS_PRIMARY));
          int type = cursor.getInt(cursor.getColumnIndex(CommonDataKinds.Phone.TYPE));

          WritableMap details = Arguments.createMap();

          if (number != null) {
            details.putString("number", number);
          }

          if (isPrimary == 1) {
            details.putBoolean("primary", true);
          }

          String label;

          switch (type) {
            case CommonDataKinds.Phone.TYPE_HOME:
              label = "home";
              break;
            case CommonDataKinds.Phone.TYPE_MOBILE:
              label = "mobile";
              break;
            case CommonDataKinds.Phone.TYPE_OTHER:
              label = "other";
              break;
            case CommonDataKinds.Phone.TYPE_WORK:
              label = "work";
              break;
            case CommonDataKinds.Phone.TYPE_CUSTOM:
              label = "custom";
              break;
            default:
              label = "unknown";
          }

          details.putString("label", label);

          phoneNumbers.pushMap(details);
        }
      } finally {
        cursor.close();
      }
    }
    return phoneNumbers;
  }

  private WritableArray getAddressesFromContentResolver(int id, ContentResolver cr) {
    WritableArray addresses = Arguments.createArray();
    Cursor cursor = cr.query(
        CommonDataKinds.StructuredPostal.CONTENT_URI,
        null,
        CommonDataKinds.StructuredPostal.CONTACT_ID + " = ?",
        new String[] { Integer.toString(id) },
        null
    );

    if (cursor != null) {
      try {
        while (cursor.moveToNext()) {
          String street = cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredPostal.STREET));
          String city = cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredPostal.CITY));
          String country = cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredPostal.COUNTRY));
          String region = cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredPostal.REGION));
          String neighborhood = cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredPostal.NEIGHBORHOOD));
          String postcode = cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredPostal.POSTCODE));
          String pobox = cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredPostal.POBOX));
          int type = cursor.getInt(cursor.getColumnIndex(CommonDataKinds.StructuredPostal.TYPE));

          if (street == null && city == null && country == null && region == null && neighborhood == null && postcode == null && pobox == null) {
            return null;
          }

          WritableMap details = Arguments.createMap();

          if (street != null) {
            details.putString("street", street);
          }
          if (city != null) {
            details.putString("city", city);
          }
          if (country != null) {
            details.putString("country", country);
          }
          if (region != null) {
            details.putString("region", region);
          }
          if (neighborhood != null) {
            details.putString("neighborhood", neighborhood);
          }
          if (postcode != null) {
            details.putString("postcode", postcode);
          }
          if (pobox != null) {
            details.putString("pobox", pobox);
          }

          String label;

          switch (type) {
            case CommonDataKinds.StructuredPostal.TYPE_HOME:
              label = "home";
              break;
            case CommonDataKinds.StructuredPostal.TYPE_OTHER:
              label = "other";
              break;
            case CommonDataKinds.StructuredPostal.TYPE_WORK:
              label = "work";
              break;
            case CommonDataKinds.StructuredPostal.TYPE_CUSTOM:
              label = "custom";
              break;
            default:
              label = "unknown";
          }

          details.putString("label", label);

          addresses.pushMap(details);
        }
      } finally {
        cursor.close();
      }
    }

    return addresses;
  }

  @Nullable
  private HashMap<String, String> getOrganizationFromContentResolver(int id, ContentResolver cr) {
    Cursor cursor = cr.query(
        ContactsContract.Data.CONTENT_URI,
        null,
        ContactsContract.Data.CONTACT_ID + " = ? AND " + ContactsContract.Data.MIMETYPE + " = ?",
        new String[] { Integer.toString(id), ContactsContract.CommonDataKinds.Organization.CONTENT_ITEM_TYPE },
        null
    );
    if (cursor != null) {
      try {
        if (cursor.moveToNext()) {
          HashMap<String, String> organization = new HashMap<>();
          String company = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Organization.COMPANY));
          String jobTitle = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Organization.TITLE));
          organization.put("company", company);
          organization.put("jobTitle", jobTitle);
          return organization;
        }
      } finally {
        cursor.close();
      }
    }
    return null;
  }

  private String getNoteFromContentResolver(ContentResolver cr, int id) {
    Cursor cursor = cr.query(
        ContactsContract.Data.CONTENT_URI,
        null,
        ContactsContract.Data.CONTACT_ID + " = ? AND " + ContactsContract.Data.MIMETYPE + " = ?",
        new String[]{Integer.toString(id), ContactsContract.CommonDataKinds.Note.CONTENT_ITEM_TYPE},
        null
    );
    String note = null;
    if (cursor != null) {
      if (cursor.moveToFirst()) {
        note = cursor.getString(cursor.getColumnIndex(ContactsContract.CommonDataKinds.Note.NOTE));
      }
      cursor.close();
    }
    return note;
  }

  private WritableMap addDatesFromContentResolver(ContentResolver cr, WritableMap contact,
                                                  int id, boolean birthday) throws ParseException {
    WritableArray dates = Arguments.createArray();
    String selectBirthday = birthday ?
        " AND " + ContactsContract.CommonDataKinds.Event.TYPE + "=" +
            ContactsContract.CommonDataKinds.Event.TYPE_BIRTHDAY : "";
    Cursor cursor = cr.query(
        Data.CONTENT_URI,
        null,
        Data.CONTACT_ID + " = ? AND " + Data.MIMETYPE + " = ?" + selectBirthday,
        new String[] { Integer.toString(id), CommonDataKinds.Event.CONTENT_ITEM_TYPE },
        null
    );

    String label, dateString;
    boolean hasYear;
    Calendar calendar = Calendar.getInstance();
    SimpleDateFormat datePattern = new SimpleDateFormat ("yyyy-MM-dd", Locale.getDefault());
    SimpleDateFormat noYearPattern = new SimpleDateFormat ("--MM-dd", Locale.getDefault());

    if (cursor != null) {
      try {
        while (cursor.moveToNext()) {
          WritableMap details = Arguments.createMap();

          switch (cursor.getInt(cursor.getColumnIndex(CommonDataKinds.Event.TYPE))) {
            case CommonDataKinds.Event.TYPE_ANNIVERSARY:
              label = "anniversary";
              break;
            case CommonDataKinds.Event.TYPE_BIRTHDAY:
              label = "birthday";
              break;
            case CommonDataKinds.Event.TYPE_OTHER:
              label = "other";
              break;
            case CommonDataKinds.Event.TYPE_CUSTOM:
              label = "custom";
              break;
            default:
              label = "unknown";
          }
          dateString = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Event.START_DATE));
          hasYear = !dateString.startsWith("--");

          if (hasYear) {
            calendar.setTime(datePattern.parse(dateString));
          } else {
            calendar.setTime(noYearPattern.parse(dateString));
          }

          if (hasYear) {
            details.putInt("year", calendar.get(Calendar.YEAR));
          }
          details.putInt("month", calendar.get(Calendar.MONTH) + 1);
          details.putInt("day", calendar.get(Calendar.DAY_OF_MONTH));
          if (birthday) {
            contact.putMap("birthday", details);
          } else if (!label.equals("birthday")) {
            details.putString("label", label);
            details.putString("id", cursor.getString(cursor.getColumnIndex(CommonDataKinds.Event._ID)));
            dates.pushMap(details);
          }
        }

        if (!birthday && dates.size() > 0) {
          contact.putArray("dates", dates);
        }
      } finally {
        cursor.close();
      }
      cursor.close();
    }
    return contact;
  }


  private WritableMap addInstantMessageAddressesFromContentResolver(int id, WritableMap contact, ContentResolver cr) {
    WritableArray addresses = Arguments.createArray();
    Cursor cursor = cr.query(
        Data.CONTENT_URI,
        null,
        Data.CONTACT_ID + " = ? AND " + Data.MIMETYPE + " = ?",
        new String[] { Integer.toString(id), CommonDataKinds.Im.CONTENT_ITEM_TYPE },
        null
    );

    if (cursor != null) {
      try {
        while (cursor.moveToNext()) {
          String username = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Im.DATA));
          int type = cursor.getInt(cursor.getColumnIndex(CommonDataKinds.Im.TYPE));
          int protocol = cursor.getInt(cursor.getColumnIndex(CommonDataKinds.Im.PROTOCOL));
          String imId = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Im._ID));

          WritableMap details = Arguments.createMap();

          String label, service;

          switch (type) {
            case CommonDataKinds.Im.TYPE_HOME:
              label = "home";
              break;
            case CommonDataKinds.Im.TYPE_OTHER:
              label = "other";
              break;
            case CommonDataKinds.Im.TYPE_WORK:
              label = "work";
              break;
            case CommonDataKinds.Im.TYPE_CUSTOM:
              label = "custom";
              break;
            default:
              label = "unknown";
          }

          switch (protocol) {
            case CommonDataKinds.Im.PROTOCOL_AIM:
              service = "aim";
              break;
            case CommonDataKinds.Im.PROTOCOL_GOOGLE_TALK:
              service = "googleTalk";
              break;
            case CommonDataKinds.Im.PROTOCOL_ICQ:
              service = "icq";
              break;
            case CommonDataKinds.Im.PROTOCOL_JABBER:
              service = "jabber";
              break;
            case CommonDataKinds.Im.PROTOCOL_MSN:
              service = "msn";
              break;
            case CommonDataKinds.Im.PROTOCOL_NETMEETING:
              service = "netmeeting";
              break;
            case CommonDataKinds.Im.PROTOCOL_QQ:
              service = "qq";
              break;
            case CommonDataKinds.Im.PROTOCOL_SKYPE:
              service = "skype";
              break;
            case CommonDataKinds.Im.PROTOCOL_YAHOO:
              service = "yahoo";
              break;
            case CommonDataKinds.Im.PROTOCOL_CUSTOM:
              service = "custom";
              break;
            default:
              service = "unknown";
          }

          details.putString("username", username);
          details.putString("label", label);
          details.putString("service", service);
          details.putString("id", imId);

          addresses.pushMap(details);
        }
      } finally {
        cursor.close();
      }
    }

    if (addresses.size() > 0) {
      contact.putArray("instantMessageAddresses", addresses);
    }
    return contact;
  }

  private WritableMap addUrlAddressesFromContentResolver(int id, WritableMap contact, ContentResolver cr) {
    WritableArray addresses = Arguments.createArray();
    Cursor cursor = cr.query(
        Data.CONTENT_URI,
        null,
        Data.CONTACT_ID + " = ? AND " + Data.MIMETYPE + " = ?",
        new String[] { Integer.toString(id), CommonDataKinds.Website.CONTENT_ITEM_TYPE },
        null
    );

    if (cursor != null) {
      try {
        while (cursor.moveToNext()) {
          WritableMap details = Arguments.createMap();

          details.putString("url",cursor.getString(cursor.getColumnIndex(CommonDataKinds.Website.URL)));
          details.putString("id", cursor.getString(cursor.getColumnIndex(CommonDataKinds.Website._ID)));
          int type = cursor.getInt(cursor.getColumnIndex(CommonDataKinds.Website.TYPE));
          String label;

          switch (type) {
            case CommonDataKinds.Website.TYPE_HOME:
              label = "home";
              break;
            case CommonDataKinds.Website.TYPE_OTHER:
              label = "other";
              break;
            case CommonDataKinds.Website.TYPE_WORK:
              label = "work";
              break;
            case CommonDataKinds.Website.TYPE_BLOG:
              label = "blog";
              break;
            case CommonDataKinds.Website.TYPE_HOMEPAGE:
              label = "homepage";
              break;
            case CommonDataKinds.Website.TYPE_FTP:
              label = "ftp";
              break;
            case CommonDataKinds.Website.TYPE_PROFILE:
              label = "profile";
              break;
            case CommonDataKinds.Website.TYPE_CUSTOM:
              label = "custom";
              break;
            default:
              label = "unknown";
          }

          details.putString("label", label);
          addresses.pushMap(details);
        }
      } finally {
        cursor.close();
      }
    }

    if (addresses.size() > 0) {
      contact.putArray("urls", addresses);
    }
    return contact;
  }

  private Set<String> getFieldsSet(final ReadableArray fields) {
    Set<String> fieldStrings = new HashSet<>();
    for (int ii = 0; ii < fields.size(); ii++) {
      String field = fields.getString(ii);
      if (field != null) {
        fieldStrings.add(field);
      }
    }
    return fieldStrings;
  }
}
