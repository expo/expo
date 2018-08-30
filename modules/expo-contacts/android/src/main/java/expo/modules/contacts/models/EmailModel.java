package expo.modules.contacts.models;

import android.database.Cursor;
import android.provider.ContactsContract;

import expo.modules.contacts.EXColumns;

public class EmailModel extends BaseModel {

  @Override
  public String getContentType() {
    return ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE;
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
      case ContactsContract.CommonDataKinds.Email.TYPE_HOME:
        return "home";
      case ContactsContract.CommonDataKinds.Email.TYPE_WORK:
        return "work";
      case ContactsContract.CommonDataKinds.Email.TYPE_MOBILE:
        return "mobile";
      case ContactsContract.CommonDataKinds.Email.TYPE_OTHER:
        return "other";
      default:
        return "unknown";
    }
  }
}