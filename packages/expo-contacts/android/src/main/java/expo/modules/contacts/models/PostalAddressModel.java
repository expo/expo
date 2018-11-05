package expo.modules.contacts.models;

import android.content.ContentProviderOperation;
import android.content.ContentValues;
import android.database.Cursor;
import android.provider.ContactsContract;

import java.util.Map;

import expo.modules.contacts.EXColumns;

public class PostalAddressModel extends BaseModel {

  @Override
  public String getContentType() {
    return ContactsContract.CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE;
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
        postalAddressType = ContactsContract.CommonDataKinds.StructuredPostal.TYPE_HOME;
        break;
      case "work":
        postalAddressType = ContactsContract.CommonDataKinds.StructuredPostal.TYPE_WORK;
        break;
      default:
        postalAddressType = ContactsContract.CommonDataKinds.StructuredPostal.TYPE_OTHER;
        break;
    }
    return postalAddressType;
  }

  @Override
  public void fromCursor(Cursor cursor) {
    super.fromCursor(cursor);

    putString(cursor, "formattedAddress", ContactsContract.CommonDataKinds.StructuredPostal.FORMATTED_ADDRESS);
    putString(cursor, "street", ContactsContract.CommonDataKinds.StructuredPostal.STREET);
    putString(cursor, "poBox", ContactsContract.CommonDataKinds.StructuredPostal.POBOX);
    putString(cursor, "neighborhood", ContactsContract.CommonDataKinds.StructuredPostal.NEIGHBORHOOD);
    putString(cursor, "city", ContactsContract.CommonDataKinds.StructuredPostal.CITY);
    putString(cursor, "region", ContactsContract.CommonDataKinds.StructuredPostal.REGION);
    putString(cursor, "state", ContactsContract.CommonDataKinds.StructuredPostal.REGION);
    putString(cursor, "postalCode", ContactsContract.CommonDataKinds.StructuredPostal.POSTCODE);
    putString(cursor, "country", ContactsContract.CommonDataKinds.StructuredPostal.COUNTRY);
  }

  @Override
  public void fromMap(Map<String, Object> readableMap) {
    super.fromMap(readableMap);
    mapValue(readableMap, "region", "state");
  }

  @Override
  public ContentProviderOperation getOperation() {
    ContentProviderOperation.Builder op = ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
        .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
        .withValue(EXColumns.MIMETYPE, getContentType())
        .withValue(ContactsContract.CommonDataKinds.StructuredPostal.TYPE, getType())
        .withValue(ContactsContract.CommonDataKinds.StructuredPostal.STREET, getString("street"))
        .withValue(ContactsContract.CommonDataKinds.StructuredPostal.CITY, getString("city"))
        .withValue(ContactsContract.CommonDataKinds.StructuredPostal.REGION, getString("region"))
        .withValue(ContactsContract.CommonDataKinds.StructuredPostal.POSTCODE, getString("postalCode"))
        .withValue(ContactsContract.CommonDataKinds.StructuredPostal.COUNTRY, getString("country"));
    return op.build();
  }

  @Override
  public ContentValues getContentValues() {
    ContentValues values = super.getContentValues();
    values.put(ContactsContract.CommonDataKinds.StructuredPostal.STREET, getString("street"));
    values.put(ContactsContract.CommonDataKinds.StructuredPostal.CITY, getString("city"));
    values.put(ContactsContract.CommonDataKinds.StructuredPostal.REGION, getString("region"));
    values.put(ContactsContract.CommonDataKinds.StructuredPostal.COUNTRY, getString("country"));
    values.put(ContactsContract.CommonDataKinds.StructuredPostal.POSTCODE, getString("postalCode"));
    return values;
  }

  @Override
  protected String getLabelFromCursor(Cursor cursor) {
    String label = super.getLabelFromCursor(cursor);
    if (label != null) return label;
    switch (cursor.getInt(cursor.getColumnIndex(EXColumns.TYPE))) {
      case ContactsContract.CommonDataKinds.StructuredPostal.TYPE_HOME:
        return "home";
      case ContactsContract.CommonDataKinds.StructuredPostal.TYPE_WORK:
        return "work";
      case ContactsContract.CommonDataKinds.StructuredPostal.TYPE_OTHER:
        return "other";
      default:
        return "unknown";
    }
  }

}