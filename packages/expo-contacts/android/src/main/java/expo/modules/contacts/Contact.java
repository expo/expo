package expo.modules.contacts;

import android.content.ContentProviderOperation;
import android.content.ContentValues;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Bundle;
import android.provider.ContactsContract;
import android.text.TextUtils;
import android.util.Log;

import androidx.annotation.Nullable;

import java.io.ByteArrayOutputStream;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import expo.modules.contacts.models.BaseModel;
import expo.modules.contacts.models.DateModel;
import expo.modules.contacts.models.EmailModel;
import expo.modules.contacts.models.ExtraNameModel;
import expo.modules.contacts.models.ImAddressModel;
import expo.modules.contacts.models.PhoneNumberModel;
import expo.modules.contacts.models.PostalAddressModel;
import expo.modules.contacts.models.RelationshipModel;
import expo.modules.contacts.models.UrlAddressModel;

import static android.provider.ContactsContract.CommonDataKinds;
import static android.provider.ContactsContract.CommonDataKinds.Organization;
import static android.provider.ContactsContract.CommonDataKinds.StructuredName;
import static android.provider.ContactsContract.Contacts;
import static android.provider.ContactsContract.Data;
import static android.provider.ContactsContract.RawContacts;

// TODO: MaidenName Nickname
public class Contact {

  protected String contactId;
  protected String rawContactId;
  protected String lookupKey;

  protected String displayName;

  protected boolean isMe = false;
  protected boolean hasPhoto = false;
  protected String photoUri;
  protected String rawPhotoUri;

  protected String contactType = "person";

  protected String firstName = "";
  protected String middleName = "";
  protected String lastName = "";
  // protected String nickname = "";
  protected String prefix = "";
  protected String suffix = "";
  protected String phoneticFirstName = "";
  protected String phoneticMiddleName = "";
  protected String phoneticLastName = "";

  protected String company = "";
  protected String department = "";
  protected String jobTitle = "";

  protected String note;

  protected List<BaseModel> dates = new ArrayList<>();
  protected List<BaseModel> emails = new ArrayList<>();
  protected List<BaseModel> imAddresses = new ArrayList<>();
  protected List<BaseModel> phones = new ArrayList<>();
  protected List<BaseModel> addresses = new ArrayList<>();
  protected List<BaseModel> relationships = new ArrayList<>();
  protected List<BaseModel> urlAddresses = new ArrayList<>();
  protected List<BaseModel> extraNames = new ArrayList<>();

  public void fromCursor(Cursor cursor) {
    rawContactId = cursor.getString(cursor.getColumnIndex(Data.RAW_CONTACT_ID));
    String mimeType = cursor.getString(cursor.getColumnIndex(Data.MIMETYPE));

    String name = cursor.getString(cursor.getColumnIndex(Contacts.DISPLAY_NAME));
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

    // this.isMe = cursor.getInt(cursor.getColumnIndex(EXColumns.IS_PRIMARY)) == 1;

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
      this.note = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Note.NOTE));
    } else if (mimeType.equals(CommonDataKinds.Event.CONTENT_ITEM_TYPE)) {
      BaseModel item = new DateModel();
      item.fromCursor(cursor);
      this.dates.add(item);
    } else if (mimeType.equals(CommonDataKinds.Email.CONTENT_ITEM_TYPE)) {
      BaseModel item = new EmailModel();
      item.fromCursor(cursor);
      this.emails.add(item);
    } else if (mimeType.equals(CommonDataKinds.Im.CONTENT_ITEM_TYPE)) {
      BaseModel item = new ImAddressModel();
      item.fromCursor(cursor);
      this.imAddresses.add(item);
    } else if (mimeType.equals(CommonDataKinds.Phone.CONTENT_ITEM_TYPE)) {
      BaseModel item = new PhoneNumberModel();
      item.fromCursor(cursor);
      this.phones.add(item);
    } else if (mimeType.equals(CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE)) {
      BaseModel item = new PostalAddressModel();
      item.fromCursor(cursor);
      this.addresses.add(item);
    } else if (mimeType.equals(CommonDataKinds.Relation.CONTENT_ITEM_TYPE)) {
      BaseModel item = new RelationshipModel();
      item.fromCursor(cursor);
      this.relationships.add(item);
    } else if (mimeType.equals(CommonDataKinds.Website.CONTENT_ITEM_TYPE)) {
      BaseModel urlAddressModel = new UrlAddressModel();
      urlAddressModel.fromCursor(cursor);
      this.urlAddresses.add(urlAddressModel);
    } else if (mimeType.equals(CommonDataKinds.Nickname.CONTENT_ITEM_TYPE)) {
      BaseModel item = new ExtraNameModel();
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
      return displayName == null ? "" : displayName;
    }
    return firstName;
  }

  public String getLastName() {
    if (lastName == null) {
      return displayName == null ? "" : displayName;
    }
    return lastName;
  }

  @Nullable
  public String getDisplayName() {
    if (displayName == null && firstName != null) {
      return lastName == null ? firstName : String.format("%s %s", firstName, lastName).trim();
    }

    return displayName;
  }

  public Contact(String contactId) {
    this.contactId = contactId;
  }

  public byte[] toByteArray(Bitmap bitmap) {
    ByteArrayOutputStream stream = new ByteArrayOutputStream();
    bitmap.compress(Bitmap.CompressFormat.JPEG, 80, stream);
    return stream.toByteArray();
  }

  public ArrayList<ContentProviderOperation> toInsertOperationList() {
    ArrayList<ContentProviderOperation> ops = new ArrayList<>();

    ContentProviderOperation.Builder op = ContentProviderOperation.newInsert(RawContacts.CONTENT_URI)
      .withValue(RawContacts.ACCOUNT_TYPE, null)
      .withValue(RawContacts.ACCOUNT_NAME, null);
    ops.add(op.build());

    op = ContentProviderOperation.newInsert(Data.CONTENT_URI)
      .withValueBackReference(Data.RAW_CONTACT_ID, 0)
      .withValue(Data.MIMETYPE, StructuredName.CONTENT_ITEM_TYPE)
      .withValue(StructuredName.DISPLAY_NAME, displayName)
      .withValue(StructuredName.GIVEN_NAME, firstName)
      .withValue(StructuredName.MIDDLE_NAME, middleName)
      .withValue(StructuredName.FAMILY_NAME, lastName)
      .withValue(StructuredName.PHONETIC_GIVEN_NAME, phoneticFirstName)
      .withValue(StructuredName.PHONETIC_MIDDLE_NAME, phoneticMiddleName)
      .withValue(StructuredName.PHONETIC_FAMILY_NAME, phoneticLastName)
      .withValue(StructuredName.PREFIX, prefix)
      .withValue(StructuredName.SUFFIX, suffix);
    ops.add(op.build());

    op = ContentProviderOperation.newInsert(Data.CONTENT_URI)
      .withValueBackReference(Data.RAW_CONTACT_ID, 0)
      .withValue(EXColumns.MIMETYPE, Organization.CONTENT_ITEM_TYPE)
      .withValue(Organization.COMPANY, company)
      .withValue(Organization.TITLE, jobTitle)
      .withValue(Organization.DEPARTMENT, department);
    ops.add(op.build());

    op = ContentProviderOperation.newInsert(Data.CONTENT_URI)
      .withValueBackReference(Data.RAW_CONTACT_ID, 0)
      .withValue(EXColumns.MIMETYPE, CommonDataKinds.Note.CONTENT_ITEM_TYPE)
      .withValue(CommonDataKinds.Note.NOTE, note);
    ops.add(op.build());

    op.withYieldAllowed(true);

    if (!TextUtils.isEmpty(photoUri) || !TextUtils.isEmpty(rawPhotoUri)) {
      Bitmap photo = getThumbnailBitmap(TextUtils.isEmpty(rawPhotoUri) ? photoUri : rawPhotoUri);

      if (photo != null) {
        ops.add(ContentProviderOperation.newInsert(Data.CONTENT_URI)
          .withValueBackReference(Data.RAW_CONTACT_ID, 0)
          .withValue(EXColumns.MIMETYPE, CommonDataKinds.Photo.CONTENT_ITEM_TYPE)
          .withValue(CommonDataKinds.Photo.PHOTO, toByteArray(photo))
          .build());
      }
    }

    for (List<BaseModel> map : getBaseModels()) {
      if (map != null) {
        for (BaseModel item : map) {
          ops.add(item.getInsertOperation());
        }
      }
    }

    return ops;
  }

  public ArrayList<ContentProviderOperation> toUpdateOperationList() {
    String selection = String.format("%s=? AND %s=?", Data.CONTACT_ID, Data.MIMETYPE);
    String[] selectionArgs = new String[]{contactId, StructuredName.CONTENT_ITEM_TYPE};

    ArrayList<ContentProviderOperation> ops = new ArrayList();
    ContentProviderOperation.Builder op;

    op = ContentProviderOperation.newUpdate(Data.CONTENT_URI)
      .withSelection(selection, selectionArgs)
      .withValue(StructuredName.DISPLAY_NAME, displayName)
      .withValue(StructuredName.GIVEN_NAME, firstName)
      .withValue(StructuredName.MIDDLE_NAME, middleName)
      .withValue(StructuredName.FAMILY_NAME, lastName)
      .withValue(StructuredName.PHONETIC_GIVEN_NAME, phoneticFirstName)
      .withValue(StructuredName.PHONETIC_MIDDLE_NAME, phoneticMiddleName)
      .withValue(StructuredName.PHONETIC_FAMILY_NAME, phoneticLastName)
      .withValue(StructuredName.PREFIX, prefix).withValue(StructuredName.SUFFIX, suffix);
    ops.add(op.build());

    op = ContentProviderOperation.newUpdate(Data.CONTENT_URI)
      .withSelection(selection, selectionArgs)
      .withValue(Organization.COMPANY, company)
      .withValue(Organization.TITLE, jobTitle)
      .withValue(Organization.DEPARTMENT, department);
    ops.add(op.build());

    op = ContentProviderOperation.newUpdate(Data.CONTENT_URI)
      .withSelection(selection, new String[]{contactId, CommonDataKinds.Note.CONTENT_ITEM_TYPE})
      .withValue(CommonDataKinds.Note.NOTE, note);
    ops.add(op.build());

    op.withYieldAllowed(true);

    if (!TextUtils.isEmpty(photoUri) || !TextUtils.isEmpty(rawPhotoUri)) {
      Bitmap photo = getThumbnailBitmap(TextUtils.isEmpty(rawPhotoUri) ? photoUri : rawPhotoUri);

      if (photo != null) {
        ops.add(ContentProviderOperation.newDelete(ContactsContract.Data.CONTENT_URI)
          .withSelection(selection,
            new String[]{rawContactId, CommonDataKinds.Photo.CONTENT_ITEM_TYPE})
          .build());

        ops.add(ContentProviderOperation.newInsert(Data.CONTENT_URI)
          .withValue(ContactsContract.Data.RAW_CONTACT_ID, rawContactId)
          .withValue(EXColumns.MIMETYPE, CommonDataKinds.Photo.CONTENT_ITEM_TYPE)
          .withValue(CommonDataKinds.Photo.PHOTO, toByteArray(photo))
          .build());
      }
    }

    for (List<BaseModel> map : getBaseModels()) {
      if (map != null) {
        for (BaseModel item : map) {
          ops.add(item.getDeleteOperation(rawContactId));
          ops.add(item.getInsertOperation(rawContactId));
        }
      }
    }
    return ops;
  }


  List[] getBaseModels() {
    return new List[]{dates, emails, imAddresses, phones, addresses, relationships, urlAddresses, extraNames};
  }

  // convert to react native object
  public Bundle toMap(Set<String> fieldSet) throws ParseException {
    Bundle contact = new Bundle();
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
      Bundle image = new Bundle();
      image.putString("uri", photoUri);
      contact.putBundle("image", image);
    }
    if (fieldSet.contains("rawImage") && rawPhotoUri != null) {
      Bundle image = new Bundle();
      image.putString("uri", rawPhotoUri);
      contact.putBundle("image", image);
    }

    if (fieldSet.contains("note") && !TextUtils.isEmpty(note))
      contact.putString("note", note);

    if (fieldSet.contains("phoneNumbers") && phones.size() > 0) {
      ArrayList<Bundle> items = new ArrayList();
      for (BaseModel item : phones)
        items.add(item.getMap());
      contact.putParcelableArrayList("phoneNumbers", items);
    }

    if (fieldSet.contains("emails") && emails.size() > 0) {
      ArrayList<Bundle> items = new ArrayList();
      for (BaseModel item : emails)
        items.add(item.getMap());
      contact.putParcelableArrayList("emails", items);
    }

    if (fieldSet.contains("addresses") && addresses.size() > 0) {
      ArrayList<Bundle> items = new ArrayList();
      for (BaseModel item : addresses)
        items.add(item.getMap());
      contact.putParcelableArrayList("addresses", items);
    }

    if (fieldSet.contains("instantMessageAddresses") && imAddresses.size() > 0) {
      ArrayList<Bundle> items = new ArrayList();
      for (BaseModel item : imAddresses)
        items.add(item.getMap());
      contact.putParcelableArrayList("instantMessageAddresses", items);
    }

    if (fieldSet.contains("urlAddresses") && urlAddresses.size() > 0) {
      ArrayList<Bundle> items = new ArrayList();
      for (BaseModel item : urlAddresses)
        items.add(item.getMap());
      contact.putParcelableArrayList("urlAddresses", items);
    }

    if (fieldSet.contains("relationships") && relationships.size() > 0) {
      ArrayList<Bundle> items = new ArrayList();
      for (BaseModel item : relationships)
        items.add(item.getMap());
      contact.putParcelableArrayList("relationships", items);
    }

    if (extraNames.size() > 0) {
      boolean showNickname = fieldSet.contains("nickname");
      boolean showMaidenName = fieldSet.contains("maidenName");

      for (int i = 0; i < extraNames.size(); i++) {
        ExtraNameModel item = (ExtraNameModel) extraNames.get(i);

        String data = item.getData();
        String label = item.getLabel();

        if (showMaidenName && label != null && label.equals("maidenName")) {
          if (!TextUtils.isEmpty(data))
            contact.putString(label, data);
        }
        if (showNickname && label != null && label.equals("nickname")) {
          if (!TextUtils.isEmpty(data))
            contact.putString(label, data);
        }
      }
      // WritableArray items = Arguments.createArray();
      // items.pushMap(item.getMap());
      // contact.putArray("extraNames", items);
    }

    boolean showBirthday = fieldSet.contains("birthday");
    boolean showDates = fieldSet.contains("dates");

    if (showDates || showBirthday) { // double if check with query with cursor
      boolean hasYear;

      ArrayList<Bundle> rawDatesArray = new ArrayList();
      ArrayList<Bundle> datesArray = new ArrayList();
      for (BaseModel item : dates) {
        Calendar calendar = Calendar.getInstance();
        SimpleDateFormat datePattern = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        SimpleDateFormat noYearPattern = new SimpleDateFormat("--MM-dd", Locale.getDefault());

        Bundle details = new Bundle();
        String dateString = item.getData();
        String label = item.getLabel();

        Bundle rawDate = new Bundle();
        rawDate.putString("type", label);
        rawDate.putString("value", dateString);
        rawDatesArray.add(rawDate);

        try {
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
            contact.putBundle("birthday", details);
          } else {
            details.putString("label", label);
            datesArray.add(details);
          }
        } catch (Exception e) {
          Log.w("Contact", e.toString());
        }
      }
      if (showDates) {
        if (datesArray.size() > 0) {
          contact.putParcelableArrayList("dates", datesArray);
        }
      }
      if (rawDatesArray.size() > 0) {
        contact.putParcelableArrayList("rawDates", rawDatesArray);
      }
    }

    return contact;
  }

  public ArrayList<ContentValues> getContentValues() {

    ArrayList<ContentValues> contactData = new ArrayList<>();

    ContentValues name = new ContentValues();
    name.put(Contacts.Data.MIMETYPE, CommonDataKinds.Identity.CONTENT_ITEM_TYPE);
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
    organization.put(Data.MIMETYPE, Organization.CONTENT_ITEM_TYPE);
    organization.put(Organization.COMPANY, company);
    organization.put(Organization.TITLE, jobTitle);
    organization.put(Organization.DEPARTMENT, department);
    contactData.add(organization);

    ContentValues notes = new ContentValues();
    notes.put(Data.MIMETYPE, CommonDataKinds.Note.CONTENT_ITEM_TYPE);
    notes.put(CommonDataKinds.Note.NOTE, note);
    contactData.add(notes);

    if (photoUri != null && !photoUri.isEmpty()) {
      Bitmap photo = getThumbnailBitmap(Uri.parse(photoUri).getPath());

      if (photo != null) {
        ContentValues image = new ContentValues();
        image.put(EXColumns.MIMETYPE, CommonDataKinds.Photo.CONTENT_ITEM_TYPE);
        image.put(CommonDataKinds.Photo.PHOTO, toByteArray(photo));
        contactData.add(image);
      }
    }

    if (rawPhotoUri != null && !rawPhotoUri.isEmpty()) {
      Bitmap photo = getThumbnailBitmap(rawPhotoUri);

      if (photo != null) {
        ContentValues image = new ContentValues();
        image.put(EXColumns.MIMETYPE, CommonDataKinds.Photo.CONTENT_ITEM_TYPE);
        image.put(CommonDataKinds.Photo.PHOTO, toByteArray(photo));
        contactData.add(image);
      }
    }

    for (List<BaseModel> map : getBaseModels())
      if (map != null)
        for (BaseModel item : map)
          contactData.add(item.getContentValues());

    return contactData;
  }


  private Bitmap getThumbnailBitmap(String photoUri) {
    String path = Uri.parse(photoUri).getPath();
    return BitmapFactory.decodeFile(path);
  }
}
