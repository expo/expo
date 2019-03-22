
package expo.modules.contacts;

import android.Manifest;
import android.content.ContentProviderOperation;
import android.content.ContentProviderResult;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Bundle;
import android.provider.ContactsContract;
import android.provider.ContactsContract.CommonDataKinds;
import android.content.pm.PackageManager;

import org.unimodules.core.*;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;
import org.unimodules.interfaces.permissions.Permissions;
import expo.modules.contacts.models.DateModel;
import expo.modules.contacts.models.EmailModel;
import expo.modules.contacts.models.ExtraNameModel;
import expo.modules.contacts.models.ImAddressModel;
import expo.modules.contacts.models.PhoneNumberModel;
import expo.modules.contacts.models.PostalAddressModel;
import expo.modules.contacts.models.RelationshipModel;
import expo.modules.contacts.models.UrlAddressModel;

import java.util.*;

import static expo.modules.contacts.models.BaseModel.decodeList;

public class ContactsModule extends ExportedModule implements ModuleRegistryConsumer {
  private ModuleRegistry mModuleRegistry;

  public ContactsModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExpoContacts";
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
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

  // TODO: Evan: Test
  @ExpoMethod
  public void getContactsAsync(final Map<String, Object> options, final Promise promise) {
    if (isMissingPermissions(promise)) return;

    new Thread(new Runnable() {
      @Override
      public void run() {

        String sortOrder = null;
        if (options.containsKey("sort") && options.get("sort") instanceof String) {
          sortOrder = (String)options.get("sort");
        }

        ArrayList fields = null;
        if (options.containsKey("fields") && options.get("fields") instanceof ArrayList) {
          fields = (ArrayList) options.get("fields");
        }

        Set<String> keysToFetch = getFieldsSet(fields);

        if (options.containsKey("id") && options.get("id") instanceof String) {
          Contact contact = getContactById((String) options.get("id"), keysToFetch, promise);
          if (contact == null)
            return;
          Collection contacts = new ArrayList();
          contacts.add(contact);
          ArrayList data = serializeContacts(contacts, keysToFetch, promise);
          if (data == null)
            return;
          Bundle output = new Bundle();
          output.putParcelableArrayList("data", data);
          promise.resolve(output);
        } else if (options.containsKey("name") && options.get("name") instanceof String) {
          String predicateMatchingName = (String)options.get("name");
          HashMap<String, Object> contactData = getContactByName(predicateMatchingName, keysToFetch, sortOrder,
              promise);
          Collection<Contact> contacts = (Collection<Contact>) contactData.get("data");
          ArrayList data = serializeContacts(contacts, keysToFetch, promise);
          if (data == null)
            return;
          Bundle output = new Bundle();
          output.putParcelableArrayList("data", data);
          output.putBoolean("hasNextPage", (Boolean) contactData.get("hasNextPage"));
          output.putBoolean("hasPreviousPage", (Boolean) contactData.get("hasPreviousPage"));
          promise.resolve(output);

        } else {
          getAllContactsAsync(options, keysToFetch, sortOrder, promise);
        }

      }
    }).start();
  }

  @ExpoMethod
  public void addContactAsync(Map<String, Object> data, String containerId, Promise promise) {
    if (isMissingPermissions(promise) || isMissingWritePermissions(promise)) return;
    Contact contact = mutateContact(null, data);

    ArrayList<ContentProviderOperation> ops = contact.toOperationList();

    try {
      ContentProviderResult[] result = getResolver().applyBatch(ContactsContract.AUTHORITY, ops);

      if (result.length > 0) {
        String rawId = String.valueOf(ContentUris.parseId(result[0].uri));
        promise.resolve(rawId);
      } else {
        promise.reject("E_ADD_CONTACT_FAILED", "Given contact couldn't be added.");
      }
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  // TODO: Evan: Test
  @ExpoMethod
  public void updateContactAsync(Map<String, Object> contact, final Promise promise) {
    if (isMissingPermissions(promise) || isMissingWritePermissions(promise)) return;

    String id = contact.containsKey("id") ? (String)contact.get("id") : null;
    Set<String> keysToFetch = getFieldsSet(null);
    Contact targetContact = getContactById(id, keysToFetch, promise);
    if (targetContact != null) {
      targetContact = mutateContact(targetContact, contact);
      ArrayList<ContentProviderOperation> ops = targetContact.toOperationList();
      try {
        ContentProviderResult[] result = getResolver().applyBatch(ContactsContract.AUTHORITY, ops);
        if (result.length > 0) {
          promise.resolve(id);
        } else {
          promise.reject("E_UPDATE_CONTACT_FAILED", "Given contact couldn't be updated.");
        }
      } catch (Exception e) {
        promise.reject(e);
      }

    } else {
      promise.reject("E_CONTACTS", "Couldn't find contact");
    }
  }

  @ExpoMethod
  public void removeContactAsync(String contactId, final Promise promise) {
    if (isMissingPermissions(promise) || isMissingWritePermissions(promise)) return;

    Uri uri = Uri.withAppendedPath(ContactsContract.Contacts.CONTENT_URI, contactId);

    try {
      getResolver().delete(uri, null, null);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void shareContactAsync(String contactId, String subject, final Promise promise) {
    String lookupKey = getLookupKeyForContactId(contactId);
    if (lookupKey == null) {
      promise.reject("E_CONTACTS", "Couldn't find lookup key for contact.");
    }
    Uri uri = Uri.withAppendedPath(ContactsContract.Contacts.CONTENT_VCARD_URI, lookupKey);

    Intent intent = new Intent(Intent.ACTION_SEND);
    intent.setType(ContactsContract.Contacts.CONTENT_VCARD_TYPE);
    intent.putExtra(Intent.EXTRA_STREAM, uri);
    intent.putExtra(Intent.EXTRA_SUBJECT, subject);
    ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
    activityProvider.getCurrentActivity().startActivity(intent);
  }

  @ExpoMethod
  public void writeContactToFileAsync(Map<String, Object> contact, final Promise promise) {
    if (isMissingPermissions(promise)) return;

    String id = contact.containsKey("id") ? (String)contact.get("id") : null;
    String lookupKey = getLookupKeyForContactId(id);
    if (lookupKey == null) {
      promise.reject("E_CONTACTS", "Couldn't find lookup key for contact.");
    }
    Uri uri = Uri.withAppendedPath(ContactsContract.Contacts.CONTENT_VCARD_URI, lookupKey);
    promise.resolve(uri.toString());
  }

  @ExpoMethod
  public void presentFormAsync(String contactId, Map<String, Object> contactData, Map<String, Object> options, Promise promise) {
    if (isMissingPermissions(promise)) return;

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

    ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
    activityProvider.getCurrentActivity().startActivity(intent);
  }

  private void presentEditForm(Contact contact) {
    Uri selectedContactUri = ContactsContract.Contacts.getLookupUri(Long.parseLong(contact.contactId),
        contact.lookupKey);
    Intent intent = new Intent(Intent.ACTION_EDIT);
    intent.setDataAndType(selectedContactUri, ContactsContract.Contacts.CONTENT_ITEM_TYPE);
    ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
    activityProvider.getCurrentActivity().startActivity(intent);
  }

  // TODO: Evan: WIP - Not for SDK 29
  @ExpoMethod
  public void getContactByPhoneNumber(final String phoneNumber, final Promise promise) {
    if (isMissingPermissions(promise)) return;

    // TODO: Replace this with new format
    AsyncTask.execute(new Runnable() {
      @Override
      public void run() {
        Bundle contact = new Bundle();
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
          if (!cursor.isClosed()) {
            cursor.close();
          }
        }
        promise.resolve(contact);
      }
    });
  }

  private ContentResolver getResolver() {
    return getContext().getContentResolver();
  }

  //TODO: Evan: Add nickname and maidenName to .NickName
  private Contact mutateContact(Contact contact, Map<String, Object> data) {
    if (contact == null) {
      contact = new Contact(UUID.randomUUID().toString());
    }
    if (data.containsKey("firstName"))
      contact.firstName = (String) data.get("firstName");
    if (data.containsKey("middleName"))
      contact.middleName = (String) data.get("middleName");
    if (data.containsKey("lastName"))
      contact.lastName = (String) data.get("lastName");
    if (data.containsKey("namePrefix"))
      contact.prefix = (String) data.get("namePrefix");
    if (data.containsKey("nameSuffix"))
      contact.suffix = (String) data.get("nameSuffix");
    if (data.containsKey("phoneticFirstName"))
      contact.phoneticFirstName = (String) data.get("phoneticFirstName");
    if (data.containsKey("phoneticMiddleName"))
      contact.phoneticMiddleName = (String) data.get("phoneticMiddleName");
    if (data.containsKey("phoneticLastName"))
      contact.phoneticLastName = (String) data.get("phoneticLastName");

    if (data.containsKey("company"))
      contact.company = (String) data.get("company");
    if (data.containsKey("jobTitle"))
      contact.jobTitle = (String) data.get("jobTitle");
    if (data.containsKey("department"))
      contact.department = (String) data.get("department");

    if (data.containsKey("note"))
      contact.note = (String) data.get("note");

    ArrayList results;

    try {
      results = decodeList(data.containsKey("addresses") ? (List) data.get("addresses") : null,
          PostalAddressModel.class);
      if (results != null)
        contact.addresses = results;

      results = decodeList(data.containsKey("phoneNumbers") ? (List) data.get("phoneNumbers") : null,
          PhoneNumberModel.class);
      if (results != null)
        contact.phones = results;

      results = decodeList(data.containsKey("emails") ? (List) data.get("emails") : null, EmailModel.class);
      if (results != null)
        contact.emails = results;

      results = decodeList(data.containsKey("instantMessageAddresses") ? (List) data.get("instantMessageAddresses") : null,
          ImAddressModel.class);
      if (results != null)
        contact.imAddresses = results;

      results = decodeList(data.containsKey("urlAddresses") ? (List) data.get("urlAddresses") : null,
          UrlAddressModel.class);
      if (results != null)
        contact.urlAddresses = results;

      results = decodeList(data.containsKey("extraNames") ? (List) data.get("extraNames") : null, ExtraNameModel.class);
      if (results != null)
        contact.extraNames = results;

      results = decodeList(data.containsKey("dates") ? (List) data.get("dates") : null, DateModel.class);
      if (results != null)
        contact.dates = results;

      results = decodeList(data.containsKey("relationships") ? (List) data.get("relationships") : null,
          RelationshipModel.class);
      if (results != null)
        contact.relationships = results;
    } catch (Exception e) {
      // promise.reject(e);
    }
    return contact;
  }

  private String getLookupKeyForContactId(String contactId) {
    Cursor cur = getResolver().query(ContactsContract.Contacts.CONTENT_URI, new String[]{ContactsContract.Contacts.LOOKUP_KEY},
        ContactsContract.Contacts._ID + " = " + contactId, null, null);
    if (cur.moveToFirst()) {
      return cur.getString(0);
    }
    return null;
  }

  private Contact getContactById(String contactId, Set<String> keysToFetch, Promise promise) {
    HashMap queryMap = createProjectionForQuery(keysToFetch);
    List<String> projection = (List<String>) queryMap.get("projection");
    String selection = (String) queryMap.get("selection");
    ArrayList<String> selectionArgs = (ArrayList<String>) queryMap.get("selectionArgs");

    String[] cursorProjection = projection.toArray(new String[projection.size()]);
    String cursorSelection = ContactsContract.Data.CONTACT_ID + " = ?";
    String cursorSortOrder = null;

    Cursor cursor = getResolver().query(
        ContactsContract.Data.CONTENT_URI,
        cursorProjection,
        cursorSelection,
        (new String[]{contactId}),
        cursorSortOrder
    );

    if (cursor != null) {
      try {
        Map<String, Contact> contacts = loadContactsFrom(cursor);
        ArrayList<Contact> contactList = new ArrayList<>(contacts.values());
        if (contactList.size() > 0) {
          return contactList.get(0);
        }
      } catch (Exception e) {
        promise.reject(e);
      } finally {
        cursor.close();
      }
    }

    return null;
  }

  private ArrayList serializeContacts(Collection<Contact> contacts, Set<String> keysToFetch, Promise promise) {
    if (contacts == null)
      return null;
    ArrayList contactsArray = new ArrayList();
    try {
      for (Contact contact : contacts) {
        contactsArray.add(contact.toMap(keysToFetch));
      }
    } catch (Exception e) {
      promise.reject(e);
    }
    return contactsArray;
  }

  private HashMap<String, Object> getContactByName(final String query, final Set<String> keysToFetch, String sortOrder,
                                                  final Promise promise) {
    return fetchContacts(0, 9999, (new String[]{query}), ContactsContract.Data.DISPLAY_NAME_PRIMARY, keysToFetch, sortOrder, promise);
  }

  private Set<String> ensureFieldsSet(final Set<String> fieldsSet) {
    if (fieldsSet == null) {
      return newHashSet("phoneNumbers", "emails", "addresses", "note", "birthday", "dates", "instantMessageAddresses",
          "urlAddresses", "extraNames", "relationships", "phoneticFirstName", "phoneticLastName", "phoneticMiddleName",
          "namePrefix", "nameSuffix", "name", "firstName", "middleName", "lastName", "nickname", "id", "jobTitle",
          "company", "department", "image", "imageAvailable", "note");
    }
    return fieldsSet;
  }

  private Set<String> convertReadableArray(final ArrayList fields) {
    Set<String> fieldStrings = new HashSet<>();

    for (Object key : fields) {
      if (key instanceof String) {
        String field = (String)key;
        fieldStrings.add(field);
      }
    }
    return fieldStrings;
  }

  private Set<String> getFieldsSet(final ArrayList fields) {
    if (fields != null) {
      Set<String> fieldStrings = convertReadableArray(fields);
      return ensureFieldsSet(fieldStrings);
    } else {
      return ensureFieldsSet(null);
    }
  }

  private void getAllContactsAsync(final Map<String, Object> options, final Set<String> keysToFetch, String sortOrder,
                                  final Promise promise) {
    int pageOffset = 0;
    if (options.containsKey("pageOffset") && options.get("pageOffset") instanceof Number) {
      pageOffset = ((Number)options.get("pageOffset")).intValue();
    }

    int pageSize = 0;
    if (options.containsKey("pageSize") && options.get("pageSize") instanceof Number) {
      pageSize = ((Number)options.get("pageSize")).intValue();
    }

    HashMap<String, Object> contactsData = fetchContacts(pageOffset, pageSize, null, null, keysToFetch, sortOrder,
        promise);

    if (contactsData != null) {
      ArrayList<Contact> contacts = (ArrayList<Contact>) contactsData.get("data");
      ArrayList contactsArray = new ArrayList();
      try {
        for (Contact contact : contacts) {
          contactsArray.add(contact.toMap(keysToFetch));
        }

        Bundle output = new Bundle();
        output.putBoolean("hasNextPage", (Boolean) contactsData.get("hasNextPage"));
        output.putBoolean("hasPreviousPage", (Boolean) contactsData.get("hasPreviousPage"));
        output.putParcelableArrayList("data", contactsArray);
        output.putInt("total", (Integer) contactsData.get("total"));

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
    String selection = EXColumns.MIMETYPE + "=? OR " + ContactsContract.Data.MIMETYPE + "=?";

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
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?";
      selectionArgs.add(CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE);
    }

    if (keysToFetch.contains("note")) {
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?";
      selectionArgs.add(CommonDataKinds.Note.CONTENT_ITEM_TYPE);
    }

    if (keysToFetch.contains("birthday") || keysToFetch.contains("dates")) {
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?";
      selectionArgs.add(CommonDataKinds.Event.CONTENT_ITEM_TYPE);
    }

    if (keysToFetch.contains("instantMessageAddresses")) {
      projection.add(CommonDataKinds.Im.DATA);
      projection.add(CommonDataKinds.Im.TYPE);
      projection.add(CommonDataKinds.Im.PROTOCOL);
      projection.add(CommonDataKinds.Im._ID);
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?";
      selectionArgs.add(CommonDataKinds.Im.CONTENT_ITEM_TYPE);
    }

    if (keysToFetch.contains("urlAddresses")) {
      projection.add(CommonDataKinds.Website.URL);
      projection.add(CommonDataKinds.Website.TYPE);
      projection.add(CommonDataKinds.Website._ID);
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?";
      selectionArgs.add(CommonDataKinds.Website.CONTENT_ITEM_TYPE);
    }

    if (keysToFetch.contains("extraNames")) {
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?";
      selectionArgs.add(CommonDataKinds.Nickname.CONTENT_ITEM_TYPE);
    }

    if (keysToFetch.contains("relationships")) {
      projection.add(CommonDataKinds.Relation.NAME);
      projection.add(CommonDataKinds.Relation.TYPE);
      projection.add(CommonDataKinds.Relation._ID);
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?";
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
    map.put("selectionArgs", selectionArgs);
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

    ArrayList<String> selectionArgs = (ArrayList<String>) queryMap.get("selectionArgs");

    String cursorSortOrder = null;

    if (queryStrings != null && queryStrings.length > 0) {
      String[] cursorProjection = projection.toArray(new String[projection.size()]);
      String cursorSelection = queryField + " = ?";

      cursor = cr.query(
          ContactsContract.Data.CONTENT_URI,
          cursorProjection,
          cursorSelection,
          queryStrings,
          cursorSortOrder);
    } else {
      cursor = cr.query(
          ContactsContract.Data.CONTENT_URI,
          projection.toArray(new String[projection.size()]),
          selection,
          selectionArgs.toArray(new String[selectionArgs.size()]),
          cursorSortOrder);
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
        response.put("total", contactListSize);
        return response;
      } catch (Exception e) {
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

  private static Set<String> newHashSet(String... strings) {
    HashSet<String> set = new HashSet<>();

    for (String s : strings) {
      set.add(s);
    }
    return set;
  }


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

  private boolean isMissingPermissions(Promise promise) {
    Permissions permissionsManager = mModuleRegistry.getModule(Permissions.class);
    if (permissionsManager == null) {
      promise.reject("E_NO_PERMISSIONS", "Permissions module is null. Are you sure all the installed Expo modules are properly linked?");
      return false;
    }
    int[] grantResults = permissionsManager.getPermissions(new String[] { Manifest.permission.READ_CONTACTS });

    Boolean hasPermission = (grantResults.length == 1 && grantResults[0] == PackageManager.PERMISSION_GRANTED);

    if (!hasPermission) {
      promise.reject("E_MISSING_PERMISSION", "Missing read contacts permission.");
    }
    return !hasPermission;
  }

  private boolean isMissingWritePermissions(Promise promise) {
    Permissions permissionsManager = mModuleRegistry.getModule(Permissions.class);
    if (permissionsManager == null) {
      promise.reject("E_NO_PERMISSIONS", "Permissions module is null. Are you sure all the installed Expo modules are properly linked?");
      return false;
    }
    int[] grantResults = permissionsManager.getPermissions(new String[] { Manifest.permission.WRITE_CONTACTS });

    Boolean hasPermission = (grantResults.length == 1 && grantResults[0] == PackageManager.PERMISSION_GRANTED);

    if (!hasPermission) {
      promise.reject("E_MISSING_PERMISSION", "Missing write contacts permission.");
    }
    return !hasPermission;
  }
}
