// Copyright 2015-present 650 Industries. All rights reserved.

package abi17_0_0.host.exp.exponent.modules.api;

import android.Manifest;
import android.content.ContentResolver;
import android.content.pm.PackageManager;
import android.database.Cursor;

import android.os.Build;
import android.provider.ContactsContract;
import android.support.annotation.Nullable;
import android.support.v4.content.ContextCompat;

import abi17_0_0.com.facebook.react.bridge.Arguments;
import abi17_0_0.com.facebook.react.bridge.Promise;
import abi17_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi17_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi17_0_0.com.facebook.react.bridge.ReactMethod;
import abi17_0_0.com.facebook.react.bridge.ReadableArray;
import abi17_0_0.com.facebook.react.bridge.ReadableMap;
import abi17_0_0.com.facebook.react.bridge.WritableArray;
import abi17_0_0.com.facebook.react.bridge.WritableMap;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;

import host.exp.expoview.Exponent;

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
        final int displayNameIndex = cursor.getColumnIndex(Contacts.DISPLAY_NAME);
        while (cursor.moveToNext()) {
          if (currentIndex >= pageSize) {
            break;
          }

          int id = (int) cursor.getLong(contactIdIndex);
          String name = cursor.getString(displayNameIndex);

          String company = null;
          String jobTitle = null;

          if (fieldsSet.contains("company") || fieldsSet.contains("jobTitle")) {
            HashMap<String, String> organization = getOrganizationFromContentResolver(id, cr);
            if (organization != null) {
              if (fieldsSet.contains("company")) {
                company = organization.get("company");
              }
              if (fieldsSet.contains("jobTitle")) {
                jobTitle = organization.get("jobTitle");
              }
            }
          }

          WritableArray emails = fieldsSet.contains("emails") ? getEmailsFromContentResolver(id, cr) : null;
          WritableArray phoneNumbers = fieldsSet.contains("phoneNumbers") ? getPhoneNumbersFromContentResolver(id, cr) : null;
          WritableArray addresses = fieldsSet.contains("addresses") ? getAddressesFromContentResolver(id, cr) : null;

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
          if (company != null && !company.isEmpty()) {
            contact.putString("company", company);
          }
          if (jobTitle != null && !jobTitle.isEmpty()) {
            contact.putString("jobTitle", jobTitle);
          }
          contact.putInt("id", id);
          contact.putString("name", name);
          contacts.pushMap(contact);
          System.out.println(id + " ---- " + name);
          currentIndex++;
        }

        int total = cursor.getCount();
        response.putArray("data", contacts);
        response.putBoolean("hasPreviousPage", pageOffset > 0);
        response.putBoolean("hasNextPage", pageOffset + pageSize < total);
        response.putInt("total", total);
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
