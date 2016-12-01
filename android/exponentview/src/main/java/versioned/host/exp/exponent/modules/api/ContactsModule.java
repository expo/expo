// Copyright 2015-present 650 Industries. All rights reserved.

package versioned.host.exp.exponent.modules.api;

import android.content.ContentResolver;
import android.database.Cursor;
import android.provider.ContactsContract;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.util.HashSet;
import java.util.Set;

import host.exp.exponentview.Exponent;

import static android.provider.ContactsContract.*;

public class ContactsModule extends ReactContextBaseJavaModule {

  private static final String[] PROJECTION = new String[]{
      CommonDataKinds.Phone.CONTACT_ID,
      Contacts.DISPLAY_NAME,
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
   * @param fields array with possible values 'phone_number', 'email'
   */
  @ReactMethod
  public void getContactsAsync(final ReadableArray fields, final Promise promise) {
    boolean askedForPermission = Exponent.getInstance().getPermissionToReadUserContacts(new Exponent.PermissionsListener() {
      @Override
      public void permissionsGranted() {
        getContactsWithPermissionGrantedAsync(fields, promise);
      }

      @Override
      public void permissionsDenied() {
        promise.reject("User rejected contacts permission.");
      }
    });

    if (!askedForPermission) {
      promise.reject("No visible activity. Must request contacts when visible.");
    }
  }

  private void getContactsWithPermissionGrantedAsync(final ReadableArray fields, final Promise promise) {
    Set<String> fieldsSet = getFieldsSet(fields);
    WritableArray response = Arguments.createArray();

    ContentResolver cr = getReactApplicationContext().getContentResolver();
    Cursor cursor = cr.query(CommonDataKinds.Phone.CONTENT_URI, PROJECTION, null, null, null);
    if (cursor != null) {
      try {
        final int contactIdIndex = cursor.getColumnIndex(CommonDataKinds.Phone.CONTACT_ID);
        final int displayNameIndex = cursor.getColumnIndex(Contacts.DISPLAY_NAME);
        final int numberIndex = cursor.getColumnIndex(CommonDataKinds.Phone.NORMALIZED_NUMBER);
        while (cursor.moveToNext()) {
          int id = (int) cursor.getLong(contactIdIndex);
          String name = cursor.getString(displayNameIndex);
          WritableArray emails = (fieldsSet.contains("emails")) ? getEmailsFromContentResolver(id, cr) : null;
          WritableArray phoneNumbers = (fieldsSet.contains("phoneNumbers")) ? getPhoneNumbersFromContentResolver(id, cr) : null;
          WritableArray addresses = (fieldsSet.contains("addresses")) ? getAddressesFromContentResolver(id, cr) : null;
          WritableMap contact = Arguments.createMap();
          if (emails != null && emails.size() > 0) {
            contact.putArray("emails", emails);
          }
          if (phoneNumbers != null && phoneNumbers.size() > 0) {
            contact.putArray("phoneNumbers", phoneNumbers);
          }
          if (addresses != null && addresses.size() > 0) {
            contact.putArray("addresses", addresses);
          }
          contact.putInt("id", id);
          contact.putString("name", name);
          response.pushMap(contact);
        }
      } finally {
        cursor.close();
      }
    }

    promise.resolve(response);
  }

  private WritableArray getEmailsFromContentResolver(int id, ContentResolver cr) {
    WritableArray emails = Arguments.createArray();
    Cursor cursor = cr.query(
      CommonDataKinds.Email.CONTENT_URI,
      null,
      CommonDataKinds.Email.CONTACT_ID + " = ?",
      new String[]{Integer.toString(id)},
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
            details.putBoolean("default", true);
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

  private WritableArray getPhoneNumbersFromContentResolver(int id, ContentResolver cr) {
    WritableArray phoneNumbers = Arguments.createArray();
    Cursor cursor = cr.query(
        CommonDataKinds.Email.CONTENT_URI,
        null,
        CommonDataKinds.Email.CONTACT_ID + " = ?",
        new String[]{Integer.toString(id)},
        null
    );
    if (cursor != null) {
      try {
        while (cursor.moveToNext()) {
          String number = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Phone.NORMALIZED_NUMBER));
          int isPrimary = cursor.getInt(cursor.getColumnIndex(CommonDataKinds.Email.IS_PRIMARY));
          int type = cursor.getInt(cursor.getColumnIndex(CommonDataKinds.Email.TYPE));

          WritableMap details = Arguments.createMap();

          if (number != null) {
            details.putString("email", number);
          }

          if (isPrimary == 1) {
            details.putBoolean("default", true);
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
        new String[]{Integer.toString(id)},
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
