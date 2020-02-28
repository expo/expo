// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sqlite;

import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteStatement;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;

public class SQLiteModule extends ExportedModule {
  private static final boolean DEBUG_MODE = false;

  private static final String TAG = SQLiteModule.class.getSimpleName();

  private static final Object[][] EMPTY_ROWS = new Object[][]{};
  private static final String[] EMPTY_COLUMNS = new String[]{};
  private static final SQLitePluginResult EMPTY_RESULT = new SQLitePluginResult(EMPTY_ROWS, EMPTY_COLUMNS, 0, 0, null);

  private static final Map<String, SQLiteDatabase> DATABASES = new HashMap<String, SQLiteDatabase>();

  private Context mContext;

  public SQLiteModule(Context scopedContext) {
    super(scopedContext);
    mContext = scopedContext;
  }

  @Override
  public String getName() {
    return "ExponentSQLite";
  }

  @ExpoMethod
  public void exec(String dbName, ArrayList<ArrayList<Object>> queries, Boolean readOnly, final Promise promise) {
    try {
      int numQueries = queries.size();
      SQLitePluginResult[] results = new SQLitePluginResult[numQueries];
      SQLiteDatabase db = getDatabase(dbName);

      for (int i = 0; i < numQueries; i++) {
        ArrayList<Object> sqlQuery = queries.get(i);
        String sql = (String) sqlQuery.get(0);
        String[] bindArgs = convertParamsToStringArray(sqlQuery.get(1));
        try {
          if (isSelect(sql)) {
            results[i] = doSelectInBackgroundAndPossiblyThrow(sql, bindArgs, db);
          } else { // update/insert/delete
            if (readOnly) {
              results[i] = new SQLitePluginResult(EMPTY_ROWS, EMPTY_COLUMNS, 0, 0, new ReadOnlyException());
            } else {
              results[i] = doUpdateInBackgroundAndPossiblyThrow(sql, bindArgs, db);
            }
          }
        } catch (Throwable e) {
          if (DEBUG_MODE) {
            e.printStackTrace();
          }
          results[i] = new SQLitePluginResult(EMPTY_ROWS, EMPTY_COLUMNS, 0, 0, e);
        }
      }
      List<Object> data = pluginResultsToPrimitiveData(results);
      promise.resolve(data);
    } catch (Exception e) {
      promise.reject("SQLiteError", e);
    }
  }

  @ExpoMethod
  public void close(String dbName, final Promise promise) {
    DATABASES.get(dbName).close();
    DATABASES.remove(dbName);
    promise.resolve(null);
  }

  // do a update/delete/insert operation
  private SQLitePluginResult doUpdateInBackgroundAndPossiblyThrow(String sql, String[] bindArgs,
                                                                  SQLiteDatabase db) {
    SQLiteStatement statement = null;
    try {
      statement = db.compileStatement(sql);
      if (bindArgs != null) {
        for (int i = bindArgs.length; i != 0; i--) {
          if (bindArgs[i - 1] == null) {
            statement.bindNull(i);
          } else {
            statement.bindString(i, bindArgs[i - 1]);
          }
        }
      }
      if (isInsert(sql)) {
        long insertId = statement.executeInsert();
        int rowsAffected = insertId >= 0 ? 1 : 0;
        return new SQLitePluginResult(EMPTY_ROWS, EMPTY_COLUMNS, rowsAffected, insertId, null);
      } else if (isDelete(sql) || isUpdate(sql)) {
        int rowsAffected = statement.executeUpdateDelete();
        return new SQLitePluginResult(EMPTY_ROWS, EMPTY_COLUMNS, rowsAffected, 0, null);
      } else {
        // in this case, we don't need rowsAffected or insertId, so we can have a slight
        // perf boost by just executing the query
        statement.execute();
        return EMPTY_RESULT;
      }
    } finally {
      if (statement != null) {
        statement.close();
      }
    }
  }

  // do a select operation
  private SQLitePluginResult doSelectInBackgroundAndPossiblyThrow(String sql, String[] bindArgs,
                                                                  SQLiteDatabase db) {
    Cursor cursor = null;
    try {
      cursor = db.rawQuery(sql, bindArgs);
      int numRows = cursor.getCount();
      if (numRows == 0) {
        return EMPTY_RESULT;
      }
      int numColumns = cursor.getColumnCount();
      Object[][] rows = new Object[numRows][];
      String[] columnNames = cursor.getColumnNames();
      for (int i = 0; cursor.moveToNext(); i++) {
        Object[] row = new Object[numColumns];
        for (int j = 0; j < numColumns; j++) {
          row[j] = getValueFromCursor(cursor, j, cursor.getType(j));
        }
        rows[i] = row;
      }
      return new SQLitePluginResult(rows, columnNames, 0, 0, null);
    } finally {
      if (cursor != null) {
        cursor.close();
      }
    }
  }

  private Object getValueFromCursor(Cursor cursor, int index, int columnType) {
    switch (columnType) {
      case Cursor.FIELD_TYPE_FLOAT:
        return cursor.getDouble(index);
      case Cursor.FIELD_TYPE_INTEGER:
        return cursor.getLong(index);
      case Cursor.FIELD_TYPE_BLOB:
        // convert byte[] to binary string; it's good enough, because
        // WebSQL doesn't support blobs anyway
        return new String(cursor.getBlob(index));
      case Cursor.FIELD_TYPE_STRING:
        return cursor.getString(index);
    }
    return null;
  }

  private static File ensureDirExists(File dir) throws IOException {
    if (!dir.isDirectory()) {
      if (dir.isFile()) {
        throw new IOException("Path '" + dir + "' points to a file, but must point to a directory.");
      }
      if (!dir.mkdirs()) {
        String additionalErrorMessage = null;
        if (dir.exists()) {
          additionalErrorMessage = "Path already points to a non-normal file.";
        }
        if (dir.getParentFile() == null) {
          additionalErrorMessage = "Parent directory is null.";
        }
        throw new IOException("Couldn't create directory '" + dir + "'. " + (additionalErrorMessage == null ? "" : additionalErrorMessage));
      }
    }
    return dir;
  }

  private String pathForDatabaseName(String name) throws IOException {
    File directory = new File(mContext.getFilesDir() + File.separator + "SQLite");
    ensureDirExists(directory);
    return directory + File.separator + name;
  }

  private SQLiteDatabase getDatabase(String name) throws IOException {
    SQLiteDatabase database = null;
    String path = pathForDatabaseName(name);
    if ((new File(path)).exists()) {
      database = DATABASES.get(name);
    }
    if (database == null) {
      DATABASES.remove(name);
      database = SQLiteDatabase.openOrCreateDatabase(path, null);
      DATABASES.put(name, database);
    }
    return database;
  }

  private static List<Object> pluginResultsToPrimitiveData(SQLitePluginResult[] results) {
    List<Object> list = new ArrayList<>();
    for (int i = 0; i < results.length; i++) {
      SQLitePluginResult result = results[i];
      List<Object> arr = convertPluginResultToArray(result);
      list.add(arr);
    }
    return list;
  }

  private static List<Object> convertPluginResultToArray(SQLitePluginResult result) {
    List<Object> data = new ArrayList<>();
    if (result.error != null) {
      data.add(result.error.getMessage());
    } else {
      data.add(null);
    }
    data.add((int) result.insertId);
    data.add(result.rowsAffected);

    // column names
    List<String> columnNames = new ArrayList<>();
    for (int i = 0; i < result.columns.length; i++) {
      columnNames.add(result.columns[i]);
    }
    data.add(columnNames);

    // rows
    List<Object> rows = new ArrayList<>();
    for (int i = 0; i < result.rows.length; i++) {
      Object[] values = result.rows[i];
      // row content
      List<Object> rowContent = new ArrayList<>();
      for (int j = 0; j < values.length; j++) {
        Object value = values[j];
        if (value == null) {
          rowContent.add(null);
        } else if (value instanceof String) {
          rowContent.add((String) value);
        } else if (value instanceof Boolean) {
          rowContent.add((Boolean) value);
        } else {
          Number v = (Number) value;
          rowContent.add(v.doubleValue());
        }
      }
      rows.add(rowContent);
    }
    data.add(rows);
    return data;
  }

  private static boolean isPragma(String str) {
    return startsWithCaseInsensitive(str, "pragma");
  }

  private static boolean isPragmaReadOnly(String str) {
    if (!isPragma(str)) {
      return false;
    }
    if (str.matches(".*=.*")) {
      return false;
    }
    return true;
  }

  private static boolean isSelect(String str) {
    return startsWithCaseInsensitive(str, "select") || isPragmaReadOnly(str);
  }

  private static boolean isInsert(String str) {
    return startsWithCaseInsensitive(str, "insert");
  }

  private static boolean isUpdate(String str) {
    return startsWithCaseInsensitive(str, "update");
  }

  private static boolean isDelete(String str) {
    return startsWithCaseInsensitive(str, "delete");
  }

  // identify an "insert"/"select" query more efficiently than with a Pattern
  private static boolean startsWithCaseInsensitive(String str, String substr) {
    int i = -1;
    int len = str.length();
    while (++i < len) {
      char ch = str.charAt(i);
      if (!Character.isWhitespace(ch)) {
        break;
      }
    }

    int j = -1;
    int substrLen = substr.length();
    while (++j < substrLen) {
      if (j + i >= len) {
        return false;
      }
      char ch = str.charAt(j + i);
      if (Character.toLowerCase(ch) != substr.charAt(j)) {
        return false;
      }
    }
    return true;
  }

  private static String[] convertParamsToStringArray(Object paramArrayArg) {
    ArrayList<Object> paramArray = (ArrayList<Object>) paramArrayArg;
    int len = paramArray.size();
    String[] res = new String[len];
    for (int i = 0; i < len; i++) {
      Object object = paramArray.get(i);
      res[i] = null;
      if (object instanceof String) {
        res[i] = unescapeBlob((String) object);
      } else if (object instanceof Boolean) {
        res[i] = ((Boolean) object) ? "1" : "0";
      } else if (object instanceof Double) {
        res[i] = object.toString();
      } else if (object != null) {
        throw new ClassCastException("Could not find proper SQLite data type for argument: " + object.toString());
      }
    }
    return res;
  }

  private static String unescapeBlob(String str) {
    return str.replaceAll("\u0001\u0001", "\u0000")
        .replaceAll("\u0001\u0002", "\u0001")
        .replaceAll("\u0002\u0002", "\u0002");
  }

  private static class SQLitePluginResult {
    public final Object[][] rows;
    public final String[] columns;
    public final int rowsAffected;
    public final long insertId;
    public final Throwable error;

    public SQLitePluginResult(Object[][] rows, String[] columns,
                              int rowsAffected, long insertId, Throwable error) {
      this.rows = rows;
      this.columns = columns;
      this.rowsAffected = rowsAffected;
      this.insertId = insertId;
      this.error = error;
    }
  }

  private static class ReadOnlyException extends Exception {
    public ReadOnlyException() {
      super("could not prepare statement (23 not authorized)");
    }
  }
}
