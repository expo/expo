/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package abi49_0_0.com.reactnativecommunity.asyncstorage;

import android.database.Cursor;
import android.database.sqlite.SQLiteStatement;
import android.os.AsyncTask;

import com.facebook.common.logging.FLog;
import abi49_0_0.com.facebook.react.bridge.Arguments;
import abi49_0_0.com.facebook.react.bridge.Callback;
import abi49_0_0.com.facebook.react.bridge.GuardedAsyncTask;
import abi49_0_0.com.facebook.react.bridge.LifecycleEventListener;
import abi49_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi49_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi49_0_0.com.facebook.react.bridge.ReactMethod;
import abi49_0_0.com.facebook.react.bridge.ReadableArray;
import abi49_0_0.com.facebook.react.bridge.WritableArray;
import abi49_0_0.com.facebook.react.bridge.WritableMap;
import abi49_0_0.com.facebook.react.common.ReactConstants;
import abi49_0_0.com.facebook.react.common.annotations.VisibleForTesting;
import abi49_0_0.com.facebook.react.module.annotations.ReactModule;
import abi49_0_0.com.facebook.react.modules.common.ModuleDataCleaner;

import java.util.ArrayDeque;
import java.util.HashSet;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

@ReactModule(name = AsyncStorageModule.NAME)
public class AsyncStorageModule
    extends ReactContextBaseJavaModule implements ModuleDataCleaner.Cleanable, LifecycleEventListener {

  // changed name to not conflict with AsyncStorage from RN repo
  public static final String NAME = "RNC_AsyncSQLiteDBStorage";

  // SQL variable number limit, defined by SQLITE_LIMIT_VARIABLE_NUMBER:
  // https://raw.githubusercontent.com/android/platform_external_sqlite/master/dist/sqlite3.c
  private static final int MAX_SQL_KEYS = 999;

  public ReactDatabaseSupplier mReactDatabaseSupplier;
  private boolean mShuttingDown = false;

  private final SerialExecutor executor;

  public AsyncStorageModule(ReactApplicationContext reactContext) {
    this(
      reactContext,
      BuildConfig.AsyncStorage_useDedicatedExecutor
        ? Executors.newSingleThreadExecutor()
        : AsyncTask.THREAD_POOL_EXECUTOR
    );
  }

  @VisibleForTesting
  AsyncStorageModule(ReactApplicationContext reactContext, Executor executor) {
    super(reactContext);
    // The migration MUST run before the AsyncStorage database is created for the first time.
    AsyncStorageExpoMigration.migrate(reactContext);

    this.executor = new SerialExecutor(executor);
    reactContext.addLifecycleEventListener(this);
    // Creating the database MUST happen after the migration.
    // NOTE(kudo): ExponentAsyncStorageModule will setup the `mReactDatabaseSupplier`
     mReactDatabaseSupplier = ReactDatabaseSupplier.getInstance(reactContext);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void initialize() {
    super.initialize();
    mShuttingDown = false;
  }

  @Override
  public void onCatalystInstanceDestroy() {
    mShuttingDown = true;
  }

  @Override
  public void clearSensitiveData() {
    // Clear local storage. If fails, crash, since the app is potentially in a bad state and could
    // cause a privacy violation. We're still not recovering from this well, but at least the error
    // will be reported to the server.
    mReactDatabaseSupplier.clearAndCloseDatabase();
  }

  @Override
  public void onHostResume() {}

  @Override
  public void onHostPause() {}

  @Override
  public void onHostDestroy() {
    // ensure we close database when activity is destroyed
    mReactDatabaseSupplier.closeDatabase();
  }

  /**
   * Given an array of keys, this returns a map of (key, value) pairs for the keys found, and
   * (key, null) for the keys that haven't been found.
   */
  @ReactMethod
  public void multiGet(final ReadableArray keys, final Callback callback) {
    if (keys == null) {
      callback.invoke(AsyncStorageErrorUtil.getInvalidKeyError(null), null);
      return;
    }

    new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
      @Override
      protected void doInBackgroundGuarded(Void... params) {
        if (!ensureDatabase()) {
          callback.invoke(AsyncStorageErrorUtil.getDBError(null), null);
          return;
        }

        String[] columns = {ReactDatabaseSupplier.KEY_COLUMN, ReactDatabaseSupplier.VALUE_COLUMN};
        HashSet<String> keysRemaining = new HashSet<>();
        WritableArray data = Arguments.createArray();
        for (int keyStart = 0; keyStart < keys.size(); keyStart += MAX_SQL_KEYS) {
          int keyCount = Math.min(keys.size() - keyStart, MAX_SQL_KEYS);
          Cursor cursor = mReactDatabaseSupplier.get().query(
              ReactDatabaseSupplier.TABLE_CATALYST,
              columns,
              AsyncLocalStorageUtil.buildKeySelection(keyCount),
              AsyncLocalStorageUtil.buildKeySelectionArgs(keys, keyStart, keyCount),
              null,
              null,
              null);
          keysRemaining.clear();
          try {
            if (cursor.getCount() != keys.size()) {
              // some keys have not been found - insert them with null into the final array
              for (int keyIndex = keyStart; keyIndex < keyStart + keyCount; keyIndex++) {
                keysRemaining.add(keys.getString(keyIndex));
              }
            }

            if (cursor.moveToFirst()) {
              do {
                WritableArray row = Arguments.createArray();
                row.pushString(cursor.getString(0));
                row.pushString(cursor.getString(1));
                data.pushArray(row);
                keysRemaining.remove(cursor.getString(0));
              } while (cursor.moveToNext());
            }
          } catch (Exception e) {
            FLog.w(ReactConstants.TAG, e.getMessage(), e);
            callback.invoke(AsyncStorageErrorUtil.getError(null, e.getMessage()), null);
            return;
          } finally {
            cursor.close();
          }

          for (String key : keysRemaining) {
            WritableArray row = Arguments.createArray();
            row.pushString(key);
            row.pushNull();
            data.pushArray(row);
          }
          keysRemaining.clear();
        }

        callback.invoke(null, data);
      }
    }.executeOnExecutor(executor);
  }

  /**
   * Inserts multiple (key, value) pairs. If one or more of the pairs cannot be inserted, this will
   * return AsyncLocalStorageFailure, but all other pairs will have been inserted.
   * The insertion will replace conflicting (key, value) pairs.
   */
  @ReactMethod
  public void multiSet(final ReadableArray keyValueArray, final Callback callback) {
    if (keyValueArray.size() == 0) {
      callback.invoke();
      return;
    }

    new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
      @Override
      protected void doInBackgroundGuarded(Void... params) {
        if (!ensureDatabase()) {
          callback.invoke(AsyncStorageErrorUtil.getDBError(null));
          return;
        }

        String sql = "INSERT OR REPLACE INTO " + ReactDatabaseSupplier.TABLE_CATALYST + " VALUES (?, ?);";
        SQLiteStatement statement = mReactDatabaseSupplier.get().compileStatement(sql);
        WritableMap error = null;
        try {
          mReactDatabaseSupplier.get().beginTransaction();
          for (int idx=0; idx < keyValueArray.size(); idx++) {
            if (keyValueArray.getArray(idx).size() != 2) {
              error = AsyncStorageErrorUtil.getInvalidValueError(null);
              return;
            }
            if (keyValueArray.getArray(idx).getString(0) == null) {
              error = AsyncStorageErrorUtil.getInvalidKeyError(null);
              return;
            }
            if (keyValueArray.getArray(idx).getString(1) == null) {
              error = AsyncStorageErrorUtil.getInvalidValueError(null);
              return;
            }

            statement.clearBindings();
            statement.bindString(1, keyValueArray.getArray(idx).getString(0));
            statement.bindString(2, keyValueArray.getArray(idx).getString(1));
            statement.execute();
          }
          mReactDatabaseSupplier.get().setTransactionSuccessful();
        } catch (Exception e) {
          FLog.w(ReactConstants.TAG, e.getMessage(), e);
          error = AsyncStorageErrorUtil.getError(null, e.getMessage());
        } finally {
          try {
            mReactDatabaseSupplier.get().endTransaction();
          } catch (Exception e) {
            FLog.w(ReactConstants.TAG, e.getMessage(), e);
            if (error == null) {
              error = AsyncStorageErrorUtil.getError(null, e.getMessage());
            }
          }
        }
        if (error != null) {
          callback.invoke(error);
        } else {
          callback.invoke();
        }
      }
    }.executeOnExecutor(executor);
  }

  /**
   * Removes all rows of the keys given.
   */
  @ReactMethod
  public void multiRemove(final ReadableArray keys, final Callback callback) {
    if (keys.size() == 0) {
      callback.invoke();
      return;
    }

    new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
      @Override
      protected void doInBackgroundGuarded(Void... params) {
        if (!ensureDatabase()) {
          callback.invoke(AsyncStorageErrorUtil.getDBError(null));
          return;
        }

        WritableMap error = null;
        try {
          mReactDatabaseSupplier.get().beginTransaction();
          for (int keyStart = 0; keyStart < keys.size(); keyStart += MAX_SQL_KEYS) {
            int keyCount = Math.min(keys.size() - keyStart, MAX_SQL_KEYS);
            mReactDatabaseSupplier.get().delete(
                    ReactDatabaseSupplier.TABLE_CATALYST,
                AsyncLocalStorageUtil.buildKeySelection(keyCount),
                AsyncLocalStorageUtil.buildKeySelectionArgs(keys, keyStart, keyCount));
          }
          mReactDatabaseSupplier.get().setTransactionSuccessful();
        } catch (Exception e) {
          FLog.w(ReactConstants.TAG, e.getMessage(), e);
          error = AsyncStorageErrorUtil.getError(null, e.getMessage());
        } finally {
          try {
          mReactDatabaseSupplier.get().endTransaction();
          } catch (Exception e) {
            FLog.w(ReactConstants.TAG, e.getMessage(), e);
            if (error == null) {
              error = AsyncStorageErrorUtil.getError(null, e.getMessage());
            }
          }
        }
        if (error != null) {
          callback.invoke(error);
        } else {
          callback.invoke();
        }
      }
    }.executeOnExecutor(executor);
  }

  /**
   * Given an array of (key, value) pairs, this will merge the given values with the stored values
   * of the given keys, if they exist.
   */
  @ReactMethod
  public void multiMerge(final ReadableArray keyValueArray, final Callback callback) {
    new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
      @Override
      protected void doInBackgroundGuarded(Void... params) {
        if (!ensureDatabase()) {
          callback.invoke(AsyncStorageErrorUtil.getDBError(null));
          return;
        }
        WritableMap error = null;
        try {
          mReactDatabaseSupplier.get().beginTransaction();
          for (int idx = 0; idx < keyValueArray.size(); idx++) {
            if (keyValueArray.getArray(idx).size() != 2) {
              error = AsyncStorageErrorUtil.getInvalidValueError(null);
              return;
            }

            if (keyValueArray.getArray(idx).getString(0) == null) {
              error = AsyncStorageErrorUtil.getInvalidKeyError(null);
              return;
            }

            if (keyValueArray.getArray(idx).getString(1) == null) {
              error = AsyncStorageErrorUtil.getInvalidValueError(null);
              return;
            }

            if (!AsyncLocalStorageUtil.mergeImpl(
                mReactDatabaseSupplier.get(),
                keyValueArray.getArray(idx).getString(0),
                keyValueArray.getArray(idx).getString(1))) {
              error = AsyncStorageErrorUtil.getDBError(null);
              return;
            }
          }
          mReactDatabaseSupplier.get().setTransactionSuccessful();
        } catch (Exception e) {
          FLog.w(ReactConstants.TAG, e.getMessage(), e);
          error = AsyncStorageErrorUtil.getError(null, e.getMessage());
        } finally {
          try {
            mReactDatabaseSupplier.get().endTransaction();
          } catch (Exception e) {
            FLog.w(ReactConstants.TAG, e.getMessage(), e);
            if (error == null) {
              error = AsyncStorageErrorUtil.getError(null, e.getMessage());
            }
          }
        }
        if (error != null) {
          callback.invoke(error);
        } else {
          callback.invoke();
        }
      }
    }.executeOnExecutor(executor);
  }

  /**
   * Clears the database.
   */
  @ReactMethod
  public void clear(final Callback callback) {
    new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
      @Override
      protected void doInBackgroundGuarded(Void... params) {
        if (!mReactDatabaseSupplier.ensureDatabase()) {
          callback.invoke(AsyncStorageErrorUtil.getDBError(null));
          return;
        }
        try {
          mReactDatabaseSupplier.clear();
          callback.invoke();
        } catch (Exception e) {
          FLog.w(ReactConstants.TAG, e.getMessage(), e);
          callback.invoke(AsyncStorageErrorUtil.getError(null, e.getMessage()));
        }
      }
    }.executeOnExecutor(executor);
  }

  /**
   * Returns an array with all keys from the database.
   */
  @ReactMethod
  public void getAllKeys(final Callback callback) {
    new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
      @Override
      protected void doInBackgroundGuarded(Void... params) {
        if (!ensureDatabase()) {
          callback.invoke(AsyncStorageErrorUtil.getDBError(null), null);
          return;
        }
        WritableArray data = Arguments.createArray();
        String[] columns = {ReactDatabaseSupplier.KEY_COLUMN};
        Cursor cursor = mReactDatabaseSupplier.get()
            .query(ReactDatabaseSupplier.TABLE_CATALYST, columns, null, null, null, null, null);
        try {
          if (cursor.moveToFirst()) {
            do {
              data.pushString(cursor.getString(0));
            } while (cursor.moveToNext());
          }
        } catch (Exception e) {
          FLog.w(ReactConstants.TAG, e.getMessage(), e);
          callback.invoke(AsyncStorageErrorUtil.getError(null, e.getMessage()), null);
          return;
        } finally {
          cursor.close();
        }
        callback.invoke(null, data);
      }
    }.executeOnExecutor(executor);
  }

  /**
   * Verify the database is open for reads and writes.
   */
  private boolean ensureDatabase() {
    return !mShuttingDown && mReactDatabaseSupplier.ensureDatabase();
  }
}
