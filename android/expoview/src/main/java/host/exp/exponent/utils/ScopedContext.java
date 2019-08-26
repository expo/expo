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
import android.support.annotation.Nullable;
import android.view.Display;

import com.facebook.react.bridge.Arguments;

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
  private File mCacheDir;
  private ScopedApplicationContext mScopedApplicationContext;

  public ScopedContext(final Context context, final String scope) {
    super(context);
    mScope = scope + '-';

    mFilesDir = new File(getBaseContext().getFilesDir() + "/ExperienceData/" + scope);
    mCacheDir = new File(getBaseContext().getCacheDir() + "/ExperienceData/" + scope);

    if (Constants.isStandaloneApp()) {
      if (firstStartAfterUpdate()) {
        moveOldFiles();
      }
      mFilesDir = getBaseContext().getFilesDir();
      mCacheDir = getBaseContext().getCacheDir();
    }
  }

  boolean firstStartAfterUpdate() {
    return mFilesDir.exists();
  }

  // The purpose of this method is to properly move data from old scoped path to unscoped one.
  // We need this method in case somebody wants to update standalone app.
  // This method can be removed when sdk 32 is phased out.
  void moveOldFiles() {
    mFilesDir.renameTo(getBaseContext().getFilesDir());
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
