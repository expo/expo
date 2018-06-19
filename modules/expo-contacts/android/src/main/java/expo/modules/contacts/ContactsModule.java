
package expo.modules.contacts;

import android.Manifest;
import android.content.ContentResolver;
import android.content.Context;
import android.database.Cursor;
import android.provider.ContactsContract;
import android.provider.ContactsContract.CommonDataKinds;
import android.text.TextUtils;
import android.content.pm.PackageManager;

import expo.core.*;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.interfaces.permissions.Permissions;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;

public class ContactsModule extends ExportedModule implements ModuleRegistryConsumer {
  private static final String NAME = "ExponentContacts";

  private ModuleRegistry mModuleRegistry;

  private static List<String> PROJECTION = new ArrayList<String>() {{
    add(ContactsContract.Data.CONTACT_ID);
    add(ContactsContract.Data.LOOKUP_KEY);
    add(ContactsContract.Contacts.Data.MIMETYPE);
    add(ContactsContract.Profile.DISPLAY_NAME);
    add(CommonDataKinds.Contactables.PHOTO_URI);
    add(CommonDataKinds.StructuredName.DISPLAY_NAME);
    add(CommonDataKinds.StructuredName.GIVEN_NAME);
    add(CommonDataKinds.StructuredName.MIDDLE_NAME);
    add(CommonDataKinds.StructuredName.FAMILY_NAME);
    add(CommonDataKinds.Organization.COMPANY);
    add(CommonDataKinds.Organization.TITLE);
    add(CommonDataKinds.Organization.DEPARTMENT);
  }};

  public ContactsModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  @ExpoMethod
  public void getContactsAsync(final Map<String, Object> options, final Promise promise) {
    if (isMissingPermissions()) {
      promise.reject("E_MISSING_PERMISSION", "Missing contacts permission.");
      return;
    }

    Set<String> fieldsSet = getFieldsSet((List<String>) options.get("fields"));

    int pageOffset = (Integer) options.get("pageOffset");
    int pageSize = (Integer) options.get("pageSize");
    boolean fetchSingleContact = options.get("id") != null;
    HashMap<String, Object> response = new HashMap<String, Object>();

    Map<String, Contact> contacts;

    ContentResolver cr = getContext().getContentResolver();
    Cursor cursor;


    ArrayList<String> selectionArgs = new ArrayList<>(
        Arrays.asList(
            CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE,
            CommonDataKinds.Organization.CONTENT_ITEM_TYPE
        )
    );

    // selection ORs need to match arg count from above selectionArgs
    String selection = ContactsContract.Data.MIMETYPE + "=? OR " +
        ContactsContract.Data.MIMETYPE + "=?";

    // handle "add on" fields from query request
    if (fieldsSet.contains("phoneNumbers")) {
      PROJECTION.add(CommonDataKinds.Phone.NUMBER);
      PROJECTION.add(CommonDataKinds.Phone.TYPE);
      PROJECTION.add(CommonDataKinds.Phone.LABEL);
      PROJECTION.add(CommonDataKinds.Phone.IS_PRIMARY);
      PROJECTION.add(CommonDataKinds.Phone._ID);
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?";
      selectionArgs.add(CommonDataKinds.Phone.CONTENT_ITEM_TYPE);
    }

    if (fieldsSet.contains("emails")) {
      PROJECTION.add(CommonDataKinds.Email.DATA);
      PROJECTION.add(CommonDataKinds.Email.ADDRESS);
      PROJECTION.add(CommonDataKinds.Email.TYPE);
      PROJECTION.add(CommonDataKinds.Email.LABEL);
      PROJECTION.add(CommonDataKinds.Email.IS_PRIMARY);
      PROJECTION.add(CommonDataKinds.Email._ID);
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?";
      selectionArgs.add(CommonDataKinds.Email.CONTENT_ITEM_TYPE);
    }

    if (fieldsSet.contains("addresses")) {
      PROJECTION.add(CommonDataKinds.StructuredPostal.FORMATTED_ADDRESS);
      PROJECTION.add(CommonDataKinds.StructuredPostal.TYPE);
      PROJECTION.add(CommonDataKinds.StructuredPostal.LABEL);
      PROJECTION.add(CommonDataKinds.StructuredPostal.STREET);
      PROJECTION.add(CommonDataKinds.StructuredPostal.POBOX);
      PROJECTION.add(CommonDataKinds.StructuredPostal.NEIGHBORHOOD);
      PROJECTION.add(CommonDataKinds.StructuredPostal.CITY);
      PROJECTION.add(CommonDataKinds.StructuredPostal.REGION);
      PROJECTION.add(CommonDataKinds.StructuredPostal.POSTCODE);
      PROJECTION.add(CommonDataKinds.StructuredPostal.COUNTRY);
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?";
      selectionArgs.add(CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE);
    }

    if (fieldsSet.contains("note")) {
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?";
      selectionArgs.add(ContactsContract.CommonDataKinds.Note.CONTENT_ITEM_TYPE);
    }

    if (fieldsSet.contains("birthday") || fieldsSet.contains("dates")) {
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?";
      selectionArgs.add(ContactsContract.CommonDataKinds.Event.CONTENT_ITEM_TYPE);
    }

    if (fieldsSet.contains("instantMessageAddresses")) {
      PROJECTION.add(CommonDataKinds.Im.DATA);
      PROJECTION.add(CommonDataKinds.Im.TYPE);
      PROJECTION.add(CommonDataKinds.Im.PROTOCOL);
      PROJECTION.add(CommonDataKinds.Im._ID);
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?";
      selectionArgs.add(CommonDataKinds.Im.CONTENT_ITEM_TYPE);
    }

    if (fieldsSet.contains("urlAddresses")) {
      PROJECTION.add(CommonDataKinds.Website.URL);
      PROJECTION.add(CommonDataKinds.Website.TYPE);
      PROJECTION.add(CommonDataKinds.Website._ID);
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?";
      selectionArgs.add(CommonDataKinds.Website.CONTENT_ITEM_TYPE);
    }

    if (fieldsSet.contains("relationships")) {
      PROJECTION.add(CommonDataKinds.Relation.NAME);
      PROJECTION.add(CommonDataKinds.Relation.TYPE);
      PROJECTION.add(CommonDataKinds.Relation._ID);
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?";
      selectionArgs.add(CommonDataKinds.Relation.CONTENT_ITEM_TYPE);
    }

    if (fieldsSet.contains("phoneticFirstName")) {
      PROJECTION.add(CommonDataKinds.StructuredName.PHONETIC_GIVEN_NAME);
    }

    if (fieldsSet.contains("phoneticLastName")) {
      PROJECTION.add(CommonDataKinds.StructuredName.PHONETIC_FAMILY_NAME);
    }

    if (fieldsSet.contains("phoneticMiddleName")) {
      PROJECTION.add(CommonDataKinds.StructuredName.PHONETIC_MIDDLE_NAME);
    }

    if (fieldsSet.contains("namePrefix")) {
      PROJECTION.add(CommonDataKinds.StructuredName.PREFIX);
    }

    if (fieldsSet.contains("nameSuffix")) {
      PROJECTION.add(CommonDataKinds.StructuredName.SUFFIX);
    }

    if (fetchSingleContact) {
      cursor = cr.query(
          ContactsContract.Data.CONTENT_URI,
          PROJECTION.toArray(new String[PROJECTION.size()]),
          ContactsContract.Data.CONTACT_ID + " = ?",
          new String[]{(String) options.get("id")},
          null);
    } else {
      cursor = cr.query(
          ContactsContract.Data.CONTENT_URI,
          PROJECTION.toArray(new String[PROJECTION.size()]),
          selection,
          selectionArgs.toArray(new String[selectionArgs.size()]),
          null);
    }
    if (cursor != null) {
      try {
        contacts = loadContactsFrom(cursor, fieldsSet);

        ArrayList contactsArray = new ArrayList();

        // introduce paging at this level to ensure all data elements
        // are appropriately mapped to contacts from cursor
        // NOTE: paging performance improvement is minimized as cursor iterations will always fully run
        int currentIndex;
        ArrayList<Contact> contactList = new ArrayList<>(contacts.values());
        int contactListSize = contactList.size();
        // convert from contact pojo to react native
        for (currentIndex = pageOffset; currentIndex < contactListSize; currentIndex++) {
          Contact contact = contactList.get(currentIndex);

          // if fetching single contact, short circuit and return contact
          if (fetchSingleContact) {
            promise.resolve(contact.toMap(fieldsSet));
            break;
          } else {
            if ((currentIndex - pageOffset) >= pageSize) {
              break;
            }
            contactsArray.add(contact.toMap(fieldsSet));
          }
        }

        if (!fetchSingleContact) {
          // wrap in pagination
          response.put("data", contactsArray);
          response.put("hasPreviousPage", pageOffset > 0);
          response.put("hasNextPage", pageOffset + pageSize < contactListSize);
          response.put("total", contactListSize);
          promise.resolve(response);
        }
      } catch (Exception e) {
        promise.reject(e);
      } finally {
        cursor.close();
      }
    } else {
      promise.resolve(response);
    }
  }

  private Map<String, Contact> loadContactsFrom(Cursor cursor, Set<String> fieldsSet) {

    Map<String, Contact> map = new LinkedHashMap<>();

    while (cursor.moveToNext()) {
      int columnIndex = cursor.getColumnIndex(ContactsContract.Data.CONTACT_ID);
      String contactId = cursor.getString(columnIndex);

      // add or update existing contact for iterating data based on contact id
      if (!map.containsKey(contactId)) {
        map.put(contactId, new Contact(contactId));
      }

      Contact contact = map.get(contactId);

      String mimeType = cursor.getString(cursor.getColumnIndex(ContactsContract.Data.MIMETYPE));

      String name = cursor.getString(cursor.getColumnIndex(ContactsContract.Contacts.DISPLAY_NAME));
      if (!TextUtils.isEmpty(name) && TextUtils.isEmpty(contact.displayName)) {
        contact.displayName = name;
      }

      if (TextUtils.isEmpty(contact.photoUri)) {
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
        contact.prefix = fieldsSet.contains("namePrefix") ? cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.PREFIX)) : "";
        contact.suffix = fieldsSet.contains("nameSuffix") ? cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.SUFFIX)) : "";
        contact.phoneticFirstName = fieldsSet.contains("phoneticFirstName") ? cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.PHONETIC_GIVEN_NAME)) : "";
        contact.phoneticMiddleName = fieldsSet.contains("phoneticMiddleName") ? cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.PHONETIC_MIDDLE_NAME)) : "";
        contact.phoneticLastName = fieldsSet.contains("phoneticLastName") ? cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredName.PHONETIC_FAMILY_NAME)) : "";
      } else if (mimeType.equals(CommonDataKinds.Phone.CONTENT_ITEM_TYPE)) {
        String phoneNumber = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Phone.NUMBER));
        int type = cursor.getInt(cursor.getColumnIndex(CommonDataKinds.Phone.TYPE));
        int isPrimary = cursor.getInt(cursor.getColumnIndex(CommonDataKinds.Phone.IS_PRIMARY));
        String id = String.valueOf(cursor.getLong(cursor.getColumnIndex(CommonDataKinds.Phone._ID)));

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
            case CommonDataKinds.Phone.TYPE_OTHER:
              label = "other";
              break;
            case CommonDataKinds.Phone.TYPE_CUSTOM:
              label = "custom";
              break;
            default:
              label = "unknown";
          }
          contact.phones.add(new Contact.Item(label, phoneNumber, isPrimary, id));
        }
      } else if (mimeType.equals(CommonDataKinds.Email.CONTENT_ITEM_TYPE)) {
        String email = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Email.ADDRESS));
        int type = cursor.getInt(cursor.getColumnIndex(CommonDataKinds.Email.TYPE));
        int isPrimary = cursor.getInt(cursor.getColumnIndex(CommonDataKinds.Email.IS_PRIMARY));
        String id = String.valueOf(cursor.getLong(cursor.getColumnIndex(CommonDataKinds.Email._ID)));
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
          contact.emails.add(new Contact.Item(label, email, isPrimary, id));
        }
      } else if (mimeType.equals(CommonDataKinds.Organization.CONTENT_ITEM_TYPE)) {
        contact.company = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Organization.COMPANY));
        contact.jobTitle = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Organization.TITLE));
        contact.department = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Organization.DEPARTMENT));
      } else if (mimeType.equals(CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE)) {
        contact.postalAddresses.add(new Contact.PostalAddressItem(cursor));
      } else if (mimeType.equals(CommonDataKinds.Note.CONTENT_ITEM_TYPE)) {
        contact.note = cursor.getString(cursor.getColumnIndex(ContactsContract.CommonDataKinds.Note.NOTE));
      } else if (mimeType.equals(CommonDataKinds.Event.CONTENT_ITEM_TYPE)) {
        String date = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Event.START_DATE));
        int type = cursor.getInt(cursor.getColumnIndex(CommonDataKinds.Event.TYPE));

        if (!TextUtils.isEmpty(date)) {
          String label;
          switch (type) {
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
          contact.dates.add(new Contact.Item(label, date));
        }
      } else if (mimeType.equals(CommonDataKinds.Im.CONTENT_ITEM_TYPE)) {
        contact.imAddresses.add(new Contact.ImAddressItem(cursor));
      } else if (mimeType.equals(CommonDataKinds.Website.CONTENT_ITEM_TYPE)) {
        contact.urlAddresses.add(new Contact.UrlAddressItem(cursor));
      } else if (mimeType.equals(CommonDataKinds.Relation.CONTENT_ITEM_TYPE)) {
        contact.relationships.add(new Contact.RelationshipItem(cursor));
      }
    }
    return map;
  }


  private boolean isMissingPermissions() {
    Permissions permissionsManager = mModuleRegistry.getModule(Permissions.class);
    if (permissionsManager == null) {
      return false;
    }
    int[] grantResults = permissionsManager.getPermissions(new String[] { Manifest.permission.READ_CONTACTS });
    return !(grantResults.length == 1 && grantResults[0] == PackageManager.PERMISSION_GRANTED);
  }

  private static class Contact {
    private String contactId;
    private String displayName;
    private String givenName = "";
    private String middleName = "";
    private String familyName = "";
    private String prefix = "";
    private String suffix = "";
    private String phoneticFirstName = "";
    private String phoneticMiddleName = "";
    private String phoneticLastName = "";
    private String company = "";
    private String jobTitle = "";
    private String department = "";
    private String nickname = "";
    private boolean hasPhoto = false;
    private String photoUri;
    private String note;
    private List<Item> emails = new ArrayList<>();
    private List<Item> phones = new ArrayList<>();
    private List<Item> dates = new ArrayList<>();
    private List<PostalAddressItem> postalAddresses = new ArrayList<>();
    private List<ImAddressItem> imAddresses = new ArrayList<>();
    private List<UrlAddressItem> urlAddresses = new ArrayList<>();
    private List<RelationshipItem> relationships = new ArrayList<>();

    public Contact(String contactId) {
      this.contactId = contactId;
    }

    // convert to react native object
    public HashMap<String, Object> toMap(Set<String> fieldSet) throws ParseException {
      HashMap<String, Object> contact = new HashMap<String, Object>();
      contact.put("id", contactId);
      contact.put("name", !TextUtils.isEmpty(displayName) ? displayName : givenName + " " + familyName);
      if (!TextUtils.isEmpty(givenName)) {
        contact.put("firstName", givenName);
      }
      if (!TextUtils.isEmpty(middleName)) {
        contact.put("middleName", middleName);
      }
      if (!TextUtils.isEmpty(familyName)) {
        contact.put("lastName", familyName);
      }
      if (!TextUtils.isEmpty(nickname)) {
        contact.put("nickname", nickname);
      }
      if (!TextUtils.isEmpty(suffix)) {
        contact.put("nameSuffix", suffix);
      }
      if (!TextUtils.isEmpty(prefix)) {
        contact.put("namePrefix", prefix);
      }
      if (!TextUtils.isEmpty(phoneticFirstName)) {
        contact.put("phoneticFirstName", phoneticFirstName);
      }
      if (!TextUtils.isEmpty(phoneticLastName)) {
        contact.put("phoneticLastName", phoneticLastName);
      }
      if (!TextUtils.isEmpty(phoneticMiddleName)) {
        contact.put("phoneticMiddleName", phoneticMiddleName);
      }
      if (!TextUtils.isEmpty(company)) {
        contact.put("company", company);
      }
      if (!TextUtils.isEmpty(jobTitle)) {
        contact.put("jobTitle", jobTitle);
      }
      if (!TextUtils.isEmpty(department)) {
        contact.put("department", department);
      }
      contact.put("imageAvailable", this.hasPhoto);
      if (fieldSet.contains("thumbnail")) {
        HashMap<String, Object> thumbnail = new HashMap<String, Object>();
        thumbnail.put("uri", this.hasPhoto ? photoUri : null);
        contact.put("thumbnail", thumbnail);
      }

      if (fieldSet.contains("note") && !TextUtils.isEmpty(note)) { // double if check with query
        contact.put("note", note);
      }

      if (fieldSet.contains("phoneNumbers")) {
        ArrayList phoneNumbers = new ArrayList();
        for (Item item : phones) {
          HashMap<String, Object> map = new HashMap<String, Object>();
          map.put("number", item.value);
          map.put("label", item.label);
          map.put("id", item.id);
          map.put("primary", item.primary);
          phoneNumbers.add(map);
        }
        contact.put("phoneNumbers", phoneNumbers);
      }

      if (fieldSet.contains("emails")) {
        ArrayList emailAddresses = new ArrayList();
        for (Item item : emails) {
          HashMap<String, Object> map = new HashMap<String, Object>();
          map.put("email", item.value);
          map.put("label", item.label);
          map.put("id", item.id);
          map.put("primary", item.primary);
          emailAddresses.add(map);
        }
        contact.put("emails", emailAddresses);
      }

      if (fieldSet.contains("addresses")) {
        ArrayList postalAddresses = new ArrayList();
        for (PostalAddressItem item : this.postalAddresses) {
          postalAddresses.add(item.map);
        }
        contact.put("addresses", postalAddresses);
      }

      if (fieldSet.contains("instantMessageAddresses")) {
        ArrayList imAddresses = new ArrayList();
        for (ImAddressItem item : this.imAddresses) {
          imAddresses.add(item.map);
        }
        contact.put("instantMessageAddresses", imAddresses);
      }

      if (fieldSet.contains("urlAddresses")) {
        ArrayList urlAddresses = new ArrayList();
        for (UrlAddressItem item : this.urlAddresses) {
          urlAddresses.add(item.map);
        }
        contact.put("urlAddresses", urlAddresses);
      }

      if (fieldSet.contains("relationships")) {
        ArrayList relationships = new ArrayList();
        for (RelationshipItem item : this.relationships) {
          relationships.add(item.map);
        }
        contact.put("relationships", relationships);
      }

      boolean showBirthday = fieldSet.contains("birthday");
      boolean showDates = fieldSet.contains("dates");

      if (showDates || showBirthday) { // double if check with query with cursor
        boolean hasYear;
        Calendar calendar = Calendar.getInstance();
        SimpleDateFormat datePattern = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        SimpleDateFormat noYearPattern = new SimpleDateFormat("--MM-dd", Locale.getDefault());

        ArrayList datesArray = new ArrayList();
        for (Item item : dates) {
          HashMap<String, Object> details = new HashMap<String, Object>();
          String dateString = item.value;
          String label = item.label;

          hasYear = !dateString.startsWith("--");

          if (hasYear) {
            calendar.setTime(datePattern.parse(dateString));
          } else {
            calendar.setTime(noYearPattern.parse(dateString));
          }

          if (hasYear) {
            details.put("year", calendar.get(Calendar.YEAR));
          }
          details.put("month", calendar.get(Calendar.MONTH) + 1);
          details.put("day", calendar.get(Calendar.DAY_OF_MONTH));
          if (showBirthday && label.equals("birthday")) {
            contact.put("birthday", details);
          } else {
            details.put("label", label);
            datesArray.add(details);
          }
        }
        if (showDates && datesArray.size() > 0) {
          contact.put("dates", datesArray);
        }
      }

      return contact;
    }

    public static class Item {
      public String label;
      public String value;
      public boolean primary;
      public String id;

      public Item(String label, String value) {
        this.label = label;
        this.value = value;
      }

      public Item(String label, String value, int isPrimary, String id) {
        this.label = label;
        this.value = value;
        this.primary = isPrimary == 1;
        this.id = id;
      }
    }

    public static class PostalAddressItem {
      public final HashMap<String, Object> map;

      public PostalAddressItem(Cursor cursor) {
        map = new HashMap<String, Object>();

        map.put("label", getLabel(cursor));
        putString(cursor, "formattedAddress", CommonDataKinds.StructuredPostal.FORMATTED_ADDRESS);
        putString(cursor, "street", CommonDataKinds.StructuredPostal.STREET);
        putString(cursor, "poBox", CommonDataKinds.StructuredPostal.POBOX);
        putString(cursor, "neighborhood", CommonDataKinds.StructuredPostal.NEIGHBORHOOD);
        putString(cursor, "city", CommonDataKinds.StructuredPostal.CITY);
        putString(cursor, "region", CommonDataKinds.StructuredPostal.REGION);
        putString(cursor, "state", CommonDataKinds.StructuredPostal.REGION);
        putString(cursor, "postalCode", CommonDataKinds.StructuredPostal.POSTCODE);
        putString(cursor, "country", CommonDataKinds.StructuredPostal.COUNTRY);
        putString(cursor, "id", CommonDataKinds.StructuredPostal._ID);
      }

      private void putString(Cursor cursor, String key, String androidKey) {
        final String value = cursor.getString(cursor.getColumnIndex(androidKey));
        if (!TextUtils.isEmpty(value))
          map.put(key, value);
      }

      static String getLabel(Cursor cursor) {
        switch (cursor.getInt(cursor.getColumnIndex(CommonDataKinds.StructuredPostal.TYPE))) {
          case CommonDataKinds.StructuredPostal.TYPE_HOME:
            return "home";
          case CommonDataKinds.StructuredPostal.TYPE_WORK:
            return "work";
          case CommonDataKinds.StructuredPostal.TYPE_OTHER:
            return "other";
          case CommonDataKinds.StructuredPostal.TYPE_CUSTOM:
            final String label = cursor.getString(cursor.getColumnIndex(CommonDataKinds.StructuredPostal.LABEL));
            return label != null ? label : "";
        }
        return "unknown";
      }
    }

    public static class ImAddressItem {
      public final HashMap<String, Object> map;

      public ImAddressItem(Cursor cursor) {
        String username = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Im.DATA));
        int type = cursor.getInt(cursor.getColumnIndex(CommonDataKinds.Im.TYPE));
        int protocol = cursor.getInt(cursor.getColumnIndex(CommonDataKinds.Im.PROTOCOL));
        long imId = cursor.getLong(cursor.getColumnIndex(CommonDataKinds.Im._ID));

        map = new HashMap<String, Object>();

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

        map.put("username", username);
        map.put("label", label);
        map.put("service", service);
        map.put("id", String.valueOf(imId));
      }
    }

    public static class UrlAddressItem {
      public final HashMap<String, Object> map;

      public UrlAddressItem(Cursor cursor) {
        map = new HashMap<String, Object>();
        map.put("url", cursor.getString(cursor.getColumnIndex(CommonDataKinds.Website.URL)));
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

        map.put("label", label);
        map.put("id", String.valueOf(cursor.getLong(cursor.getColumnIndex(CommonDataKinds.Website._ID))));
      }
    }

    public static class RelationshipItem {
      public final HashMap<String, Object> map;

      public RelationshipItem(Cursor cursor) {
        map = new HashMap<String, Object>();
        map.put("name", cursor.getString(cursor.getColumnIndex(CommonDataKinds.Relation.NAME)));
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

        map.put("label", label);
        map.put("id", String.valueOf(cursor.getLong(cursor.getColumnIndex(CommonDataKinds.Relation._ID))));
      }
    }
  }

  private Set<String> getFieldsSet(final List<String> fields) {
    Set<String> fieldStrings = new HashSet<>();
    for (int ii = 0; ii < fields.size(); ii++) {
      String field = fields.get(ii);
      if (field != null) {
        fieldStrings.add(field);
      }
    }
    return fieldStrings;
  }
}
