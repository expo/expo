// Copyright 2015-present 650 Industries. All rights reserved.

package abi29_0_0.host.exp.exponent.modules.api;

import android.Manifest;
import android.content.ContentProviderOperation;
import android.content.ContentProviderResult;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.AsyncTask;
import android.provider.ContactsContract;
import android.provider.ContactsContract.CommonDataKinds;
import android.provider.ContactsContract.CommonDataKinds.Organization;
import android.provider.ContactsContract.CommonDataKinds.StructuredName;
import android.support.annotation.NonNull;
import android.text.TextUtils;

import abi29_0_0.com.facebook.react.bridge.Arguments;
import abi29_0_0.com.facebook.react.bridge.Promise;
import abi29_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi29_0_0.com.facebook.react.bridge.ReactMethod;
import abi29_0_0.com.facebook.react.bridge.ReadableArray;
import abi29_0_0.com.facebook.react.bridge.ReadableMap;
import abi29_0_0.com.facebook.react.bridge.WritableArray;
import abi29_0_0.com.facebook.react.bridge.WritableMap;

import java.io.ByteArrayOutputStream;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import host.exp.exponent.analytics.EXL;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.expoview.Exponent;
import abi29_0_0.host.exp.exponent.modules.ExpoKernelServiceConsumerBaseModule;

import static android.provider.ContactsContract.Contacts;
import static android.provider.ContactsContract.Data;
import static android.provider.ContactsContract.RawContacts;
import static abi29_0_0.host.exp.exponent.modules.api.ContactsModule.Contact.MappedItem.decodeList;

public class ContactsModule extends ExpoKernelServiceConsumerBaseModule {

  public interface EXColumns {
    String DATA_10 = "data10";
    String DATA_9 = "data9";
    String DATA_8 = "data8";
    String DATA_7 = "data7";
    String DATA_6 = "data6";
    String DATA_5 = "data5";
    String DATA_4 = "data4";

    String LABEL = "data3";
    String TYPE = "data2";
    String DATA = "data1";
    String ID = Data._ID;
    String IS_PRIMARY = Data.IS_PRIMARY;
    String CONTACT_ID = Data.CONTACT_ID;
    String LOOKUP_KEY = Data.LOOKUP_KEY;
    String DISPLAY_NAME = Data.DISPLAY_NAME;
    String PHOTO_URI = CommonDataKinds.Contactables.PHOTO_URI;
    String PHOTO_THUMBNAIL_URI = CommonDataKinds.Contactables.PHOTO_THUMBNAIL_URI;
    String IS_USER_PROFILE = CommonDataKinds.Contactables.IS_USER_PROFILE;
    String MIMETYPE = Data.MIMETYPE;
    int TYPE_CUSTOM = 0;
  }

  private static final String TAG = ContactsModule.class.getSimpleName();

  // TODO: Evan: default API is confusing. Duplicate data being requested.
  private static final List<String> DEFAULT_PROJECTION = new ArrayList<String>() {
    {
      add(ContactsContract.Data.CONTACT_ID);
      add(ContactsContract.Data.LOOKUP_KEY);
      add(ContactsContract.Contacts.Data.MIMETYPE);
      add(ContactsContract.Profile.DISPLAY_NAME);
      add(CommonDataKinds.Contactables.PHOTO_URI);
      add(CommonDataKinds.Contactables.PHOTO_THUMBNAIL_URI);
      add(CommonDataKinds.StructuredName.DISPLAY_NAME);
      add(CommonDataKinds.StructuredName.GIVEN_NAME);
      add(CommonDataKinds.StructuredName.MIDDLE_NAME);
      add(CommonDataKinds.StructuredName.FAMILY_NAME);
      add(CommonDataKinds.StructuredName.PREFIX);
      add(CommonDataKinds.StructuredName.SUFFIX);
      add(CommonDataKinds.StructuredName.PHONETIC_GIVEN_NAME);
      add(CommonDataKinds.StructuredName.PHONETIC_MIDDLE_NAME);
      add(CommonDataKinds.StructuredName.PHONETIC_FAMILY_NAME);
      add(CommonDataKinds.Organization.COMPANY);
      add(CommonDataKinds.Organization.TITLE);
      add(CommonDataKinds.Organization.DEPARTMENT);
    }
  };

  public ContactsModule(ReactApplicationContext reactContext, ExperienceId experienceId) {
    super(reactContext, experienceId);
  }

  @Override
  public String getName() {
    return "ExponentContacts";
  }

  // TODO: Evan: Test
  @ReactMethod
  public void getContactsAsync(final ReadableMap options, final Promise promise) {
    if (isMissingPermissions()) {
      promise.reject("E_MISSING_PERMISSION", "Missing contacts permission.");
      return;
    }

    final String sortOrder = options.hasKey("sort") ? options.getString("sort") : null;
    final ReadableArray fields = options.hasKey("fields") ? options.getArray("fields") : null;

    new Thread(new Runnable() {
      @Override
      public void run() {

        Set<String> keysToFetch = getFieldsSet(fields);

        if (options.hasKey("id")) {
          Contact contact = getContactById(options.getString("id"), keysToFetch, promise);
          if (contact == null)
            return;
          Collection contacts = new ArrayList();
          contacts.add(contact);
          WritableArray data = serializeContacts(contacts, keysToFetch, promise);
          if (data == null)
            return;
          WritableMap output = Arguments.createMap();
          output.putArray("data", data);
          promise.resolve(output);
        } else if (options.hasKey("name")) {
          String predicateMatchingName = options.hasKey("name") ? options.getString("name") : null;
          HashMap<String, Object> contactData = getContactByName(predicateMatchingName, keysToFetch, sortOrder,
              promise);
          Collection<Contact> contacts = (Collection<Contact>) contactData.get("data");
          WritableArray data = serializeContacts(contacts, keysToFetch, promise);
          if (data == null)
            return;
          WritableMap output = Arguments.createMap();
          output.putArray("data", data);
          output.putBoolean("hasNextPage", (Boolean) contactData.get("hasNextPage"));
          output.putBoolean("hasPreviousPage", (Boolean) contactData.get("hasPreviousPage"));
          promise.resolve(output);

        } else {
          getAllContactsAsync(options, keysToFetch, sortOrder, promise);
        }

      }
    }).start();
  }

  // TODO: Evan: Test
  @ReactMethod
  public void addContactAsync(ReadableMap data, ReadableMap options, Promise promise) {
    if (isMissingPermissions() || isMissingWritePermissions()) {
      promise.reject("E_MISSING_PERMISSION", "Missing contacts permission.");
      return;
    }
    Contact contact = mutateContact(null, data);

    ArrayList<ContentProviderOperation> ops = contact.toOperationList();

    try {
      ContentProviderResult[] result = getResolver().applyBatch(ContactsContract.AUTHORITY, ops);

      if (result != null && result.length > 0) {
        String rawId = String.valueOf(ContentUris.parseId(result[0].uri));
        promise.resolve(rawId);
      }
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  // TODO: Evan: Test
  @ReactMethod
  public void updateContactAsync(ReadableMap contact, final Promise promise) {
    if (isMissingPermissions() || isMissingWritePermissions()) {
      promise.reject("E_MISSING_PERMISSION", "Missing contacts permission.");
      return;
    }
    String id = contact.hasKey("id") ? contact.getString("id") : null;
    Set<String> keysToFetch = getFieldsSet(null);
    Contact targetContact = getContactById(id, keysToFetch, promise);
    if (targetContact != null) {
      targetContact = mutateContact(targetContact, contact);
      ArrayList<ContentProviderOperation> ops = targetContact.toOperationList();
      try {
        ContentProviderResult[] result = getResolver().applyBatch(ContactsContract.AUTHORITY, ops);
        if (result != null && result.length > 0) {
          promise.resolve(id);
        } else {
          // TODO: Evan: Reject?
        }
      } catch (Exception e) {
        promise.reject(e);
      }

    } else {
      promise.reject("E_CONTACTS", "Couldn't find contact");
    }
  }

  // TODO: Evan: Test
  @ReactMethod
  public void removeContactAsync(ReadableMap contact, final Promise promise) {
    if (isMissingPermissions() || isMissingWritePermissions()) {
      promise.reject("E_MISSING_PERMISSION", "Missing contacts permission.");
      return;
    }

    String id = contact.hasKey("id") ? contact.getString("id") : null;
    Uri uri = Uri.withAppendedPath(ContactsContract.Contacts.CONTENT_URI, id);
    try {
      getResolver().delete(uri, null, null);
      promise.resolve(id);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ReactMethod
  public void shareContactAsync(String contactId, String subject, final Promise promise) {
    String lookupKey = getLookupKeyForContactId(contactId);
    if (lookupKey == null) {
      promise.reject("E_CONTACTS", "Couldn't find lookup key for contact.");
    }
    Uri uri = Uri.withAppendedPath(Contacts.CONTENT_VCARD_URI, lookupKey);

    Intent intent = new Intent(Intent.ACTION_SEND);
    intent.setType(ContactsContract.Contacts.CONTENT_VCARD_TYPE);
    intent.putExtra(Intent.EXTRA_STREAM, uri);
    intent.putExtra(Intent.EXTRA_SUBJECT, subject);
    Exponent.getInstance().getCurrentActivity().startActivity(intent);
  }

  @ReactMethod
  public void writeContactToFileAsync(ReadableMap contact, final Promise promise) {
    if (isMissingPermissions()) {
      promise.reject("E_MISSING_PERMISSION", "Missing contacts permission.");
      return;
    }

    String id = contact.hasKey("id") ? contact.getString("id") : null;
    String lookupKey = getLookupKeyForContactId(id);
    if (lookupKey == null) {
      promise.reject("E_CONTACTS", "Couldn't find lookup key for contact.");
    }
    Uri uri = Uri.withAppendedPath(Contacts.CONTENT_VCARD_URI, lookupKey);
    promise.resolve(uri.toString());
  }

  @ReactMethod
  public void presentFormAsync(String contactId, ReadableMap contactData, ReadableMap options, Promise promise) {
    if (isMissingPermissions()) {
      promise.reject("E_MISSING_PERMISSION", "Missing contacts permission.");
      return;
    }

    if (contactId != null) {
      Set<String> keysToFetch = getFieldsSet(null);
      Contact contact = getContactById(contactId, keysToFetch, promise);
      if (contact == null) {
        promise.reject("E_CONTACTS", "Couldn't find contact with ID.");
        return;
      }
      // contact = mutateContact(contact, contactData);
      presentEditForm(contact);
      promise.resolve(0);
      return;
    }
    // Create contact from supplied data.
    Contact contact = mutateContact(null, contactData);

    presentForm(contact);
  }

  private void presentForm(Contact contact) {
    Intent intent = new Intent(Intent.ACTION_INSERT, ContactsContract.Contacts.CONTENT_URI);
    intent.putExtra(ContactsContract.Intents.Insert.NAME, contact.displayName);
    intent.putParcelableArrayListExtra(ContactsContract.Intents.Insert.DATA, contact.getContentValues());
    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

    Exponent.getInstance().getCurrentActivity().startActivity(intent);
  }

  private void presentEditForm(Contact contact) {
    Uri selectedContactUri = ContactsContract.Contacts.getLookupUri(Long.parseLong(contact.contactId),
        contact.lookupKey);
    Intent intent = new Intent(Intent.ACTION_EDIT);
    intent.setDataAndType(selectedContactUri, ContactsContract.Contacts.CONTENT_ITEM_TYPE);
    Exponent.getInstance().getCurrentActivity().startActivity(intent);
  }

  // TODO: Evan: WIP - Not for SDK 29
  @ReactMethod
  public void getContactByPhoneNumber(final String phoneNumber, final Promise promise) {
    if (isMissingPermissions()) {
      promise.reject("E_MISSING_PERMISSION", "Missing contacts permission.");
      return;
    }

    // TODO: Replace this with new format
    AsyncTask.execute(new Runnable() {
      @Override
      public void run() {
        WritableMap contact = Arguments.createMap();
        Uri uri = Uri.withAppendedPath(ContactsContract.PhoneLookup.CONTENT_FILTER_URI, Uri.encode(phoneNumber));

        String[] projection = new String[]{ContactsContract.PhoneLookup.DISPLAY_NAME};
        Cursor cursor = getResolver().query(uri, projection, null, null, null);
        if (cursor == null) {
          promise.reject("E_CONTACTS", "Couldn't query contact by number");
          return;
        }

        try {
          if (cursor.moveToFirst()) {
            String name = cursor.getString(cursor.getColumnIndex(ContactsContract.PhoneLookup.DISPLAY_NAME));
            contact.putString("displayName", name);
          }
        } catch (Exception e) {
          promise.reject(e);
        } finally {
          if (cursor != null && !cursor.isClosed()) {
            cursor.close();
          }
        }
        promise.resolve(contact);
      }
    });
  }

  private ContentResolver getResolver() {
    return getReactApplicationContext().getContentResolver();
  }

  //TODO: Evan: Add nickname and maidenName to .NickName
  private Contact mutateContact(Contact contact, ReadableMap data) {
    if (contact == null) {
      contact = new Contact(UUID.randomUUID().toString());
    }
    if (data.hasKey("firstName"))
      contact.firstName = data.getString("firstName");
    if (data.hasKey("middleName"))
      contact.middleName = data.getString("middleName");
    if (data.hasKey("lastName"))
      contact.lastName = data.getString("lastName");
    if (data.hasKey("namePrefix"))
      contact.prefix = data.getString("namePrefix");
    if (data.hasKey("nameSuffix"))
      contact.suffix = data.getString("nameSuffix");
    if (data.hasKey("phoneticFirstName"))
      contact.phoneticFirstName = data.getString("phoneticFirstName");
    if (data.hasKey("phoneticMiddleName"))
      contact.phoneticMiddleName = data.getString("phoneticMiddleName");
    if (data.hasKey("phoneticLastName"))
      contact.phoneticLastName = data.getString("phoneticLastName");

    if (data.hasKey("company"))
      contact.company = data.getString("company");
    if (data.hasKey("jobTitle"))
      contact.jobTitle = data.getString("jobTitle");
    if (data.hasKey("department"))
      contact.department = data.getString("department");

    if (data.hasKey("note"))
      contact.note = data.getString("note");

    ArrayList results;

    try {
      results = decodeList(data.hasKey("addresses") ? data.getArray("addresses") : null,
          Contact.PostalAddressItem.class);
      if (results != null)
        contact.addresses = results;

      results = decodeList(data.hasKey("phoneNumbers") ? data.getArray("phoneNumbers") : null,
          Contact.PhoneNumberItem.class);
      if (results != null)
        contact.phones = results;

      results = decodeList(data.hasKey("emails") ? data.getArray("emails") : null, Contact.EmailItem.class);
      if (results != null)
        contact.emails = results;

      results = decodeList(data.hasKey("instantMessageAddresses") ? data.getArray("instantMessageAddresses") : null,
          Contact.ImAddressItem.class);
      if (results != null)
        contact.imAddresses = results;

      results = decodeList(data.hasKey("urlAddresses") ? data.getArray("urlAddresses") : null,
          Contact.UrlAddressItem.class);
      if (results != null)
        contact.urlAddresses = results;

      results = decodeList(data.hasKey("extraNames") ? data.getArray("extraNames") : null, Contact.ExtraNameItem.class);
      if (results != null)
        contact.extraNames = results;

      results = decodeList(data.hasKey("dates") ? data.getArray("dates") : null, Contact.DateItem.class);
      if (results != null)
        contact.dates = results;

      results = decodeList(data.hasKey("relationships") ? data.getArray("relationships") : null,
          Contact.RelationshipItem.class);
      if (results != null)
        contact.relationships = results;
    } catch (Exception e) {
      // promise.reject(e);
    }
    return contact;
  }

  private String getLookupKeyForContactId(String contactId) {
    Cursor cur = getResolver().query(Contacts.CONTENT_URI, new String[]{Contacts.LOOKUP_KEY},
        Contacts._ID + " = " + contactId, null, null);
    if (cur.moveToFirst()) {
      return cur.getString(0);
    }
    return null;
  }

  public Contact getContactById(String contactId, Set<String> keysToFetch, Promise promise) {
    HashMap queryMap = createProjectionForQuery(keysToFetch);
    List<String> projection = (List<String>) queryMap.get("projection");

    String[] cursorProjection = projection.toArray(new String[projection.size()]);
    String cursorSelection = ContactsContract.Data.CONTACT_ID + " = ?";
    String cursorSortOrder = null;

    Cursor cursor = getResolver().query(ContactsContract.Data.CONTENT_URI, cursorProjection, cursorSelection,
        (new String[]{contactId}), cursorSortOrder);

    if (cursor != null) {
      try {
        Map<String, Contact> contacts = loadContactsFrom(cursor);
        ArrayList<Contact> contactList = new ArrayList<>(contacts.values());
        if (contactList.size() > 0) {
          return contactList.get(0);
        }
      } catch (Exception e) {
        EXL.e(TAG, e.getMessage());
        promise.reject(e);
      } finally {
        cursor.close();
      }
    }

    return null;
  }

  private WritableArray serializeContacts(Collection<Contact> contacts, Set<String> keysToFetch, Promise promise) {
    if (contacts == null)
      return null;
    WritableArray contactsArray = Arguments.createArray();
    try {
      for (Contact contact : contacts) {
        contactsArray.pushMap(contact.toMap(keysToFetch));
      }
    } catch (Exception e) {
      promise.reject(e);
    }
    return contactsArray;
  }

  public HashMap<String, Object> getContactByName(final String query, final Set<String> keysToFetch, String sortOrder,
                                                  final Promise promise) {
    return fetchContacts(0, 9999, (new String[]{query}), Data.DISPLAY_NAME_PRIMARY, keysToFetch, sortOrder, promise);
  }

  private Set<String> ensureFieldsSet(final Set<String> fieldsSet) {
    if (fieldsSet == null || fieldsSet.size() == 0) {
      return newHashSet("phoneNumbers", "emails", "addresses", "note", "birthday", "dates", "instantMessageAddresses",
          "urlAddresses", "extraNames", "relationships", "phoneticFirstName", "phoneticLastName", "phoneticMiddleName",
          "namePrefix", "nameSuffix", "name", "firstName", "middleName", "lastName", "nickname", "id", "jobTitle",
          "company", "department", "image", "imageAvailable", "note");
    }
    return fieldsSet;
  }

  private Set<String> convertReadableArray(final ReadableArray fields) {
    Set<String> fieldStrings = new HashSet<>();
    for (int ii = 0; ii < fields.size(); ii++) {
      String field = fields.getString(ii);
      if (field != null) {
        fieldStrings.add(field);
      }
    }
    return fieldStrings;
  }

  private Set<String> getFieldsSet(final ReadableArray fields) {
    if (fields != null) {
      Set<String> fieldStrings = convertReadableArray(fields);
      return ensureFieldsSet(fieldStrings);
    } else {
      return ensureFieldsSet(null);
    }
  }

  public void getAllContactsAsync(final ReadableMap options, final Set<String> keysToFetch, String sortOrder,
                                  final Promise promise) {

    int pageOffset = options.hasKey("pageOffset") ? options.getInt("pageOffset") : 0;
    int pageSize = options.hasKey("pageSize") ? options.getInt("pageSize") : 0;

    HashMap<String, Object> contactsData = fetchContacts(pageOffset, pageSize, null, null, keysToFetch, sortOrder,
        promise);

    if (contactsData != null) {
      ArrayList<Contact> contacts = (ArrayList<Contact>) contactsData.get("data");
      WritableArray contactsArray = Arguments.createArray();
      try {
        for (Contact contact : contacts) {
          contactsArray.pushMap(contact.toMap(keysToFetch));
        }

        WritableMap output = Arguments.createMap();
        output.putBoolean("hasNextPage", (Boolean) contactsData.get("hasNextPage"));
        output.putBoolean("hasPreviousPage", (Boolean) contactsData.get("hasPreviousPage"));
        output.putArray("data", contactsArray);
        promise.resolve(output);
      } catch (Exception e) {
        promise.reject(e);
      }
    }
  }

  private HashMap createProjectionForQuery(final Set<String> keysToFetch) {
    List<String> projection = new ArrayList<>(DEFAULT_PROJECTION);

    ArrayList<String> selectionArgs = new ArrayList<>(Arrays.asList(CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE,
        CommonDataKinds.Organization.CONTENT_ITEM_TYPE));

    // selection ORs need to match arg count from above selectionArgs
    String selection = EXColumns.MIMETYPE + "=? OR " + Data.MIMETYPE + "=?";

    // handle "add on" fields from query request
    if (keysToFetch.contains("phoneNumbers")) {
      projection.add(CommonDataKinds.Phone.NUMBER);
      projection.add(CommonDataKinds.Phone.TYPE);
      projection.add(CommonDataKinds.Phone.LABEL);
      projection.add(CommonDataKinds.Phone.IS_PRIMARY);
      projection.add(CommonDataKinds.Phone._ID);
      selection += " OR " + EXColumns.MIMETYPE + "=?";
      selectionArgs.add(CommonDataKinds.Phone.CONTENT_ITEM_TYPE);
    }

    if (keysToFetch.contains("emails")) {
      projection.add(CommonDataKinds.Email.DATA);
      projection.add(CommonDataKinds.Email.ADDRESS);
      projection.add(CommonDataKinds.Email.TYPE);
      projection.add(CommonDataKinds.Email.LABEL);
      projection.add(CommonDataKinds.Email.IS_PRIMARY);
      projection.add(CommonDataKinds.Email._ID);
      selection += " OR " + EXColumns.MIMETYPE + "=?";
      selectionArgs.add(CommonDataKinds.Email.CONTENT_ITEM_TYPE);
    }

    if (keysToFetch.contains("addresses")) {
      projection.add(CommonDataKinds.StructuredPostal.FORMATTED_ADDRESS);
      projection.add(CommonDataKinds.StructuredPostal.TYPE);
      projection.add(CommonDataKinds.StructuredPostal.LABEL);
      projection.add(CommonDataKinds.StructuredPostal.STREET);
      projection.add(CommonDataKinds.StructuredPostal.POBOX);
      projection.add(CommonDataKinds.StructuredPostal.NEIGHBORHOOD);
      projection.add(CommonDataKinds.StructuredPostal.CITY);
      projection.add(CommonDataKinds.StructuredPostal.REGION);
      projection.add(CommonDataKinds.StructuredPostal.POSTCODE);
      projection.add(CommonDataKinds.StructuredPostal.COUNTRY);
      selection += " OR " + Data.MIMETYPE + "=?";
      selectionArgs.add(CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE);
    }

    if (keysToFetch.contains("note")) {
      selection += " OR " + Data.MIMETYPE + "=?";
      selectionArgs.add(CommonDataKinds.Note.CONTENT_ITEM_TYPE);
    }

    if (keysToFetch.contains("birthday") || keysToFetch.contains("dates")) {
      selection += " OR " + Data.MIMETYPE + "=?";
      selectionArgs.add(CommonDataKinds.Event.CONTENT_ITEM_TYPE);
    }

    if (keysToFetch.contains("instantMessageAddresses")) {
      projection.add(CommonDataKinds.Im.DATA);
      projection.add(CommonDataKinds.Im.TYPE);
      projection.add(CommonDataKinds.Im.PROTOCOL);
      projection.add(CommonDataKinds.Im._ID);
      selection += " OR " + Data.MIMETYPE + "=?";
      selectionArgs.add(CommonDataKinds.Im.CONTENT_ITEM_TYPE);
    }

    if (keysToFetch.contains("urlAddresses")) {
      projection.add(CommonDataKinds.Website.URL);
      projection.add(CommonDataKinds.Website.TYPE);
      projection.add(CommonDataKinds.Website._ID);
      selection += " OR " + Data.MIMETYPE + "=?";
      selectionArgs.add(CommonDataKinds.Website.CONTENT_ITEM_TYPE);
    }

    if (keysToFetch.contains("extraNames")) {
      selection += " OR " + Data.MIMETYPE + "=?";
      selectionArgs.add(CommonDataKinds.Nickname.CONTENT_ITEM_TYPE);
    }

    if (keysToFetch.contains("relationships")) {
      projection.add(CommonDataKinds.Relation.NAME);
      projection.add(CommonDataKinds.Relation.TYPE);
      projection.add(CommonDataKinds.Relation._ID);
      selection += " OR " + Data.MIMETYPE + "=?";
      selectionArgs.add(CommonDataKinds.Relation.CONTENT_ITEM_TYPE);
    }

    if (keysToFetch.contains("phoneticFirstName"))
      projection.add(CommonDataKinds.StructuredName.PHONETIC_GIVEN_NAME);

    if (keysToFetch.contains("phoneticLastName"))
      projection.add(CommonDataKinds.StructuredName.PHONETIC_FAMILY_NAME);

    if (keysToFetch.contains("phoneticMiddleName"))
      projection.add(CommonDataKinds.StructuredName.PHONETIC_MIDDLE_NAME);

    if (keysToFetch.contains("namePrefix"))
      projection.add(CommonDataKinds.StructuredName.PREFIX);

    if (keysToFetch.contains("nameSuffix"))
      projection.add(CommonDataKinds.StructuredName.SUFFIX);

    HashMap map = new HashMap();
    map.put("projection", projection);
    map.put("selection", selection);
    return map;
  }

  private HashMap<String, Object> fetchContacts(int pageOffset, int pageSize, String[] queryStrings, String queryField,
                                                final Set<String> keysToFetch, String sortOrder, Promise promise) {
    boolean getAll = pageSize == 0;
    queryField = queryField != null ? queryField : ContactsContract.Data.CONTACT_ID;

    HashMap queryMap = createProjectionForQuery(keysToFetch);
    List<String> projection = (List<String>) queryMap.get("projection");
    // selection ORs need to match arg count from above selectionArgs
    String selection = (String) queryMap.get("selection");
    Map<String, Contact> contacts;
    ContentResolver cr = getResolver();
    Cursor cursor;

    ArrayList<String> selectionArgs = new ArrayList<>(Arrays.asList(CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE,
        CommonDataKinds.Organization.CONTENT_ITEM_TYPE));

    if (queryStrings != null && queryStrings.length > 0) {
      String[] cursorProjection = projection.toArray(new String[projection.size()]);
      String cursorSelection = queryField + " = ?";
      String cursorSortOrder = null;

      cursor = cr.query(ContactsContract.Data.CONTENT_URI, cursorProjection, cursorSelection, queryStrings,
          cursorSortOrder);
    } else {
      cursor = cr.query(ContactsContract.Data.CONTENT_URI, projection.toArray(new String[projection.size()]), selection,
          selectionArgs.toArray(new String[selectionArgs.size()]), null);
    }
    if (cursor != null) {
      try {
        contacts = loadContactsFrom(cursor);

        ArrayList contactsArray = new ArrayList();

        // introduce paging at this level to ensure all data elements
        // are appropriately mapped to contacts from cursor
        // NOTE: paging performance improvement is minimized as cursor iterations will
        // always fully run
        int currentIndex;
        ArrayList<Contact> contactList = new ArrayList<>(contacts.values());
        contactList = sortContactsBy(contactList, sortOrder);
        int contactListSize = contactList.size();
        HashMap<String, Object> response = new HashMap<String, Object>();

        // convert from contact pojo to react native
        for (currentIndex = getAll ? 0 : pageOffset; currentIndex < contactListSize; currentIndex++) {
          Contact contact = contactList.get(currentIndex);

          // if fetching single contact, short circuit and return contact
          if (!getAll && (currentIndex - pageOffset) >= pageSize) {
            break;
          }
          contactsArray.add(contact);

        }
        response.put("data", contactsArray);
        response.put("hasPreviousPage", pageOffset > 0);
        response.put("hasNextPage", pageOffset + pageSize < contactListSize);

        return response;
      } catch (Exception e) {
//        EXL.e(TAG, e.getMessage());
        promise.reject(e);
      } finally {
        cursor.close();
      }
    }
    return null;
  }

  private ArrayList<Contact> sortContactsBy(ArrayList<Contact> input, String sortOrder) {
    if (sortOrder == null)
      return input;

    switch (sortOrder) {
      case "firstName":
        Collections.sort(input, new Comparator<Contact>() {
          public int compare(Contact p1, Contact p2) {
            return p1.getFirstName().compareToIgnoreCase(p2.getFirstName());
          }
        });
        return input;
      case "lastName":
        Collections.sort(input, new Comparator<Contact>() {
          public int compare(Contact p1, Contact p2) {
            return p1.getLastName().compareToIgnoreCase(p2.getLastName());
          }
        });
        return input;
      default:
        return input;
    }

  }

  public static Set<String> newHashSet(String... strings) {
    HashSet<String> set = new HashSet<>();

    for (String s : strings) {
      set.add(s);
    }
    return set;
  }

  @NonNull
  private Map<String, Contact> loadContactsFrom(Cursor cursor) {

    Map<String, Contact> map = new LinkedHashMap<>();

    while (cursor.moveToNext()) {
      int columnIndex = cursor.getColumnIndex(ContactsContract.Data.CONTACT_ID);
      String contactId = cursor.getString(columnIndex);

      // add or update existing contact for iterating data based on contact id
      if (!map.containsKey(contactId)) {
        map.put(contactId, new Contact(contactId));
      }

      Contact contact = map.get(contactId);
      contact.fromCursor(cursor);
    }
    return map;
  }

  private boolean isMissingPermissions() {
    return !Exponent.getInstance().getPermissions(Manifest.permission.READ_CONTACTS, this.experienceId);
  }

  private boolean isMissingWritePermissions() {
    return !Exponent.getInstance().getPermissions(Manifest.permission.WRITE_CONTACTS, this.experienceId);
  }

  interface CommonProvider {
//    String getLabelFromCursor(android.content.res.Resources resources, int index, String label);
    String getContentType();
    String getDataAlias();
    String getLabelAlias();
    String getIdAlias();
  }

  // TODO: MaidenName Nickname
  protected static class Contact {

    private String contactId;
    private String lookupKey;

    private String displayName;

    private boolean isMe = false;
    private boolean hasPhoto = false;
    private String photoUri;
    private String rawPhotoUri;

    private String contactType = "person";

    private String firstName = "";
    private String middleName = "";
    private String lastName = "";
    // private String nickname = "";
    private String prefix = "";
    private String suffix = "";
    private String phoneticFirstName = "";
    private String phoneticMiddleName = "";
    private String phoneticLastName = "";

    private String company = "";
    private String department = "";
    private String jobTitle = "";

    private String note;

    private List<MappedItem> dates = new ArrayList<>();
    private List<MappedItem> emails = new ArrayList<>();
    private List<MappedItem> imAddresses = new ArrayList<>();
    private List<MappedItem> phones = new ArrayList<>();
    private List<MappedItem> addresses = new ArrayList<>();
    private List<MappedItem> relationships = new ArrayList<>();
    private List<MappedItem> urlAddresses = new ArrayList<>();
    private List<MappedItem> extraNames = new ArrayList<>();

    public void fromCursor(Cursor cursor) {

      String mimeType = cursor.getString(cursor.getColumnIndex(ContactsContract.Data.MIMETYPE));

      String name = cursor.getString(cursor.getColumnIndex(ContactsContract.Contacts.DISPLAY_NAME));
      if (!TextUtils.isEmpty(name) && TextUtils.isEmpty(this.displayName)) {
        this.displayName = name;
      }

      if (TextUtils.isEmpty(this.rawPhotoUri)) {
        String rawPhotoURI = cursor.getString(cursor.getColumnIndex(EXColumns.PHOTO_URI));
        if (!TextUtils.isEmpty(rawPhotoURI)) {
          this.hasPhoto = true;
          this.rawPhotoUri = rawPhotoURI;
        }
      }

      if (TextUtils.isEmpty(this.photoUri)) {
        String rawPhotoURI = cursor.getString(cursor.getColumnIndex(EXColumns.PHOTO_THUMBNAIL_URI));
        if (!TextUtils.isEmpty(rawPhotoURI)) {
          this.hasPhoto = true;
          this.photoUri = rawPhotoURI;
        }
      }

//      this.isMe = cursor.getInt(cursor.getColumnIndex(EXColumns.IS_PRIMARY)) == 1;

      if (mimeType.equals(CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE)) {
        this.lookupKey = cursor.getString(cursor.getColumnIndex(StructuredName.LOOKUP_KEY));
        this.firstName = cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.GIVEN_NAME));
        this.middleName = cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.MIDDLE_NAME));
        this.lastName = cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.FAMILY_NAME));
        this.prefix = cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.PREFIX));
        this.suffix = cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.SUFFIX));
        this.phoneticFirstName = cursor
            .getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.PHONETIC_GIVEN_NAME));
        this.phoneticMiddleName = cursor
            .getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.PHONETIC_MIDDLE_NAME));
        this.phoneticLastName = cursor
            .getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.PHONETIC_FAMILY_NAME));
      } else if (mimeType.equals(CommonDataKinds.Organization.CONTENT_ITEM_TYPE)) {
        this.company = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Organization.COMPANY));
        this.jobTitle = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Organization.TITLE));
        this.department = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Organization.DEPARTMENT));
      } else if (mimeType.equals(CommonDataKinds.Note.CONTENT_ITEM_TYPE)) {
        this.note = cursor.getString(cursor.getColumnIndex(ContactsContract.CommonDataKinds.Note.NOTE));
      } else if (mimeType.equals(CommonDataKinds.Event.CONTENT_ITEM_TYPE)) {
        Contact.MappedItem item = new Contact.DateItem();
        item.fromCursor(cursor);
        this.dates.add(item);
      } else if (mimeType.equals(CommonDataKinds.Email.CONTENT_ITEM_TYPE)) {
        Contact.MappedItem item = new Contact.EmailItem();
        item.fromCursor(cursor);
        this.emails.add(item);
      } else if (mimeType.equals(CommonDataKinds.Im.CONTENT_ITEM_TYPE)) {
        Contact.MappedItem item = new Contact.ImAddressItem();
        item.fromCursor(cursor);
        this.imAddresses.add(item);
      } else if (mimeType.equals(CommonDataKinds.Phone.CONTENT_ITEM_TYPE)) {
        Contact.MappedItem item = new Contact.PhoneNumberItem();
        item.fromCursor(cursor);
        this.phones.add(item);
      } else if (mimeType.equals(CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE)) {
        Contact.MappedItem item = new Contact.PostalAddressItem();
        item.fromCursor(cursor);
        this.addresses.add(item);
      } else if (mimeType.equals(CommonDataKinds.Relation.CONTENT_ITEM_TYPE)) {
        Contact.MappedItem item = new Contact.RelationshipItem();
        item.fromCursor(cursor);
        this.relationships.add(item);
      } else if (mimeType.equals(CommonDataKinds.Website.CONTENT_ITEM_TYPE)) {
        Contact.MappedItem urlAddressItem = new Contact.UrlAddressItem();
        urlAddressItem.fromCursor(cursor);
        this.urlAddresses.add(urlAddressItem);
      } else if (mimeType.equals(CommonDataKinds.Nickname.CONTENT_ITEM_TYPE)) {
        Contact.MappedItem item = new Contact.ExtraNameItem();
        item.fromCursor(cursor);
        this.extraNames.add(item);
      }

      boolean hasCompanyName = company != null && !company.equals("");
      if (hasCompanyName) {
        boolean hasFirstName = firstName != null && !firstName.equals("");
        boolean hasMiddleName = middleName != null && !middleName.equals("");
        boolean hasLastName = lastName != null && !lastName.equals("");
        if (!hasFirstName && !hasMiddleName && !hasLastName) {
          contactType = "company";
        } else {
          contactType = "person";
        }
      } else {
        contactType = "person";
      }
    }

    public String getFirstName() {
      if (firstName == null) {
        return displayName;
      }
      return firstName;
    }

    public String getLastName() {
      if (lastName == null) {
        return displayName;
      }
      return lastName;
    }

    public Contact(String contactId) {
      this.contactId = contactId;
    }

    public byte[] toByteArray(Bitmap bitmap) {
      ByteArrayOutputStream stream = new ByteArrayOutputStream();
      bitmap.compress(Bitmap.CompressFormat.JPEG, 80, stream);
      return stream.toByteArray();
    }

    public ArrayList<ContentProviderOperation> toOperationList() {
      ArrayList<ContentProviderOperation> ops = new ArrayList();

      ContentProviderOperation.Builder op = ContentProviderOperation.newInsert(RawContacts.CONTENT_URI)
          .withValue(RawContacts.ACCOUNT_TYPE, null).withValue(RawContacts.ACCOUNT_NAME, null);
      ops.add(op.build());

      op = ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
          .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
          .withValue(ContactsContract.Data.MIMETYPE, StructuredName.CONTENT_ITEM_TYPE)
          .withValue(StructuredName.DISPLAY_NAME, displayName).withValue(StructuredName.GIVEN_NAME, firstName)
          .withValue(StructuredName.MIDDLE_NAME, middleName).withValue(StructuredName.FAMILY_NAME, lastName)
          .withValue(StructuredName.PHONETIC_GIVEN_NAME, phoneticFirstName)
          .withValue(StructuredName.PHONETIC_MIDDLE_NAME, phoneticMiddleName)
          .withValue(StructuredName.PHONETIC_FAMILY_NAME, phoneticLastName).withValue(StructuredName.PREFIX, prefix)
          .withValue(StructuredName.SUFFIX, suffix);
      ops.add(op.build());

      op = ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
          .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
          .withValue(EXColumns.MIMETYPE, Organization.CONTENT_ITEM_TYPE)
          .withValue(Organization.COMPANY, company).withValue(Organization.TITLE, jobTitle)
          .withValue(Organization.DEPARTMENT, department);
      ops.add(op.build());

      op = ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
          .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
          .withValue(EXColumns.MIMETYPE, CommonDataKinds.Note.CONTENT_ITEM_TYPE)
          .withValue(ContactsContract.CommonDataKinds.Note.NOTE, note);
      ops.add(op.build());

      // TODO not sure where to allow yields
      op.withYieldAllowed(true);

      if (photoUri != null && !photoUri.isEmpty()) {
        Bitmap photo = BitmapFactory.decodeFile(photoUri);

        if (photo != null) {
          ops.add(ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
              .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
              .withValue(EXColumns.MIMETYPE, ContactsContract.CommonDataKinds.Photo.CONTENT_ITEM_TYPE)
              .withValue(ContactsContract.CommonDataKinds.Photo.PHOTO, toByteArray(photo)).build());
        }
      }

      if (rawPhotoUri != null && !rawPhotoUri.isEmpty()) {
        Bitmap photo = BitmapFactory.decodeFile(rawPhotoUri);

        if (photo != null) {
          ops.add(ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
              .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
              .withValue(ContactsContract.Data.MIMETYPE, ContactsContract.CommonDataKinds.Photo.CONTENT_ITEM_TYPE)
              .withValue(ContactsContract.CommonDataKinds.Photo.PHOTO, toByteArray(photo)).build());
        }
      }

      for (List<MappedItem> map : getMappedItems())
        if (map != null)
          for (MappedItem item : map)
            ops.add(item.getOperation());

      return ops;
    }

    List[] getMappedItems() {
      return new List[]{dates, emails, imAddresses, phones, addresses, relationships, urlAddresses, extraNames};
    }

    // convert to react native object
    public WritableMap toMap(Set<String> fieldSet) throws ParseException {
      WritableMap contact = Arguments.createMap();
      contact.putString("lookupKey", lookupKey);
      contact.putString("id", contactId);
      contact.putString("name", !TextUtils.isEmpty(displayName) ? displayName : firstName + " " + lastName);

      if (!TextUtils.isEmpty(firstName))
        contact.putString("firstName", firstName);
      if (!TextUtils.isEmpty(middleName))
        contact.putString("middleName", middleName);
      if (!TextUtils.isEmpty(lastName))
        contact.putString("lastName", lastName);

      if (!TextUtils.isEmpty(suffix))
        contact.putString("nameSuffix", suffix);
      if (!TextUtils.isEmpty(prefix))
        contact.putString("namePrefix", prefix);
      if (!TextUtils.isEmpty(phoneticFirstName))
        contact.putString("phoneticFirstName", phoneticFirstName);
      if (!TextUtils.isEmpty(phoneticLastName))
        contact.putString("phoneticLastName", phoneticLastName);
      if (!TextUtils.isEmpty(phoneticMiddleName))
        contact.putString("phoneticMiddleName", phoneticMiddleName);

      contact.putString("contactType", contactType);

      if (!TextUtils.isEmpty(company))
        contact.putString("company", company);
      if (!TextUtils.isEmpty(jobTitle))
        contact.putString("jobTitle", jobTitle);
      if (!TextUtils.isEmpty(department))
        contact.putString("department", department);

      contact.putBoolean("imageAvailable", this.hasPhoto);
      if (fieldSet.contains("image") && photoUri != null) {
        WritableMap image = Arguments.createMap();
        image.putString("uri", photoUri);
        contact.putMap("image", image);
      }
      if (fieldSet.contains("rawImage") && rawPhotoUri != null) {
        WritableMap image = Arguments.createMap();
        image.putString("uri", rawPhotoUri);
        contact.putMap("image", image);
      }

      if (fieldSet.contains("note") && !TextUtils.isEmpty(note))
        contact.putString("note", note);

      if (fieldSet.contains("phoneNumbers") && phones.size() > 0) {
        WritableArray items = Arguments.createArray();
        for (MappedItem item : phones)
          items.pushMap(item.getMap());
        contact.putArray("phoneNumbers", items);
      }

      if (fieldSet.contains("emails") && emails.size() > 0) {
        WritableArray items = Arguments.createArray();
        for (MappedItem item : emails)
          items.pushMap(item.getMap());
        contact.putArray("emails", items);
      }

      if (fieldSet.contains("addresses") && addresses.size() > 0) {
        WritableArray items = Arguments.createArray();
        for (MappedItem item : addresses)
          items.pushMap(item.getMap());
        contact.putArray("addresses", items);
      }

      if (fieldSet.contains("instantMessageAddresses") && imAddresses.size() > 0) {
        WritableArray items = Arguments.createArray();
        for (MappedItem item : imAddresses)
          items.pushMap(item.getMap());
        contact.putArray("instantMessageAddresses", items);
      }

      if (fieldSet.contains("urlAddresses") && urlAddresses.size() > 0) {
        WritableArray items = Arguments.createArray();
        for (MappedItem item : urlAddresses)
          items.pushMap(item.getMap());
        contact.putArray("urlAddresses", items);
      }

      if (fieldSet.contains("relationships") && relationships.size() > 0) {
        WritableArray items = Arguments.createArray();
        for (MappedItem item : relationships)
          items.pushMap(item.getMap());
        contact.putArray("relationships", items);
      }

      if (extraNames.size() > 0) {
        boolean showNickname = fieldSet.contains("nickname");
        boolean showMaidenName = fieldSet.contains("maidenName");

        for (int i = 0; i < extraNames.size(); i++) {
          ExtraNameItem item = (ExtraNameItem) extraNames.get(i);

          String data = item.getData();
          String label = item.getLabel();

          if (showMaidenName && label != null && label.equals("maidenName")) {
            if (!TextUtils.isEmpty(data)) contact.putString(label, data);
          }
          if (showNickname && label != null && label.equals("nickname")) {
            if (!TextUtils.isEmpty(data)) contact.putString(label, data);
          }
        }
//        WritableArray items = Arguments.createArray();
//        items.pushMap(item.getMap());
//        contact.putArray("extraNames", items);
      }

      boolean showBirthday = fieldSet.contains("birthday");
      boolean showDates = fieldSet.contains("dates");

      if (showDates || showBirthday) { // double if check with query with cursor
        boolean hasYear;
        Calendar calendar = Calendar.getInstance();
        SimpleDateFormat datePattern = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        SimpleDateFormat noYearPattern = new SimpleDateFormat("--MM-dd", Locale.getDefault());

        WritableArray datesArray = Arguments.createArray();
        for (MappedItem item : dates) {
          WritableMap details = Arguments.createMap();
          String dateString = item.getData();
          String label = item.getLabel();

          hasYear = !dateString.startsWith("--");

          if (hasYear) {
            calendar.setTime(datePattern.parse(dateString));
          } else {
            calendar.setTime(noYearPattern.parse(dateString));
          }

          if (hasYear) {
            details.putInt("year", calendar.get(Calendar.YEAR));
          }
          details.putInt("month", calendar.get(Calendar.MONTH));
          details.putInt("day", calendar.get(Calendar.DAY_OF_MONTH));
          // TODO: Evan: The type is only supported in 26+
          details.putString("format", "gregorian");
          if (showBirthday && label != null && label.equals("birthday")) {
            contact.putMap("birthday", details);
          } else {
            details.putString("label", label);
            datesArray.pushMap(details);
          }
        }
        if (showDates && datesArray.size() > 0) {
          contact.putArray("dates", datesArray);
        }
      }

      return contact;
    }

    public ArrayList<ContentValues> getContentValues() {

      ArrayList<ContentValues> contactData = new ArrayList<>();

      ContentValues name = new ContentValues();
      name.put(ContactsContract.Contacts.Data.MIMETYPE, CommonDataKinds.Identity.CONTENT_ITEM_TYPE);
      name.put(StructuredName.GIVEN_NAME, firstName);
      name.put(StructuredName.MIDDLE_NAME, middleName);
      name.put(StructuredName.FAMILY_NAME, lastName);
      name.put(StructuredName.PREFIX, prefix);
      name.put(StructuredName.SUFFIX, suffix);
      name.put(StructuredName.PHONETIC_GIVEN_NAME, phoneticFirstName);
      name.put(StructuredName.PHONETIC_MIDDLE_NAME, phoneticMiddleName);
      name.put(StructuredName.PHONETIC_FAMILY_NAME, phoneticLastName);
      contactData.add(name);

      ContentValues organization = new ContentValues();
      organization.put(ContactsContract.Data.MIMETYPE, Organization.CONTENT_ITEM_TYPE);
      organization.put(Organization.COMPANY, company);
      organization.put(Organization.TITLE, jobTitle);
      organization.put(Organization.DEPARTMENT, department);
      contactData.add(organization);

      ContentValues notes = new ContentValues();
      notes.put(ContactsContract.Data.MIMETYPE, CommonDataKinds.Note.CONTENT_ITEM_TYPE);
      notes.put(CommonDataKinds.Note.NOTE, note);
      contactData.add(notes);

      if (photoUri != null && !photoUri.isEmpty()) {
        Bitmap photo = BitmapFactory.decodeFile(photoUri);

        if (photo != null) {
          ContentValues image = new ContentValues();
          image.put(EXColumns.MIMETYPE, CommonDataKinds.Photo.CONTENT_ITEM_TYPE);
          image.put(ContactsContract.CommonDataKinds.Photo.PHOTO, toByteArray(photo));
          contactData.add(image);
        }
      }

      if (rawPhotoUri != null && !rawPhotoUri.isEmpty()) {
        Bitmap photo = BitmapFactory.decodeFile(rawPhotoUri);

        if (photo != null) {
          ContentValues image = new ContentValues();
          image.put(EXColumns.MIMETYPE, CommonDataKinds.Photo.CONTENT_ITEM_TYPE);
          image.put(ContactsContract.CommonDataKinds.Photo.PHOTO, toByteArray(photo));
          contactData.add(image);
        }
      }

      for (List<MappedItem> map : getMappedItems())
        if (map != null)
          for (MappedItem item : map)
            contactData.add(item.getContentValues());

      return contactData;
    }

    public static class MappedItem implements CommonProvider {
      protected final WritableMap map;

      static public ArrayList decodeList(ReadableArray input, Class clazz)
          throws IllegalAccessException, InstantiationException {
        if (input == null)
          return null;

        ArrayList<Contact.MappedItem> output = new ArrayList<>();
        for (int i = 0; i < input.size(); i++) {
          Contact.MappedItem item = (MappedItem) clazz.newInstance();
          item.fromMap(input.getMap(i));
          output.add(item);
        }
        return output;
      }

      public int mapStringToType(String label) {
        return 0;
      }

      MappedItem() {
        map = Arguments.createMap();
      }

      protected void mapValue(ReadableMap readableMap, String key) {
        mapValue(readableMap, key, null);
      }

      protected void mapValue(ReadableMap readableMap, String key, String alias) {
        if (readableMap.hasKey(key))
          map.putString(alias == null ? key : alias, readableMap.getString(key));
      }

      public void fromCursor(Cursor cursor) {
        putString(cursor, getIdAlias(), EXColumns.ID);
        map.putString(getLabelAlias(), getLabelFromCursor(cursor));
        putString(cursor, getDataAlias(), EXColumns.DATA);
        putString(cursor, EXColumns.LABEL, EXColumns.LABEL);
        putString(cursor, getTypeAlias(), EXColumns.TYPE);
        putInt(cursor, getIsPrimaryAlias(), EXColumns.IS_PRIMARY);
      }

      public ContentProviderOperation getOperation() {
        ContentProviderOperation.Builder op = ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
            .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
            .withValue(EXColumns.MIMETYPE, getContentType()).withValue(EXColumns.TYPE, mapStringToType(getLabel()))
            .withValue(EXColumns.DATA, getData()).withValue(EXColumns.ID, getId());
        return op.build();
      }

      public String getId() {
        return getString(getIdAlias());
      }

      public String getLabel() {
        return getString(getLabelAlias());
      }

      public String getData() {
        return getString(getDataAlias());
      }

      public String getType() {
        return getString(getTypeAlias());
      }

      public int getIsPrimary() {
        if (map.hasKey(getIsPrimaryAlias()))
          return map.getInt(getIsPrimaryAlias());
        return 0;
      }

      public String getString(String key) {
        if (map.hasKey(key))
          return map.getString(key);
        return null;
      }

      public void fromMap(ReadableMap readableMap) {
        for (String key : readableMap.toHashMap().keySet()) {
          mapValue(readableMap, key);
        }
      }

      public WritableMap getMap() {
        return map;
      }


      protected String getLabelFromCursor(Cursor cursor) {
        switch (cursor.getInt(cursor.getColumnIndex(EXColumns.TYPE))) {
          case EXColumns.TYPE_CUSTOM:
            final String label = cursor.getString(cursor.getColumnIndex(EXColumns.LABEL));
            return label != null ? label : "unknown";
          default:
            return null;
        }
      }

      protected void putString(Cursor cursor, String key, String androidKey) {
        final String value = cursor.getString(cursor.getColumnIndex(androidKey));
        if (!TextUtils.isEmpty(value))
          map.putString(key, value);
      }

      protected void putInt(Cursor cursor, String key, String androidKey) {
        final int value = cursor.getInt(cursor.getColumnIndex(androidKey));
        map.putInt(key, value);
      }

      public ContentValues getContentValues() {
        ContentValues values = new ContentValues();
        values.put(EXColumns.MIMETYPE, getContentType());

        values.put(EXColumns.DATA, getData());
        values.put(EXColumns.TYPE, getType());
        values.put(EXColumns.LABEL, getLabel());
        values.put(EXColumns.ID, getId());
        values.put(EXColumns.IS_PRIMARY, getIsPrimary());

        return values;
      }

//      public String getLabelFromCursor(Cursor cursor, android.content.res.Resources resources) {
//        int labelIndex = cursor.getInt(cursor.getColumnIndex(EXColumns.TYPE));
//        final String label = cursor.getString(cursor.getColumnIndex(EXColumns.LABEL));
//        return getLabelFromCursor(resources, labelIndex, label);
//      }

//      @Override
//      public String getLabelFromCursor(android.content.res.Resources resources, int index, String label) {
//        return label;
//      }

      @Override
      public String getContentType() {
        return null;
      }

      @Override
      public String getDataAlias() {
        return EXColumns.DATA;
      }


      public String getTypeAlias() {
        return "type";
      }


      @Override
      public String getLabelAlias() {
        return "label";
      }

      @Override
      public String getIdAlias() {
        return "id";
      }

      public String getIsPrimaryAlias() {
        return "isPrimary";
      }
    }

    public static class ExtraNameItem extends MappedItem {

      @Override
      public String getContentType() {
        return CommonDataKinds.Nickname.CONTENT_ITEM_TYPE;
      }

      @Override
      public String getDataAlias() {
        return "value";
      }

      @Override
      public int mapStringToType(String label) {
        switch (label) {
          case "default":
            return CommonDataKinds.Nickname.TYPE_DEFAULT;
          case "initials":
            return CommonDataKinds.Nickname.TYPE_INITIALS;
          case "maidenName":
            return CommonDataKinds.Nickname.TYPE_MAIDEN_NAME;
          case "shortName":
            return CommonDataKinds.Nickname.TYPE_SHORT_NAME;
          case "otherName":
            return CommonDataKinds.Nickname.TYPE_OTHER_NAME;
          default:
            return CommonDataKinds.Nickname.TYPE_CUSTOM;
        }
      }

      @Override
      protected String getLabelFromCursor(Cursor cursor) {
        String label = super.getLabelFromCursor(cursor);
        if (label != null) return label;
        switch (cursor.getInt(cursor.getColumnIndex(EXColumns.TYPE))) {
          case CommonDataKinds.Nickname.TYPE_DEFAULT:
            return "nickname";
          case CommonDataKinds.Nickname.TYPE_INITIALS:
            return "initials";
          case CommonDataKinds.Nickname.TYPE_MAIDEN_NAME:
            return "maidenName";
          case CommonDataKinds.Nickname.TYPE_SHORT_NAME:
            return "shortName";
          case CommonDataKinds.Nickname.TYPE_OTHER_NAME:
            return "otherName";
          default:
            return "unknown";
        }
      }

      @Override
      public void fromMap(ReadableMap readableMap) {
        super.fromMap(readableMap);
        // TODO: Evan: Decode contact data
      }
    }

    public static class EmailItem extends MappedItem {

      @Override
      public String getContentType() {
        return CommonDataKinds.Email.CONTENT_ITEM_TYPE;
      }

      @Override
      public String getDataAlias() {
        return "email";
      }

      @Override
      protected String getLabelFromCursor(Cursor cursor) {
        String label = super.getLabelFromCursor(cursor);
        if (label != null) return label;
        switch (cursor.getInt(cursor.getColumnIndex(EXColumns.TYPE))) {
          case CommonDataKinds.Email.TYPE_HOME:
            return "home";
          case CommonDataKinds.Email.TYPE_WORK:
            return "work";
          case CommonDataKinds.Email.TYPE_MOBILE:
            return "mobile";
          case CommonDataKinds.Email.TYPE_OTHER:
            return "other";
          default:
            return "unknown";
        }
      }
    }

    public static class PhoneNumberItem extends MappedItem {
      @Override
      public String getContentType() {
        return CommonDataKinds.Phone.CONTENT_ITEM_TYPE;
      }

      @Override
      public String getDataAlias() {
        return "number";
      }


      @Override
      public void fromMap(ReadableMap readableMap) {
        super.fromMap(readableMap);

        String phoneNumber = getData();
        map.putString("digits", phoneNumber.replaceAll("[^\\d.]", ""));
      }


      @Override
      public int mapStringToType(String label) {
        int phoneType;
        switch (label) {
          case "home":
            phoneType = CommonDataKinds.Phone.TYPE_HOME;
            break;
          case "mobile":
            phoneType = CommonDataKinds.Phone.TYPE_MOBILE;
            break;
          case "work":
            phoneType = CommonDataKinds.Phone.TYPE_WORK;
            break;
          case "faxWork":
            phoneType = CommonDataKinds.Phone.TYPE_FAX_WORK;
            break;
          case "faxHome":
            phoneType = CommonDataKinds.Phone.TYPE_FAX_HOME;
            break;
          case "pager":
            phoneType = CommonDataKinds.Phone.TYPE_PAGER;
            break;
          case "callback":
            phoneType = CommonDataKinds.Phone.TYPE_CALLBACK;
            break;
          case "car":
            phoneType = CommonDataKinds.Phone.TYPE_CAR;
            break;
          case "companyMain":
            phoneType = CommonDataKinds.Phone.TYPE_COMPANY_MAIN;
            break;
          case "isdn":
            phoneType = CommonDataKinds.Phone.TYPE_ISDN;
            break;
          case "main":
            phoneType = CommonDataKinds.Phone.TYPE_MAIN;
            break;
          case "otherFax":
            phoneType = CommonDataKinds.Phone.TYPE_OTHER_FAX;
            break;
          case "radio":
            phoneType = CommonDataKinds.Phone.TYPE_RADIO;
            break;
          case "telex":
            phoneType = CommonDataKinds.Phone.TYPE_TELEX;
            break;
          case "ttyTdd":
            phoneType = CommonDataKinds.Phone.TYPE_TTY_TDD;
            break;
          case "workMobile":
            phoneType = CommonDataKinds.Phone.TYPE_WORK_MOBILE;
            break;
          case "workPager":
            phoneType = CommonDataKinds.Phone.TYPE_WORK_PAGER;
            break;
          case "assistant":
            phoneType = CommonDataKinds.Phone.TYPE_ASSISTANT;
            break;
          case "mms":
            phoneType = CommonDataKinds.Phone.TYPE_MMS;
            break;
          case "other":
            phoneType = CommonDataKinds.Phone.TYPE_OTHER;
            break;
          default:
            phoneType = EXColumns.TYPE_CUSTOM;

            break;
        }
        return phoneType;
      }

      @Override
      protected String getLabelFromCursor(Cursor cursor) {
        String label = super.getLabelFromCursor(cursor);
        if (label != null) return label;
        switch (cursor.getInt(cursor.getColumnIndex(EXColumns.TYPE))) {
          case CommonDataKinds.Phone.TYPE_HOME:
            return "home";
          case CommonDataKinds.Phone.TYPE_WORK:
            return "work";
          case CommonDataKinds.Phone.TYPE_MOBILE:
            return "mobile";
          case CommonDataKinds.Phone.TYPE_OTHER:
            return "other";
          default:
            return "unknown";
        }
      }

    }

    public static class PostalAddressItem extends MappedItem {

      @Override
      public String getContentType() {
        return CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE;
      }

      @Override
      public String getDataAlias() {
        return "formattedAddress";
      }

      @Override
      public int mapStringToType(String label) {
        int postalAddressType;
        switch (label) {
          case "home":
            postalAddressType = CommonDataKinds.StructuredPostal.TYPE_HOME;
            break;
          case "work":
            postalAddressType = CommonDataKinds.StructuredPostal.TYPE_WORK;
            break;
          default:
            postalAddressType = CommonDataKinds.StructuredPostal.TYPE_OTHER;
            break;
        }
        return postalAddressType;
      }

      @Override
      public void fromCursor(Cursor cursor) {
        super.fromCursor(cursor);

        putString(cursor, "formattedAddress", CommonDataKinds.StructuredPostal.FORMATTED_ADDRESS);
        putString(cursor, "street", CommonDataKinds.StructuredPostal.STREET);
        putString(cursor, "poBox", CommonDataKinds.StructuredPostal.POBOX);
        putString(cursor, "neighborhood", CommonDataKinds.StructuredPostal.NEIGHBORHOOD);
        putString(cursor, "city", CommonDataKinds.StructuredPostal.CITY);
        putString(cursor, "region", CommonDataKinds.StructuredPostal.REGION);
        putString(cursor, "state", CommonDataKinds.StructuredPostal.REGION);
        putString(cursor, "postalCode", CommonDataKinds.StructuredPostal.POSTCODE);
        putString(cursor, "country", CommonDataKinds.StructuredPostal.COUNTRY);
      }

      @Override
      public void fromMap(ReadableMap readableMap) {
        super.fromMap(readableMap);
        mapValue(readableMap, "region", "state");
      }

      @Override
      public ContentProviderOperation getOperation() {
        ContentProviderOperation.Builder op = ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
            .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
            .withValue(EXColumns.MIMETYPE, getContentType())
            .withValue(CommonDataKinds.StructuredPostal.TYPE, getType())
            .withValue(CommonDataKinds.StructuredPostal.STREET, getString("street"))
            .withValue(CommonDataKinds.StructuredPostal.CITY, getString("city"))
            .withValue(CommonDataKinds.StructuredPostal.REGION, getString("region"))
            .withValue(CommonDataKinds.StructuredPostal.POSTCODE, getString("postalCode"))
            .withValue(CommonDataKinds.StructuredPostal.COUNTRY, getString("country"));
        return op.build();
      }

      @Override
      public ContentValues getContentValues() {
        ContentValues values = super.getContentValues();
        values.put(CommonDataKinds.StructuredPostal.STREET, getString("street"));
        values.put(CommonDataKinds.StructuredPostal.CITY, getString("city"));
        values.put(CommonDataKinds.StructuredPostal.REGION, getString("region"));
        values.put(CommonDataKinds.StructuredPostal.COUNTRY, getString("country"));
        values.put(CommonDataKinds.StructuredPostal.POSTCODE, getString("postalCode"));
        return values;
      }

      @Override
      protected String getLabelFromCursor(Cursor cursor) {
        String label = super.getLabelFromCursor(cursor);
        if (label != null) return label;
        switch (cursor.getInt(cursor.getColumnIndex(EXColumns.TYPE))) {
          case CommonDataKinds.StructuredPostal.TYPE_HOME:
            return "home";
          case CommonDataKinds.StructuredPostal.TYPE_WORK:
            return "work";
          case CommonDataKinds.StructuredPostal.TYPE_OTHER:
            return "other";
          default:
            return "unknown";
        }
      }

    }

    public static class DateItem extends MappedItem {

      @Override
      public String getContentType() {
        return CommonDataKinds.Event.CONTENT_ITEM_TYPE;
      }

      @Override
      public String getDataAlias() {
        return "date";
      }

      @Override
      public int mapStringToType(String label) {
        switch (label) {
          case "anniversary":
            return CommonDataKinds.Event.TYPE_ANNIVERSARY;
          case "birthday":
            return CommonDataKinds.Event.TYPE_BIRTHDAY;
          case "other":
            return CommonDataKinds.Event.TYPE_OTHER;
          default:
            return EXColumns.TYPE_CUSTOM;
        }
      }

      @Override
      public void fromMap(ReadableMap readableMap) {
        super.fromMap(readableMap);

        String dateString = readableMap.getString("date");

        Boolean hasYear = !dateString.startsWith("--");
        Calendar calendar = Calendar.getInstance();
        SimpleDateFormat datePattern = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        SimpleDateFormat noYearPattern = new SimpleDateFormat("--MM-dd", Locale.getDefault());

        try {
          if (hasYear) {
            calendar.setTime(datePattern.parse(dateString));
          } else {
            calendar.setTime(noYearPattern.parse(dateString));
          }
        } catch (Exception e) {
          // TODO: ??
        }

        if (hasYear) {
          map.putInt("year", calendar.get(Calendar.YEAR));
        }
        map.putInt("month", calendar.get(Calendar.MONTH) + 1);
        map.putInt("day", calendar.get(Calendar.DAY_OF_MONTH));
      }

      @Override
      protected String getLabelFromCursor(Cursor cursor) {
        String label = super.getLabelFromCursor(cursor);
        if (label != null) return label;
        switch (cursor.getInt(cursor.getColumnIndex(EXColumns.TYPE))) {
          case CommonDataKinds.Event.TYPE_ANNIVERSARY:
            return "anniversary";
          case CommonDataKinds.Event.TYPE_BIRTHDAY:
            return "birthday";
          case CommonDataKinds.Event.TYPE_OTHER:
            return "other";
          default:
            return "unknown";
        }
      }
    }

    public static class ImAddressItem extends MappedItem {

      @Override
      public String getContentType() {
        return CommonDataKinds.Im.CONTENT_ITEM_TYPE;
      }

      @Override
      public String getDataAlias() {
        return "username";
      }

      private String serializeService(int protocol) {
        switch (protocol) {
          case CommonDataKinds.Im.PROTOCOL_AIM:
            return "aim";
          case CommonDataKinds.Im.PROTOCOL_GOOGLE_TALK:
            return "googleTalk";
          case CommonDataKinds.Im.PROTOCOL_ICQ:
            return "icq";
          case CommonDataKinds.Im.PROTOCOL_JABBER:
            return "jabber";
          case CommonDataKinds.Im.PROTOCOL_MSN:
            return "msn";
          case CommonDataKinds.Im.PROTOCOL_NETMEETING:
            return "netmeeting";
          case CommonDataKinds.Im.PROTOCOL_QQ:
            return "qq";
          case CommonDataKinds.Im.PROTOCOL_SKYPE:
            return "skype";
          case CommonDataKinds.Im.PROTOCOL_YAHOO:
            return "yahoo";
          case CommonDataKinds.Im.PROTOCOL_CUSTOM:
            return "custom";
          default:
            return "unknown";
        }
      }

      @Override
      public void fromCursor(Cursor cursor) {
        super.fromCursor(cursor);
        map.putString("service", serializeService(cursor.getInt(cursor.getColumnIndex(CommonDataKinds.Im.PROTOCOL))));
      }

      @Override
      public ContentValues getContentValues() {
        ContentValues values = super.getContentValues();
        values.put(CommonDataKinds.Im.PROTOCOL, getString("service"));
        return values;
      }
    }

    public static class UrlAddressItem extends MappedItem {
      @Override
      public String getContentType() {
        return CommonDataKinds.Website.CONTENT_ITEM_TYPE;
      }

      @Override
      public String getDataAlias() {
        return "url";
      }

      @Override
      protected String getLabelFromCursor(Cursor cursor) {
        String label = super.getLabelFromCursor(cursor);
        if (label != null) return label;
        switch (cursor.getInt(cursor.getColumnIndex(EXColumns.TYPE))) {
          case CommonDataKinds.Website.TYPE_HOME:
            return "home";
          case CommonDataKinds.Website.TYPE_WORK:
            return "work";
          case CommonDataKinds.Website.TYPE_BLOG:
            return "blog";
          case CommonDataKinds.Website.TYPE_FTP:
            return "ftp";
          case CommonDataKinds.Website.TYPE_HOMEPAGE:
            return "homepage";
          case CommonDataKinds.Website.TYPE_PROFILE:
            return "profile";
          case CommonDataKinds.Website.TYPE_OTHER:
            return "other";
          default:
            return "unknown";
        }
      }

    }

    public static class RelationshipItem extends MappedItem {

      @Override
      public String getContentType() {
        return CommonDataKinds.Relation.CONTENT_ITEM_TYPE;
      }

      @Override
      public String getDataAlias() {
        return "name";
      }

      @Override
      protected String getLabelFromCursor(Cursor cursor) {
        String label = super.getLabelFromCursor(cursor);
        if (label != null) return label;
        switch (cursor.getInt(cursor.getColumnIndex(EXColumns.TYPE))) {
          case CommonDataKinds.Relation.TYPE_ASSISTANT:
            return "assistant";
          case CommonDataKinds.Relation.TYPE_BROTHER:
            return "bother";
          case CommonDataKinds.Relation.TYPE_CHILD:
            return "child";
          case CommonDataKinds.Relation.TYPE_DOMESTIC_PARTNER:
            return "domesticPartner";
          case CommonDataKinds.Relation.TYPE_FATHER:
            return "father";
          case CommonDataKinds.Relation.TYPE_FRIEND:
            return "friend";
          case CommonDataKinds.Relation.TYPE_MANAGER:
            return "manager";
          case CommonDataKinds.Relation.TYPE_MOTHER:
            return "mother";
          case CommonDataKinds.Relation.TYPE_PARENT:
            return "parent";
          case CommonDataKinds.Relation.TYPE_PARTNER:
            return "partner";
          case CommonDataKinds.Relation.TYPE_REFERRED_BY:
            return "referredBy";
          case CommonDataKinds.Relation.TYPE_RELATIVE:
            return "relative";
          case CommonDataKinds.Relation.TYPE_SISTER:
            return "sister";
          case CommonDataKinds.Relation.TYPE_SPOUSE:
            return "spouse";
          default:
            return "unknown";
        }
      }

    }
  }
}
