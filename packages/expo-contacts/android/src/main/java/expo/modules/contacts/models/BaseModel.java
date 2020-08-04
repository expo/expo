package expo.modules.contacts.models;

import android.content.ContentProviderOperation;
import android.content.ContentValues;
import android.database.Cursor;
import android.os.Bundle;
import android.provider.ContactsContract;
import android.text.TextUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import expo.modules.contacts.CommonProvider;
import expo.modules.contacts.EXColumns;

public class BaseModel implements CommonProvider {
  protected final Bundle map;

  static public ArrayList decodeList(List input, Class clazz)
    throws IllegalAccessException, InstantiationException {
    if (input == null)
      return null;

    ArrayList<BaseModel> output = new ArrayList<>();
    for (int i = 0; i < input.size(); i++) {
      BaseModel item = (BaseModel) clazz.newInstance();
      item.fromMap((Map<String, Object>) input.get(i));
      output.add(item);
    }
    return output;
  }

  public int mapStringToType(String label) {
    return 0;
  }

  BaseModel() {
    map = new Bundle();
  }

  protected void mapValue(Map<String, Object> readableMap, String key) {
    mapValue(readableMap, key, null);
  }

  protected void mapValue(Map<String, Object> readableMap, String key, String alias) {
    if (readableMap.containsKey(key)) {
      Object value = readableMap.get(key);
      if (value instanceof Boolean) {
        map.putBoolean(alias == null ? key : alias, (Boolean) readableMap.get(key));
      } else {
        map.putString(alias == null ? key : alias, (String) readableMap.get(key));
      }
    }
  }

  public void fromCursor(Cursor cursor) {
    putString(cursor, getIdAlias(), EXColumns.ID);
    map.putString(getLabelAlias(), getLabelFromCursor(cursor));
    putString(cursor, getDataAlias(), EXColumns.DATA);
    putString(cursor, EXColumns.LABEL, EXColumns.LABEL);
    putString(cursor, getTypeAlias(), EXColumns.TYPE);
    putInt(cursor, getIsPrimaryAlias(), EXColumns.IS_PRIMARY);
  }

  public final ContentProviderOperation getInsertOperation() {
    return getInsertOperation(null);
  }

  public ContentProviderOperation getInsertOperation(String rawId) {
    ContentProviderOperation.Builder op = ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI);
    if (rawId == null) {
      op.withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0);
    } else {
      op.withValue(ContactsContract.Data.RAW_CONTACT_ID, rawId);
    }

    return op.withValue(EXColumns.MIMETYPE, getContentType())
      .withValue(EXColumns.TYPE, mapStringToType(getLabel()))
      .withValue(EXColumns.DATA, getData())
      .withValue(EXColumns.ID, getId())
      .build();
  }

  public ContentProviderOperation getDeleteOperation(String rawId) {
    return ContentProviderOperation.newDelete(ContactsContract.Data.CONTENT_URI)
      .withSelection(
        String.format("%s=? AND %s=?", ContactsContract.Data.MIMETYPE, ContactsContract.Data.RAW_CONTACT_ID),
        new String[]{getContentType(), rawId})
      .build();
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
    if (map.containsKey(getIsPrimaryAlias()))
      return map.getInt(getIsPrimaryAlias());
    return 0;
  }

  public String getString(String key) {
    if (map.containsKey(key))
      return map.getString(key);
    return null;
  }

  public void fromMap(Map<String, Object> readableMap) {
    for (String key : readableMap.keySet()) {
      mapValue(readableMap, key);
    }
  }

  public Bundle getMap() {
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
    int index = cursor.getColumnIndex(androidKey);
    if (index == -1) {
      //TODO:Bacon: Log instances
      return;
    }
    final String value = cursor.getString(index);
    if (!TextUtils.isEmpty(value))
      map.putString(key, value);
  }

  protected void putInt(Cursor cursor, String key, String androidKey) {
    int index = cursor.getColumnIndex(androidKey);
    if (index == -1) {
      //TODO:Bacon: Log instances
      return;
    }
    final int value = cursor.getInt(index);
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
