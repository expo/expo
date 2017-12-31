// Copyright 2015-present 650 Industries. All rights reserved.

package abi24_0_0.host.exp.exponent.modules.api;

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

import abi24_0_0.com.facebook.react.bridge.Arguments;
import abi24_0_0.com.facebook.react.bridge.Promise;
import abi24_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi24_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi24_0_0.com.facebook.react.bridge.ReactMethod;
import abi24_0_0.com.facebook.react.bridge.ReadableArray;
import abi24_0_0.com.facebook.react.bridge.ReadableMap;
import abi24_0_0.com.facebook.react.bridge.WritableArray;
import abi24_0_0.com.facebook.react.bridge.WritableMap;

import java.io.InputStream;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import host.exp.exponent.analytics.EXL;

import static android.provider.ContactsContract.*;

public class ContactsModule extends ReactContextBaseJavaModule {
  private static final String TAG = ContactsModule.class.getSimpleName();

  private static final String[] PROJECTION = new String[]{
          CommonDataKinds.Phone.CONTACT_ID,
          CommonDataKinds.Phone.NUMBER,
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
    boolean fetchSingleContact = options.hasKey("id");
    WritableArray contacts = Arguments.createArray();
    WritableMap response = Arguments.createMap();

    ContentResolver cr = getReactApplicationContext().getContentResolver();
    Cursor cursor = cr.query(
            CommonDataKinds.Phone.CONTENT_URI,
            PROJECTION,
            fetchSingleContact ? Data.CONTACT_ID + " = ?" : null,
            fetchSingleContact ? new String[] { options.getString("id") } : null,
            null
    );
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
          long id = cursor.getLong(contactIdIndex);
          contact.putString("id", String.valueOf(id));

          contact = addIdentityFromContentResolver(fieldsSet, cr, contact, id);
          String nickname = getNicknameFromContentResolver(cr, id);
          if (nickname != null) {
            contact.putString("nickname", nickname);
          }
          if (fieldsSet.contains("note")) {
            contact.putString("note", getNoteFromContentResolver(cr, id));
          }
          if (fieldsSet.contains("birthday")) {
            contact = addDatesFromContentResolver(cr, contact, id, true);
          }
          if (fieldsSet.contains("dates")) {
            contact = addDatesFromContentResolver(cr, contact, id, false);
          }

          contact = addImageInfoFromContentResolver(fieldsSet, cr, contact, id);

          String company = null;
          String jobTitle = null;
          String note = fieldsSet.contains("note") ? getNoteFromContentResolver(cr, id) : null;

          HashMap<String, String> organization = getOrganizationFromContentResolver(id, cr);
          if (organization != null) {
            if (fieldsSet.contains("company")) {
              company = organization.get("company");
            }
            if (fieldsSet.contains("jobTitle")) {
              jobTitle = organization.get("jobTitle");
            }
          }

          HashMap<String, WritableArray> collections = new HashMap<>();
          collections.put("emails", fieldsSet.contains("emails") ?
                  getEmailsFromContentResolver(id, cr) : null);
          collections.put("phoneNumbers", fieldsSet.contains("phoneNumbers") ?
                  getPhoneNumbersFromContentResolver(id, cr) : null);
          collections.put("addresses", fieldsSet.contains("addresses") ?
                  getAddressesFromContentResolver(id, cr) : null);
          collections.put("instantMessageAddresses", fieldsSet.contains("instantMessageAddresses") ?
                  getInstantMessageAddressesFromContentResolver(id, cr) : null);
          collections.put("urlAddresses", fieldsSet.contains("urlAddresses") ?
                  getUrlAddressesFromContentResolver(id, cr) : null);
          collections.put("relationships", fieldsSet.contains("relationships") ?
                  getRelationshipsFromContentResolver(id, cr) : null);

          for (String fieldName : collections.keySet()) {
            WritableArray value = collections.get(fieldName);
            if (value != null && value.size() > 0) {
              contact.putArray(fieldName, value);
            }
          }

          if (note != null && !note.isEmpty()) {
            contact.putString("note", note);
          }
          if (company != null && !company.isEmpty()) {
            contact.putString("company", company);
          }
          if (jobTitle != null && !jobTitle.isEmpty()) {
            contact.putString("jobTitle", jobTitle);
          }

          if (fetchSingleContact) {
            promise.resolve(contact);
          } else {
            contacts.pushMap(contact);
            currentIndex++;
          }
        }

        int total = cursor.getCount();
        if (!fetchSingleContact) {
          response.putArray("data", contacts);
          response.putBoolean("hasPreviousPage", pageOffset > 0);
          response.putBoolean("hasNextPage", pageOffset + pageSize < total);
          response.putInt("total", total);
          promise.resolve(response);
        }
      } catch (Exception e) {
        EXL.e(TAG, e.getMessage());
        promise.reject(e);
      } finally {
        cursor.close();
      }
    } else {
      promise.resolve(response);
    }
  }

  private WritableMap addIdentityFromContentResolver(Set<String> fieldsSet, ContentResolver cr, WritableMap contact, long id) {
    Cursor cursor = cr.query(
            Data.CONTENT_URI,
            null,
            Data.CONTACT_ID + " = ? AND " + Data.MIMETYPE + " = ?",
            new String[] { Long.toString(id), CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE },
            null
    );

    if (cursor != null) {
      Map<String, String> fields = Collections.unmodifiableMap(new HashMap<String, String>() {
        {
          put("firstName", CommonDataKinds.StructuredName.GIVEN_NAME);
          put("lastName", CommonDataKinds.StructuredName.FAMILY_NAME);
          put("name", CommonDataKinds.StructuredName.DISPLAY_NAME);
          put("middleName", CommonDataKinds.StructuredName.MIDDLE_NAME);
        }
      });
      Map<String, String> optional = Collections.unmodifiableMap(new HashMap<String, String>() {
        {
          put("phoneticFirstName", CommonDataKinds.StructuredName.PHONETIC_GIVEN_NAME);
          put("phoneticLastName", CommonDataKinds.StructuredName.PHONETIC_FAMILY_NAME);
          put("phoneticMiddleName", CommonDataKinds.StructuredName.PHONETIC_MIDDLE_NAME);
          put("namePrefix", CommonDataKinds.StructuredName.PREFIX);
          put("nameSuffix", CommonDataKinds.StructuredName.SUFFIX);
        }
      });

      while (cursor.moveToNext()) {
        for (String fieldName : fields.keySet()) {
          String value = cursor.getString(cursor.getColumnIndex(fields.get(fieldName)));
          if (value != null) {
            contact.putString(fieldName, value);
          }
        }
        for (String fieldName : optional.keySet()) {
          if (fieldsSet.contains(fieldName)) {
            String value = cursor.getString(cursor.getColumnIndex(optional.get(fieldName)));
            if (value != null) {
              contact.putString(fieldName, value);
            }
          }
        }
      }
      cursor.close();
    }
    return contact;
  }

  private String getNicknameFromContentResolver(ContentResolver cr, long id) {
    Cursor cursor = cr.query(
            Data.CONTENT_URI,
            null,
            Data.CONTACT_ID + " = ? AND " + Data.MIMETYPE + " = ?",
            new String[] { Long.toString(id), CommonDataKinds.Nickname.CONTENT_ITEM_TYPE },
            null
    );
    String nickNameIndex = CommonDataKinds.Nickname.NAME;
    String nickname = null;
    if (cursor != null) {
      while (cursor.moveToNext()) {
        nickname = cursor.getString(cursor.getColumnIndex(nickNameIndex));
      }
      cursor.close();
    }
    return nickname;
  }

  private WritableArray getEmailsFromContentResolver(long id, ContentResolver cr) {
    WritableArray emails = Arguments.createArray();
    Cursor cursor = cr.query(
            CommonDataKinds.Email.CONTENT_URI,
            null,
            CommonDataKinds.Email.CONTACT_ID + " = ?",
            new String[] { Long.toString(id) },
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
          details.putString("id", String.valueOf(cursor.getLong(cursor.getColumnIndex(CommonDataKinds.Email._ID))));

          emails.pushMap(details);
        }
      } finally {
        cursor.close();
      }
    }
    return emails;
  }

  private boolean isMissingPermissions() {
    return Build.VERSION.SDK_INT >= 23 &&
            ContextCompat.checkSelfPermission(
                    getReactApplicationContext(),
                    Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED;
  }

  private WritableArray getPhoneNumbersFromContentResolver(long id, ContentResolver cr) {
    WritableArray phoneNumbers = Arguments.createArray();
    Cursor cursor = cr.query(
            CommonDataKinds.Phone.CONTENT_URI,
            null,
            CommonDataKinds.Phone.CONTACT_ID + " = ?",
            new String[] { Long.toString(id) },
            null
    );
    if (cursor != null) {
      try {
        while (cursor.moveToNext()) {
          String number = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Phone.NUMBER));
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
          details.putString("id", String.valueOf(cursor.getLong(cursor.getColumnIndex(CommonDataKinds.Phone._ID))));

          phoneNumbers.pushMap(details);
        }
      } finally {
        cursor.close();
      }
    }
    return phoneNumbers;
  }

  private WritableArray getAddressesFromContentResolver(long id, ContentResolver cr) {
    WritableArray addresses = Arguments.createArray();
    Cursor cursor = cr.query(
            CommonDataKinds.StructuredPostal.CONTENT_URI,
            null,
            CommonDataKinds.StructuredPostal.CONTACT_ID + " = ?",
            new String[] { Long.toString(id) },
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
          String poBox = cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredPostal.POBOX));
          int type = cursor.getInt(cursor.getColumnIndex(CommonDataKinds.StructuredPostal.TYPE));

          if (street == null && city == null && country == null && region == null && neighborhood == null && postcode == null && poBox == null) {
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
          if (poBox != null) {
            details.putString("poBox", poBox);
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
          details.putString("id", String.valueOf(cursor.getLong(cursor.getColumnIndex(CommonDataKinds.StructuredPostal._ID))));

          addresses.pushMap(details);
        }
      } finally {
        cursor.close();
      }
    }

    return addresses;
  }

  @Nullable
  private HashMap<String, String> getOrganizationFromContentResolver(long id, ContentResolver cr) {
    Cursor cursor = cr.query(
            ContactsContract.Data.CONTENT_URI,
            null,
            ContactsContract.Data.CONTACT_ID + " = ? AND " + ContactsContract.Data.MIMETYPE + " = ?",
            new String[] { Long.toString(id), ContactsContract.CommonDataKinds.Organization.CONTENT_ITEM_TYPE },
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

  private WritableMap addImageInfoFromContentResolver(Set<String> fieldsSet, ContentResolver cr, WritableMap contact, long id) {
    Cursor imageCursor = cr.query(
            Data.CONTENT_URI,
            null,
            Data.CONTACT_ID + "= ? AND " +
                    Data.MIMETYPE + "= ?",
            new String[] { Long.toString(id), CommonDataKinds.Photo.CONTENT_ITEM_TYPE },
            null
    );
    boolean imageAvailable = false;
    if (imageCursor != null) {
      try {
        if (imageCursor.moveToFirst()) {
          Uri imageUri = Uri.withAppendedPath(
                  ContentUris.withAppendedId(Contacts.CONTENT_URI, id),
                  Contacts.Photo.CONTENT_DIRECTORY);

          try {
            InputStream is = cr.openInputStream(imageUri);
            is.close();
            imageAvailable = true;
          } catch (Exception e) {
            EXL.e(TAG, e.getMessage());
          }
          contact.putBoolean("imageAvailable", imageAvailable);

          if (fieldsSet.contains("thumbnail")) {
            WritableMap thumbnail = Arguments.createMap();
            thumbnail.putString("uri", imageAvailable ? imageUri.toString() : null);
            contact.putMap("thumbnail", thumbnail);
          }
        }
      } finally {
        imageCursor.close();
      }
    }
    return contact;
  }

  private String getNoteFromContentResolver(ContentResolver cr, long id) {
    Cursor cursor = cr.query(
            ContactsContract.Data.CONTENT_URI,
            null,
            ContactsContract.Data.CONTACT_ID + " = ? AND " + ContactsContract.Data.MIMETYPE + " = ?",
            new String[]{ Long.toString(id), ContactsContract.CommonDataKinds.Note.CONTENT_ITEM_TYPE },
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
                                                  long id, boolean birthday) throws ParseException {
    WritableArray dates = Arguments.createArray();
    String selectBirthday = birthday ?
            " AND " + ContactsContract.CommonDataKinds.Event.TYPE + "=" +
                    ContactsContract.CommonDataKinds.Event.TYPE_BIRTHDAY : "";
    Cursor cursor = cr.query(
            Data.CONTENT_URI,
            null,
            Data.CONTACT_ID + " = ? AND " + Data.MIMETYPE + " = ?" + selectBirthday,
            new String[] { Long.toString(id), CommonDataKinds.Event.CONTENT_ITEM_TYPE },
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
            details.putString("id", String.valueOf(cursor.getLong(cursor.getColumnIndex(CommonDataKinds.Event._ID))));
            dates.pushMap(details);
          }
        }

        if (!birthday && dates.size() > 0) {
          contact.putArray("dates", dates);
        }
      } finally {
        cursor.close();
      }
    }
    return contact;
  }


  private WritableArray getInstantMessageAddressesFromContentResolver(long id, ContentResolver cr) {
    WritableArray addresses = Arguments.createArray();
    Cursor cursor = cr.query(
            Data.CONTENT_URI,
            null,
            Data.CONTACT_ID + " = ? AND " + Data.MIMETYPE + " = ?",
            new String[] { Long.toString(id), CommonDataKinds.Im.CONTENT_ITEM_TYPE },
            null
    );

    if (cursor != null) {
      try {
        while (cursor.moveToNext()) {
          String username = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Im.DATA));
          int type = cursor.getInt(cursor.getColumnIndex(CommonDataKinds.Im.TYPE));
          int protocol = cursor.getInt(cursor.getColumnIndex(CommonDataKinds.Im.PROTOCOL));
          long imId = cursor.getLong(cursor.getColumnIndex(CommonDataKinds.Im._ID));

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
          details.putString("id", String.valueOf(imId));

          addresses.pushMap(details);
        }
      } finally {
        cursor.close();
      }
    }
    return addresses;
  }

  private WritableArray getUrlAddressesFromContentResolver(long id, ContentResolver cr) {
    WritableArray addresses = Arguments.createArray();
    Cursor cursor = cr.query(
            Data.CONTENT_URI,
            null,
            Data.CONTACT_ID + " = ? AND " + Data.MIMETYPE + " = ?",
            new String[] { Long.toString(id), CommonDataKinds.Website.CONTENT_ITEM_TYPE },
            null
    );

    if (cursor != null) {
      try {
        while (cursor.moveToNext()) {
          WritableMap details = Arguments.createMap();

          details.putString("url",cursor.getString(cursor.getColumnIndex(CommonDataKinds.Website.URL)));
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
          details.putString("id", String.valueOf(cursor.getLong(cursor.getColumnIndex(CommonDataKinds.Website._ID))));
          addresses.pushMap(details);
        }
      } finally {
        cursor.close();
      }
    }
    return addresses;
  }

  private WritableArray getRelationshipsFromContentResolver(long id, ContentResolver cr) {
    WritableArray relationships = Arguments.createArray();
    Cursor cursor = cr.query(
            Data.CONTENT_URI,
            null,
            Data.CONTACT_ID + " = ? AND " + Data.MIMETYPE + " = ?",
            new String[] { Long.toString(id), CommonDataKinds.Relation.CONTENT_ITEM_TYPE },
            null
    );

    if (cursor != null) {
      try {
        while (cursor.moveToNext()) {
          WritableMap details = Arguments.createMap();

          details.putString("name",cursor.getString(cursor.getColumnIndex(CommonDataKinds.Relation.NAME)));
          int type = cursor.getInt(cursor.getColumnIndex(CommonDataKinds.Relation.TYPE));
          String label;

          switch (type) {
            case CommonDataKinds.Relation.TYPE_ASSISTANT:
              label = "assistant";
              break;
            case CommonDataKinds.Relation.TYPE_BROTHER:
              label = "bother";
              break;
            case CommonDataKinds.Relation.TYPE_CHILD:
              label = "child";
              break;
            case CommonDataKinds.Relation.TYPE_DOMESTIC_PARTNER:
              label = "domesticPartner";
              break;
            case CommonDataKinds.Relation.TYPE_FATHER:
              label = "father";
              break;
            case CommonDataKinds.Relation.TYPE_FRIEND:
              label = "friend";
              break;
            case CommonDataKinds.Relation.TYPE_MANAGER:
              label = "manager";
              break;
            case CommonDataKinds.Relation.TYPE_MOTHER:
              label = "mother";
              break;
            case CommonDataKinds.Relation.TYPE_PARENT:
              label = "parent";
              break;
            case CommonDataKinds.Relation.TYPE_PARTNER:
              label = "partner";
              break;
            case CommonDataKinds.Relation.TYPE_REFERRED_BY:
              label = "referredBy";
              break;
            case CommonDataKinds.Relation.TYPE_RELATIVE:
              label = "relative";
              break;
            case CommonDataKinds.Relation.TYPE_SISTER:
              label = "sister";
              break;
            case CommonDataKinds.Relation.TYPE_SPOUSE:
              label = "spouse";
              break;
            case CommonDataKinds.Relation.TYPE_CUSTOM:
              label = "custom";
              break;
            default:
              label = "unknown";
          }

          details.putString("label", label);
          details.putString("id", String.valueOf(cursor.getLong(cursor.getColumnIndex(CommonDataKinds.Relation._ID))));
          relationships.pushMap(details);
        }
      } finally {
        cursor.close();
      }
    }

    return relationships;
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
