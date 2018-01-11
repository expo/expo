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
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.v4.content.ContextCompat;
import android.text.TextUtils;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.io.InputStream;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
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
          ContactsContract.RawContacts.ACCOUNT_TYPE,
          CommonDataKinds.Phone.NUMBER,
          CommonDataKinds.Email.DATA,
  };

  private static final List<String> JUST_ME_PROJECTION = new ArrayList<String>() {{
    add(ContactsContract.Data.CONTACT_ID);
    add(ContactsContract.Data.LOOKUP_KEY);
    add(ContactsContract.Contacts.Data.MIMETYPE);
    add(ContactsContract.Profile.DISPLAY_NAME);
    add(CommonDataKinds.Contactables.PHOTO_URI);
    add(CommonDataKinds.StructuredName.DISPLAY_NAME);
    add(CommonDataKinds.StructuredName.GIVEN_NAME);
    add(CommonDataKinds.StructuredName.MIDDLE_NAME);
    add(CommonDataKinds.StructuredName.FAMILY_NAME);
    add(CommonDataKinds.StructuredName.PREFIX);
    add(CommonDataKinds.StructuredName.SUFFIX);
    add(CommonDataKinds.Phone.NUMBER);
    add(CommonDataKinds.Phone.TYPE);
    add(CommonDataKinds.Phone.LABEL);
    add(CommonDataKinds.Email.DATA);
    add(CommonDataKinds.Email.ADDRESS);
    add(CommonDataKinds.Email.TYPE);
    add(CommonDataKinds.Email.LABEL);
    add(CommonDataKinds.Organization.COMPANY);
    add(CommonDataKinds.Organization.TITLE);
    add(CommonDataKinds.Organization.DEPARTMENT);
    add(CommonDataKinds.StructuredPostal.FORMATTED_ADDRESS);
    add(CommonDataKinds.StructuredPostal.TYPE);
    add(CommonDataKinds.StructuredPostal.LABEL);
    add(CommonDataKinds.StructuredPostal.STREET);
    add(CommonDataKinds.StructuredPostal.POBOX);
    add(CommonDataKinds.StructuredPostal.NEIGHBORHOOD);
    add(CommonDataKinds.StructuredPostal.CITY);
    add(CommonDataKinds.StructuredPostal.REGION);
    add(CommonDataKinds.StructuredPostal.POSTCODE);
    add(CommonDataKinds.StructuredPostal.COUNTRY);
  }};

  private static final List<String> FULL_PROJECTION = new ArrayList<String>() {{
    addAll(JUST_ME_PROJECTION);
  }};

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
    WritableMap response = Arguments.createMap();

    Map<String, Contact> contacts;

    ContentResolver cr = getReactApplicationContext().getContentResolver();
    Cursor cursor;
    if (fetchSingleContact)
      cursor = cr.query(
              ContactsContract.Data.CONTENT_URI,
              FULL_PROJECTION.toArray(new String[FULL_PROJECTION.size()]),
              ContactsContract.Data.CONTACT_ID + " = ?",
              new String[] { options.getString("id") },
              null
      );
    else {
      cursor = cr.query(
              ContactsContract.Data.CONTENT_URI,
              FULL_PROJECTION.toArray(new String[FULL_PROJECTION.size()]),
              ContactsContract.Data.MIMETYPE + "=? OR " + ContactsContract.Data.MIMETYPE + "=? OR " + ContactsContract.Data.MIMETYPE + "=? OR " + ContactsContract.Data.MIMETYPE + "=? OR " + ContactsContract.Data.MIMETYPE + "=?",
              new String[]{CommonDataKinds.Email.CONTENT_ITEM_TYPE, CommonDataKinds.Phone.CONTENT_ITEM_TYPE, CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE, CommonDataKinds.Organization.CONTENT_ITEM_TYPE, CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE},
              null);
    }
    if (cursor != null) {
      try {
        contacts = loadContactsFrom(cursor, pageOffset, pageSize);

        WritableArray contactsArray = Arguments.createArray();

        // convert from pojo to react native
        for (Contact contact : contacts.values()) {
          // if fetching single contact, short circuit and return contact
          if (fetchSingleContact) {
            promise.resolve(contact.toMap());
            break;
          } else {
            contactsArray.pushMap(contact.toMap());
          }
        }

        int total = cursor.getCount();
        if (!fetchSingleContact) {
          // wrap in pagination
          response.putArray("data", contactsArray);
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

  @NonNull
  private Map<String, Contact> loadContactsFrom(Cursor cursor, int pageOffset, int pageSize) {

    Map<String, Contact> map = new LinkedHashMap<>();
    int currentIndex = 0;
    cursor.move(0);
    cursor.move(pageOffset);
    while (cursor.moveToNext()) {

      if (currentIndex >= pageSize) {
        break;
      }

      int columnIndex = cursor.getColumnIndex(ContactsContract.Data.CONTACT_ID);
      String contactId;
      if (columnIndex != -1) {
        contactId = cursor.getString(columnIndex);
      } else {
        //todo - double check this, it may not be necessary any more
        contactId = String.valueOf(-1);//no contact id for 'ME' user
      }

      if (!map.containsKey(contactId)) {
        map.put(contactId, new Contact(contactId));
      }

      Contact contact = map.get(contactId);

      String mimeType = cursor.getString(cursor.getColumnIndex(ContactsContract.Data.MIMETYPE));

      String name = cursor.getString(cursor.getColumnIndex(ContactsContract.Contacts.DISPLAY_NAME));
      if (!TextUtils.isEmpty(name) && TextUtils.isEmpty(contact.displayName)) {
        contact.displayName = name;
      }

      if(TextUtils.isEmpty(contact.photoUri)) {
        String rawPhotoURI = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Contactables.PHOTO_URI));
        if (!TextUtils.isEmpty(rawPhotoURI)) {
          contact.photoUri = rawPhotoURI;
          contact.hasPhoto = true;
        }
      }

      if (mimeType.equals(CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE)) {
        contact.givenName = cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.GIVEN_NAME));
        contact.middleName = cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.MIDDLE_NAME));
        contact.familyName = cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.FAMILY_NAME));
        contact.prefix = cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.PREFIX));
        contact.suffix = cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.SUFFIX));
      } else if (mimeType.equals(CommonDataKinds.Phone.CONTENT_ITEM_TYPE)) {
        String phoneNumber = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Phone.NUMBER));
        int type = cursor.getInt(cursor.getColumnIndex(CommonDataKinds.Phone.TYPE));

        if (!TextUtils.isEmpty(phoneNumber)) {
          String label;
          switch (type) {
            case CommonDataKinds.Phone.TYPE_HOME:
              label = "home";
              break;
            case CommonDataKinds.Phone.TYPE_WORK:
              label = "work";
              break;
            case CommonDataKinds.Phone.TYPE_MOBILE:
              label = "mobile";
              break;
            default:
              label = "other";
          }
          contact.phones.add(new Contact.Item(label, phoneNumber));
        }
      } else if (mimeType.equals(CommonDataKinds.Email.CONTENT_ITEM_TYPE)) {
        String email = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Email.ADDRESS));
        int type = cursor.getInt(cursor.getColumnIndex(CommonDataKinds.Email.TYPE));

        if (!TextUtils.isEmpty(email)) {
          String label;
          switch (type) {
            case CommonDataKinds.Email.TYPE_HOME:
              label = "home";
              break;
            case CommonDataKinds.Email.TYPE_WORK:
              label = "work";
              break;
            case CommonDataKinds.Email.TYPE_MOBILE:
              label = "mobile";
              break;
            case CommonDataKinds.Email.TYPE_CUSTOM:
              if (cursor.getString(cursor.getColumnIndex(CommonDataKinds.Email.LABEL)) != null) {
                label = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Email.LABEL)).toLowerCase();
              } else {
                label = "";
              }
              break;
            default:
              label = "other";
          }
          contact.emails.add(new Contact.Item(label, email));
        }
      } else if (mimeType.equals(CommonDataKinds.Organization.CONTENT_ITEM_TYPE)) {
        contact.company = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Organization.COMPANY));
        contact.jobTitle = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Organization.TITLE));
        contact.department = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Organization.DEPARTMENT));
      } else if (mimeType.equals(CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE)) {
        contact.postalAddresses.add(new Contact.PostalAddressItem(cursor));
      }
      currentIndex++;
    }

    return map;
  }



  private boolean isMissingPermissions() {
    return Build.VERSION.SDK_INT >= 23 &&
            ContextCompat.checkSelfPermission(
                    getReactApplicationContext(),
                    Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED;
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

  private static class Contact {
    private String contactId;
    private String displayName;
    private String givenName = "";
    private String middleName = "";
    private String familyName = "";
    private String prefix = "";
    private String suffix = "";
    private String company = "";
    private String jobTitle ="";
    private String department ="";
    private String nickname = "";
    private boolean hasPhoto = false;
    private String photoUri;
    private List<Item> emails = new ArrayList<>();
    private List<Item> phones = new ArrayList<>();
    private List<PostalAddressItem> postalAddresses = new ArrayList<>();

    public Contact(String contactId) {
      this.contactId = contactId;
    }

    public WritableMap toMap() {
      WritableMap contact = Arguments.createMap();
      contact.putString("id", contactId);
      contact.putString("name", TextUtils.isEmpty(givenName) ? displayName : givenName + " " + familyName);
      contact.putString("firstName", givenName);
      contact.putString("middleName", middleName);
      contact.putString("lastName", familyName);
      contact.putString("nickname", nickname);
      contact.putString("prefix", prefix);
      contact.putString("suffix", suffix);
      contact.putString("company", company);
      contact.putString("jobTitle", jobTitle);
      contact.putString("department", department);
      contact.putBoolean("imageAvailable", this.hasPhoto);
      contact.putString("thumbnailPath", photoUri == null ? "" : photoUri);

      WritableArray phoneNumbers = Arguments.createArray();
      for (Item item : phones) {
        WritableMap map = Arguments.createMap();
        map.putString("number", item.value);
        map.putString("label", item.label);
        phoneNumbers.pushMap(map);
      }
      contact.putArray("phoneNumbers", phoneNumbers);

      WritableArray emailAddresses = Arguments.createArray();
      for (Item item : emails) {
        WritableMap map = Arguments.createMap();
        map.putString("email", item.value);
        map.putString("label", item.label);
        emailAddresses.pushMap(map);
      }
      contact.putArray("emailAddresses", emailAddresses);

      WritableArray postalAddresses = Arguments.createArray();
      for (PostalAddressItem item : this.postalAddresses) {
        postalAddresses.pushMap(item.map);
      }
      contact.putArray("postalAddresses", postalAddresses);

      return contact;
    }

    public static class Item {
      public String label;
      public String value;

      public Item(String label, String value) {
        this.label = label;
        this.value = value;
      }
    }

    public static class PostalAddressItem {
      public final WritableMap map;

      public PostalAddressItem(Cursor cursor) {
        map = Arguments.createMap();

        map.putString("label", getLabel(cursor));
        putString(cursor, "formattedAddress", CommonDataKinds.StructuredPostal.FORMATTED_ADDRESS);
        putString(cursor, "street", CommonDataKinds.StructuredPostal.STREET);
        putString(cursor, "pobox", CommonDataKinds.StructuredPostal.POBOX);
        putString(cursor, "neighborhood", CommonDataKinds.StructuredPostal.NEIGHBORHOOD);
        putString(cursor, "city", CommonDataKinds.StructuredPostal.CITY);
        putString(cursor, "region", CommonDataKinds.StructuredPostal.REGION);
        putString(cursor, "state", CommonDataKinds.StructuredPostal.REGION);
        putString(cursor, "postCode", CommonDataKinds.StructuredPostal.POSTCODE);
        putString(cursor, "country", CommonDataKinds.StructuredPostal.COUNTRY);
      }

      private void putString(Cursor cursor, String key, String androidKey) {
        final String value = cursor.getString(cursor.getColumnIndex(androidKey));
        if (!TextUtils.isEmpty(value))
          map.putString(key, value);
      }

      static String getLabel(Cursor cursor) {
        switch (cursor.getInt(cursor.getColumnIndex(CommonDataKinds.StructuredPostal.TYPE))) {
          case CommonDataKinds.StructuredPostal.TYPE_HOME:
            return "home";
          case CommonDataKinds.StructuredPostal.TYPE_WORK:
            return "work";
          case CommonDataKinds.StructuredPostal.TYPE_CUSTOM:
            final String label = cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredPostal.LABEL));
            return label != null ? label : "";
        }
        return "other";
      }
    }
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
