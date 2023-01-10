/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.reactnativecommunity.asyncstorage;

import javax.annotation.Nullable;
import java.io.File;
import java.util.Arrays;
import java.util.Iterator;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.os.Build;
import android.text.TextUtils;
import android.util.Log;
import com.facebook.react.bridge.ReadableArray;
import org.json.JSONException;
import org.json.JSONObject;
import static com.reactnativecommunity.asyncstorage.ReactDatabaseSupplier.KEY_COLUMN;
import static com.reactnativecommunity.asyncstorage.ReactDatabaseSupplier.TABLE_CATALYST;
import static com.reactnativecommunity.asyncstorage.ReactDatabaseSupplier.VALUE_COLUMN;

/**
 * Helper for database operations.
 */
public class AsyncLocalStorageUtil {

  /**
   * Build the String required for an SQL select statement:
   *  WHERE key IN (?, ?, ..., ?)
   * without 'WHERE' and with selectionCount '?'
   */
  /* package */ static String buildKeySelection(int selectionCount) {
    String[] list = new String[selectionCount];
    Arrays.fill(list, "?");
    return KEY_COLUMN + " IN (" + TextUtils.join(", ", list) + ")";
  }

  /**
   * Build the String[] arguments needed for an SQL selection, i.e.:
   *  {a, b, c}
   * to be used in the SQL select statement: WHERE key in (?, ?, ?)
   */
  /* package */ static String[] buildKeySelectionArgs(ReadableArray keys, int start, int count) {
    String[] selectionArgs = new String[count];
    for (int keyIndex = 0; keyIndex < count; keyIndex++) {
      selectionArgs[keyIndex] = keys.getString(start + keyIndex);
    }
    return selectionArgs;
  }

  /**
   * Returns the value of the given key, or null if not found.
   */
  public static @Nullable String getItemImpl(SQLiteDatabase db, String key) {
    String[] columns = {VALUE_COLUMN};
    String[] selectionArgs = {key};

    Cursor cursor = db.query(
        TABLE_CATALYST,
        columns,
        KEY_COLUMN + "=?",
        selectionArgs,
        null,
        null,
        null);

    try {
      if (!cursor.moveToFirst()) {
        return null;
      } else {
        return cursor.getString(0);
      }
    } finally {
      cursor.close();
    }
  }

  /**
   * Sets the value for the key given, returns true if successful, false otherwise.
   */
  /* package */ static boolean setItemImpl(SQLiteDatabase db, String key, String value) {
    ContentValues contentValues = new ContentValues();
    contentValues.put(KEY_COLUMN, key);
    contentValues.put(VALUE_COLUMN, value);

    long inserted = db.insertWithOnConflict(
        TABLE_CATALYST,
        null,
        contentValues,
        SQLiteDatabase.CONFLICT_REPLACE);

    return (-1 != inserted);
  }

  /**
   * Does the actual merge of the (key, value) pair with the value stored in the database.
   * NB: This assumes that a database lock is already in effect!
   * @return the errorCode of the operation
   */
  /* package */ static boolean mergeImpl(SQLiteDatabase db, String key, String value)
      throws JSONException {
    String oldValue = getItemImpl(db, key);
    String newValue;

    if (oldValue == null) {
      newValue = value;
    } else {
      JSONObject oldJSON = new JSONObject(oldValue);
      JSONObject newJSON = new JSONObject(value);
      deepMergeInto(oldJSON, newJSON);
      newValue = oldJSON.toString();
    }

    return setItemImpl(db, key, newValue);
  }

  /**
   * Merges two {@link JSONObject}s. The newJSON object will be merged with the oldJSON object by
   * either overriding its values, or merging them (if the values of the same key in both objects
   * are of type {@link JSONObject}). oldJSON will contain the result of this merge.
   */
  private static void deepMergeInto(JSONObject oldJSON, JSONObject newJSON)
      throws JSONException {
    Iterator<?> keys = newJSON.keys();
    while (keys.hasNext()) {
      String key = (String) keys.next();

      JSONObject newJSONObject = newJSON.optJSONObject(key);
      JSONObject oldJSONObject = oldJSON.optJSONObject(key);
      if (newJSONObject != null && oldJSONObject != null) {
        deepMergeInto(oldJSONObject, newJSONObject);
        oldJSON.put(key, oldJSONObject);
      } else {
        oldJSON.put(key, newJSON.get(key));
      }
    }
  }
  /**
   * From Pie and up, Android started to use Write-ahead logging (WAL), instead of journal rollback
   * for atomic commits and rollbacks.
   * Basically, WAL does not write directly to the database file, rather to the supporting WAL file.
   * Because of that, migration to the next storage might not be successful, because the content of
   * RKStorage might be still in WAL file instead. Committing all data from WAL to db file is called
   * a "checkpoint" and is done automatically (by default) when the WAL file reaches a threshold
   * size of 1000 pages.
   * More here: https://sqlite.org/wal.html
   *
   * This helper will force checkpoint on RKStorage, if Next storage file does not exists yet.
   */
  public static void verifyAndForceSqliteCheckpoint(Context ctx) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
        Log.i("AsyncStorage_Next", "SQLite checkpoint not required on this API version.");
    }

    File nextStorageFile = ctx.getDatabasePath("AsyncStorage");
    File currentStorageFile = ctx.getDatabasePath(ReactDatabaseSupplier.DATABASE_NAME);
    boolean isCheckpointRequired = !nextStorageFile.exists() && currentStorageFile.exists();
    if (!isCheckpointRequired) {
      Log.i("AsyncStorage_Next", "SQLite checkpoint not required.");
      return;
    }

    try {
      ReactDatabaseSupplier supplier = ReactDatabaseSupplier.getInstance(ctx);
      supplier.get().rawQuery("PRAGMA wal_checkpoint", null).close();
      supplier.closeDatabase();
      Log.i("AsyncStorage_Next", "Forcing SQLite checkpoint successful.");
    } catch (Exception e) {
      Log.w("AsyncStorage_Next", "Could not force checkpoint on RKStorage, the Next storage might not migrate the data properly: " + e.getMessage());
    }
  }
}
