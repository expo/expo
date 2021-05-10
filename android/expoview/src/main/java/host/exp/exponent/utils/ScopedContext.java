// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.utils;

import android.app.Application;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.ContentResolver;
import android.content.Context;
import android.content.ContextWrapper;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.IntentSender;
import android.content.ServiceConnection;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.res.AssetManager;
import android.content.res.Configuration;
import android.content.res.Resources;
import android.database.DatabaseErrorHandler;
import android.database.sqlite.SQLiteDatabase;
import android.graphics.Bitmap;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.UserHandle;
import androidx.annotation.Nullable;
import android.view.Display;

import com.facebook.react.bridge.Arguments;

import org.apache.commons.io.FileUtils;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import host.exp.exponent.Constants;
import host.exp.exponent.analytics.EXL;

public class ScopedContext extends ContextWrapper {

  private static final String TAG = ScopedContext.class.getSimpleName();
  
  private String mScope;
  private File mFilesDir;
  private File mNoBackupDir;
  private File mCacheDir;
  private ScopedApplicationContext mScopedApplicationContext;

  public ScopedContext(final Context context, final String scope) {
    super(context);
    mScope = scope + '-';

    File scopedFilesDir = new File(getBaseContext().getFilesDir() + "/ExperienceData/" + scope);
    mFilesDir = scopedFilesDir;
    mCacheDir = new File(getBaseContext().getCacheDir() + "/ExperienceData/" + scope);
    mNoBackupDir = new File(getBaseContext().getNoBackupFilesDir() + "/ExperienceData/" + scope);

    if (Constants.isStandaloneApp()) {
      File scopedFilesMigrationMarker = new File(scopedFilesDir, ".expo-migration");
      if (scopedFilesDir.exists() && !scopedFilesMigrationMarker.exists()) {
        migrateAllFiles(scopedFilesDir, getBaseContext().getFilesDir());
      }
      mFilesDir = getBaseContext().getFilesDir();
      mCacheDir = getBaseContext().getCacheDir();
      mNoBackupDir = getBaseContext().getNoBackupFilesDir();
    }
  }

  private void migrateAllFiles(File legacyDir, File newDir) {
    try {
      migrateFilesRecursively(legacyDir, newDir);
      File scopedFilesMigrationMarker = new File(legacyDir, ".expo-migration");
      scopedFilesMigrationMarker.createNewFile();
    } catch (Exception e) {
      EXL.e(TAG, e);
    }
  }

  private void migrateFilesRecursively(File legacyDir, File newDir) {
    File[] files = legacyDir.listFiles();

    for (File file : files) {
      String fileName = file.getName();
      File newLocation = new File(newDir, fileName);

      if (file.isDirectory()) {
        if (!newLocation.exists()) {
          newLocation.mkdirs();
        }
        migrateFilesRecursively(file, newLocation);
      } else if (!newLocation.exists()) {
        // if a file with the same name already exists in the new location, ignore
        // we don't want to overwrite potentially newer files
        try {
          FileUtils.copyFile(file, newLocation);
        } catch (Exception e) {
          EXL.e(TAG, e);
        }
      }
    }
  }

  @Deprecated
  public String toScopedPath(String path) throws IOException {
    return toScopedPath(path, new JSONObject());
  }

  @Deprecated
  public String toScopedPath(String path, JSONObject options) throws IOException {
    File root = options.optBoolean("cache", false) ? getCacheDir() : getFilesDir();
    ExpFileUtils.ensureDirExists(root);
    File file = new File(root + "/" + path);
    String fileCanonicalPath = file.getCanonicalPath();
    String rootCanonicalPath = root.getCanonicalPath();
    if (!fileCanonicalPath.startsWith(rootCanonicalPath)) {
      throw new IOException("Path '" + path + "' leads outside scoped directory of experience");
    }
    return file.getAbsolutePath();
  }

  @Override
  public Context getApplicationContext() {
    if (mScopedApplicationContext == null) {
      mScopedApplicationContext = new ScopedApplicationContext((Application) getBaseContext().getApplicationContext(), this);
    }

    return mScopedApplicationContext;
  }

  @Override
  public String getPackageName() {
    // Can't scope this because Google Apis rely on this being the same as the actual
    // package name.
    EXL.d(TAG, "WARNING: getPackageName called on ScopedContext");
    return getBaseContext().getPackageName();
  }

  @Override
  public SharedPreferences getSharedPreferences(String name, int mode) {
    return getBaseContext().getSharedPreferences(mScope + name, mode);
  }

  @Override
  public boolean moveSharedPreferencesFrom(Context context, String s) {
    return getBaseContext().moveSharedPreferencesFrom(context, mScope + s);
  }

  @Override
  public boolean deleteSharedPreferences(String s) {
    return getBaseContext().deleteSharedPreferences(mScope + s);
  }

  // TODO: scope all file methods
  @Override
  public File getFilesDir() {
    return mFilesDir;
  }

  @Override
  public File getCacheDir() {
    return mCacheDir;
  }

  @Override
  public File getNoBackupFilesDir() {
    // We only need to create the directory if someone
    // asks for it - that's why .mkdirs() is not
    // in the constructor.
    //noinspection ResultOfMethodCallIgnored
    mNoBackupDir.mkdirs();
    return mNoBackupDir;
  }

  @Override
  public SQLiteDatabase openOrCreateDatabase(String name, int mode, SQLiteDatabase.CursorFactory factory) {
    return getBaseContext().openOrCreateDatabase(mScope + name, mode, factory);
  }

  @Override
  public SQLiteDatabase openOrCreateDatabase(String name, int mode, SQLiteDatabase.CursorFactory factory, DatabaseErrorHandler errorHandler) {
    return getBaseContext().openOrCreateDatabase(mScope + name, mode, factory, errorHandler);
  }

  @Override
  public boolean moveDatabaseFrom(Context context, String s) {
    return false;
  }

  @Override
  public boolean deleteDatabase(String name) {
    return getBaseContext().deleteDatabase(mScope + name);
  }

  @Override
  public File getDatabasePath(String name) {
    return getBaseContext().getDatabasePath(mScope + name);
  }

  @Override
  public String[] databaseList() {
    String[] list = getBaseContext().databaseList();
    List<String> scopedList = new ArrayList();
    for (int i = 0; i < list.length; i++) {
      if (list[i].startsWith(mScope)) {
        scopedList.add(list[i].substring(mScope.length()));
      }
    }

    return scopedList.toArray(new String[scopedList.size()]);
  }

  public Context getContext() {
    return getBaseContext();
  }
}
