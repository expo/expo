/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.modules.storage;

import javax.annotation.Nullable;
import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteException;
import android.database.sqlite.SQLiteOpenHelper;
import com.facebook.common.logging.FLog;
import com.facebook.react.common.ReactConstants;

/**
 * Database supplier of the database used by react native. This creates, opens and deletes the
 * database as necessary.
 */
public class ReactDatabaseSupplier extends SQLiteOpenHelper {

    // VisibleForTesting
    public String DATABASE_NAME = "RKStorage";

    public static int DATABASE_VERSION = 1;

    public static int SLEEP_TIME_MS = 30;

    public static String TABLE_CATALYST = "catalystLocalStorage";

    public static String KEY_COLUMN = "key";

    public static String VALUE_COLUMN = "value";

    public static String VERSION_TABLE_CREATE = "CREATE TABLE " + TABLE_CATALYST + " (" + KEY_COLUMN + " TEXT PRIMARY KEY, " + VALUE_COLUMN + " TEXT NOT NULL" + ")";

    @Nullable
    public static ReactDatabaseSupplier sReactDatabaseSupplierInstance;

    public Context mContext;

    @Nullable
    public SQLiteDatabase mDb;

    // 6 MB in bytes
    public long mMaximumDatabaseSize = 6L * 1024L * 1024L;

    public static ReactDatabaseSupplier getInstance(Context context) {
        if (sReactDatabaseSupplierInstance == null) {
            sReactDatabaseSupplierInstance = new ReactDatabaseSupplier(context.getApplicationContext());
        }
        return sReactDatabaseSupplierInstance;
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL(VERSION_TABLE_CREATE);
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        if (oldVersion != newVersion) {
            deleteDatabase();
            onCreate(db);
        }
    }

    /**
   * Verify the database exists and is open.
   */
    /* package */
    synchronized boolean ensureDatabase() {
        if (mDb != null && mDb.isOpen()) {
            return true;
        }
        // Sometimes retrieving the database fails. We do 2 retries: first without database deletion
        // and then with deletion.
        SQLiteException lastSQLiteException = null;
        for (int tries = 0; tries < 2; tries++) {
            try {
                if (tries > 0) {
                    deleteDatabase();
                }
                mDb = getWritableDatabase();
                break;
            } catch (SQLiteException e) {
                lastSQLiteException = e;
            }
            // Wait before retrying.
            try {
                Thread.sleep(SLEEP_TIME_MS);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
            }
        }
        if (mDb == null) {
            throw lastSQLiteException;
        }
        // This is a sane limit to protect the user from the app storing too much data in the database.
        // This also protects the database from filling up the disk cache and becoming malformed
        // (endTransaction() calls will throw an exception, not rollback, and leave the db malformed).
        mDb.setMaximumSize(mMaximumDatabaseSize);
        return true;
    }

    /**
   * Create and/or open the database.
   */
    public synchronized SQLiteDatabase get() {
        ensureDatabase();
        return mDb;
    }

    public synchronized void clearAndCloseDatabase() throws RuntimeException {
        try {
            clear();
            closeDatabase();
            FLog.d(ReactConstants.TAG, "Cleaned " + DATABASE_NAME);
        } catch (Exception e) {
            // Clearing the database has failed, delete it instead.
            if (deleteDatabase()) {
                FLog.d(ReactConstants.TAG, "Deleted Local Database " + DATABASE_NAME);
                return;
            }
            // Everything failed, throw
            throw new RuntimeException("Clearing and deleting database " + DATABASE_NAME + " failed");
        }
    }

    /* package */
    synchronized void clear() {
        get().delete(TABLE_CATALYST, null, null);
    }

    /**
   * Sets the maximum size the database will grow to. The maximum size cannot
   * be set below the current size.
   */
    public synchronized void setMaximumSize(long size) {
        mMaximumDatabaseSize = size;
        if (mDb != null) {
            mDb.setMaximumSize(mMaximumDatabaseSize);
        }
    }

    private synchronized boolean deleteDatabase() {
        closeDatabase();
        return mContext.deleteDatabase(DATABASE_NAME);
    }

    private synchronized void closeDatabase() {
        if (mDb != null && mDb.isOpen()) {
            mDb.close();
            mDb = null;
        }
    }

    // For testing purposes only!
    public static void deleteInstance() {
        sReactDatabaseSupplierInstance = null;
    }

    public ReactDatabaseSupplier(Context context) {
        super(context, "RKStorage", null, DATABASE_VERSION);
        mContext = context;
        DATABASE_NAME = "RKStorage";
    }

    public ReactDatabaseSupplier(Context context, String databaseName) {
        super(context, databaseName, null, DATABASE_VERSION);
        mContext = context;
        DATABASE_NAME = databaseName;
    }
}
