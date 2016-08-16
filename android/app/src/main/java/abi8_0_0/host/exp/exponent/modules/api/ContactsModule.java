// Copyright 2015-present 650 Industries. All rights reserved.

package abi8_0_0.host.exp.exponent.modules.api;

import android.content.ContentResolver;
import android.database.Cursor;
import android.provider.ContactsContract;

import abi8_0_0.com.facebook.react.bridge.Arguments;
import abi8_0_0.com.facebook.react.bridge.Promise;
import abi8_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi8_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi8_0_0.com.facebook.react.bridge.ReactMethod;
import abi8_0_0.com.facebook.react.bridge.ReadableArray;
import abi8_0_0.com.facebook.react.bridge.WritableArray;
import abi8_0_0.com.facebook.react.bridge.WritableMap;

import java.util.HashSet;
import java.util.Set;

import host.exp.exponent.ExponentApplication;
import host.exp.exponent.experience.BaseExperienceActivity;

public class ContactsModule extends ReactContextBaseJavaModule {

  private static final String[] PROJECTION = new String[]{
      ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
      ContactsContract.Contacts.DISPLAY_NAME,
      ContactsContract.CommonDataKinds.Phone.NORMALIZED_NUMBER,
      ContactsContract.CommonDataKinds.Email.DATA,
  };

  private ExponentApplication mApplication;

  public ContactsModule(ReactApplicationContext reactContext, ExponentApplication application) {
    super(reactContext);
    mApplication = application;
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
    BaseExperienceActivity activity = BaseExperienceActivity.getVisibleActivity();
    if (activity == null) {
      promise.reject("No visible activity. Must request contacts when visible.");
      return;
    }

    activity.getPermissionToReadUserContacts(new BaseExperienceActivity.PermissionsListener() {
      @Override
      public void permissionsGranted() {
        getContactsWithPermissionGrantedAsync(fields, promise);
      }

      @Override
      public void permissionsDenied() {
        promise.reject("User rejected contacts permission.");
      }
    });
  }

  private void getContactsWithPermissionGrantedAsync(final ReadableArray fields, final Promise promise) {
    Set<String> fieldsSet = getFieldsSet(fields);
    WritableArray response = Arguments.createArray();

    ContentResolver cr = mApplication.getContentResolver();
    Cursor cursor = cr.query(ContactsContract.CommonDataKinds.Phone.CONTENT_URI, PROJECTION, null, null, null);
    if (cursor != null) {
      try {
        final int contactIdIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.CONTACT_ID);
        final int displayNameIndex = cursor.getColumnIndex(ContactsContract.Contacts.DISPLAY_NAME);
        final int numberIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NORMALIZED_NUMBER);
        while (cursor.moveToNext()) {
          int id = (int) cursor.getLong(contactIdIndex);
          String name = cursor.getString(displayNameIndex);
          String phoneNumber = (fieldsSet.contains("phone_number")) ? cursor.getString(numberIndex) : null;
          String email = (fieldsSet.contains("email")) ? getEmailFromContentResolver(id, cr) : null;
          WritableMap contact = Arguments.createMap();
          boolean isValid = false;
          if (phoneNumber != null && !phoneNumber.isEmpty()) {
            contact.putString("phoneNumber", phoneNumber.substring(1));
            isValid = true;
          }
          if (email != null && !email.isEmpty()) {
            contact.putString("email", email);
            isValid = true;
          }
          if (isValid) {
            contact.putInt("id", id);
            contact.putString("name", name);
            response.pushMap(contact);
          }
        }
      } finally {
        cursor.close();
      }
    }

    promise.resolve(response);
  }

  private String getEmailFromContentResolver(int id, ContentResolver cr) {
    String email = null;
    Cursor emailCur = cr.query(
      ContactsContract.CommonDataKinds.Email.CONTENT_URI,
      null,
      ContactsContract.CommonDataKinds.Email.CONTACT_ID + " = ?",
      new String[]{Integer.toString(id)},
      null
    );
    if (emailCur.moveToNext()) {
      email = emailCur.getString(emailCur.getColumnIndex(ContactsContract.CommonDataKinds.Email.DATA));
    }
    emailCur.close();
    return email;
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
