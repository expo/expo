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

  private Context mContext;
  private String mScope;
  private File mFilesDir;
  private File mCacheDir;
  private ScopedApplicationContext mScopedApplicationContext;

  public ScopedContext(final Context context, final String scope) {
    super(context);
    mContext = context;
    mScope = scope + '-';

    mFilesDir = new File(mContext.getFilesDir() + "/ExperienceData/" + scope);
    mCacheDir = new File(mContext.getCacheDir() + "/ExperienceData/" + scope);

    if (Constants.isStandaloneApp()) {
      if (firstStartAfterUpdate()) {
        moveOldFiles();
      }
      mFilesDir = mContext.getFilesDir();
      mCacheDir = mContext.getCacheDir();
    }
  }

  boolean firstStartAfterUpdate() {
    return mFilesDir.exists();
  }

  // The purpose of this method is to properly move data from old scoped path to unscoped one.
  // We need this method in case somebody wants to update standalone app.
  // This method can be removed when sdk 32 is phased out.
  void moveOldFiles() {
    mFilesDir.renameTo(mContext.getFilesDir());
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
  public AssetManager getAssets() {
    return mContext.getAssets();
  }

  @Override
  public Resources getResources() {
    return mContext.getResources();
  }

  @Override
  public PackageManager getPackageManager() {
    return mContext.getPackageManager();
  }

  @Override
  public ContentResolver getContentResolver() {
    return mContext.getContentResolver();
  }

  @Override
  public Looper getMainLooper() {
    return mContext.getMainLooper();
  }

  @Override
  public Context getApplicationContext() {
    if (mScopedApplicationContext == null) {
      mScopedApplicationContext = new ScopedApplicationContext((Application) mContext.getApplicationContext(), this);
    }

    return mScopedApplicationContext;
  }

  @Override
  public void setTheme(int resid) {
    mContext.setTheme(resid);
  }

  @Override
  public Resources.Theme getTheme() {
    return mContext.getTheme();
  }

  @Override
  public ClassLoader getClassLoader() {
    return mContext.getClassLoader();
  }

  @Override
  public String getPackageName() {
    // Can't scope this because Google Apis rely on this being the same as the actual
    // package name.
    EXL.d(TAG, "WARNING: getPackageName called on ScopedContext");
    return mContext.getPackageName();
  }

  @Override
  public ApplicationInfo getApplicationInfo() {
    return mContext.getApplicationInfo();
  }

  @Override
  public String getPackageResourcePath() {
    return mContext.getPackageResourcePath();
  }

  @Override
  public String getPackageCodePath() {
    return mContext.getPackageCodePath();
  }

  @Override
  public SharedPreferences getSharedPreferences(String name, int mode) {
    return mContext.getSharedPreferences(mScope + name, mode);
  }

  @Override
  public boolean moveSharedPreferencesFrom(Context context, String s) {
    return mContext.moveSharedPreferencesFrom(context, mScope + s);
  }

  @Override
  public boolean deleteSharedPreferences(String s) {
    return mContext.deleteSharedPreferences(mScope + s);
  }

  // TODO: scope all file methods
  @Override
  public FileInputStream openFileInput(String name) throws FileNotFoundException {
    return mContext.openFileInput(name);
  }

  @Override
  public FileOutputStream openFileOutput(String name, int mode) throws FileNotFoundException {
    return mContext.openFileOutput(name, mode);
  }

  @Override
  public boolean deleteFile(String name) {
    return mContext.deleteFile(name);
  }

  @Override
  public File getFileStreamPath(String name) {
    return mContext.getFileStreamPath(name);
  }

  @Override
  public File getDataDir() {
    return mContext.getDataDir();
  }

  @Override
  public File getFilesDir() {
    return mFilesDir;
  }

  @Override
  public File getNoBackupFilesDir() {
    return mContext.getNoBackupFilesDir();
  }

  @Nullable
  @Override
  public File getExternalFilesDir(String type) {
    return mContext.getExternalFilesDir(type);
  }

  @Override
  public File[] getExternalFilesDirs(String type) {
    return mContext.getExternalFilesDirs(type);
  }

  @Override
  public File getObbDir() {
    return mContext.getObbDir();
  }

  @Override
  public File[] getObbDirs() {
    return mContext.getObbDirs();
  }

  @Override
  public File getCacheDir() {
    return mCacheDir;
  }

  @Override
  public File getCodeCacheDir() {
    return mContext.getCodeCacheDir();
  }

  @Nullable
  @Override
  public File getExternalCacheDir() {
    return mContext.getExternalCacheDir();
  }

  @Override
  public File[] getExternalCacheDirs() {
    return mContext.getExternalCacheDirs();
  }

  @Override
  public File[] getExternalMediaDirs() {
    return mContext.getExternalMediaDirs();
  }

  @Override
  public String[] fileList() {
    return mContext.fileList();
  }

  @Override
  public File getDir(String name, int mode) {
    return mContext.getDir(name, mode);
  }

  @Override
  public SQLiteDatabase openOrCreateDatabase(String name, int mode, SQLiteDatabase.CursorFactory factory) {
    return mContext.openOrCreateDatabase(mScope + name, mode, factory);
  }

  @Override
  public SQLiteDatabase openOrCreateDatabase(String name, int mode, SQLiteDatabase.CursorFactory factory, DatabaseErrorHandler errorHandler) {
    return mContext.openOrCreateDatabase(mScope + name, mode, factory, errorHandler);
  }

  @Override
  public boolean moveDatabaseFrom(Context context, String s) {
    return false;
  }

  @Override
  public boolean deleteDatabase(String name) {
    return mContext.deleteDatabase(mScope + name);
  }

  @Override
  public File getDatabasePath(String name) {
    return mContext.getDatabasePath(mScope + name);
  }

  @Override
  public String[] databaseList() {
    String[] list = mContext.databaseList();
    List<String> scopedList = new ArrayList();
    for (int i = 0; i < list.length; i++) {
      if (list[i].startsWith(mScope)) {
        scopedList.add(list[i].substring(mScope.length()));
      }
    }

    return scopedList.toArray(new String[scopedList.size()]);
  }

  @Override
  public Drawable getWallpaper() {
    return mContext.getWallpaper();
  }

  @Override
  public Drawable peekWallpaper() {
    return mContext.peekWallpaper();
  }

  @Override
  public int getWallpaperDesiredMinimumWidth() {
    return mContext.getWallpaperDesiredMinimumWidth();
  }

  @Override
  public int getWallpaperDesiredMinimumHeight() {
    return mContext.getWallpaperDesiredMinimumHeight();
  }

  @Override
  public void setWallpaper(Bitmap bitmap) throws IOException {
    mContext.setWallpaper(bitmap);
  }

  @Override
  public void setWallpaper(InputStream data) throws IOException {
    mContext.setWallpaper(data);
  }

  @Override
  public void clearWallpaper() throws IOException {
    mContext.clearWallpaper();
  }

  @Override
  public void startActivity(Intent intent) {
    mContext.startActivity(intent);
  }

  @Override
  public void startActivity(Intent intent, Bundle options) {
    mContext.startActivity(intent, options);
  }

  @Override
  public void startActivities(Intent[] intents) {
    mContext.startActivities(intents);
  }

  @Override
  public void startActivities(Intent[] intents, Bundle options) {
    mContext.startActivities(intents, options);
  }

  @Override
  public void startIntentSender(IntentSender intent, Intent fillInIntent, int flagsMask, int flagsValues, int extraFlags) throws IntentSender.SendIntentException {
    mContext.startIntentSender(intent, fillInIntent, flagsMask, flagsValues, extraFlags);
  }

  @Override
  public void startIntentSender(IntentSender intent, Intent fillInIntent, int flagsMask, int flagsValues, int extraFlags, Bundle options) throws IntentSender.SendIntentException {
    mContext.startIntentSender(intent, fillInIntent, flagsMask, flagsValues, extraFlags, options);
  }

  @Override
  public void sendBroadcast(Intent intent) {
    mContext.sendBroadcast(intent);
  }

  @Override
  public void sendBroadcast(Intent intent, String receiverPermission) {
    mContext.sendBroadcast(intent, receiverPermission);
  }

  @Override
  public void sendOrderedBroadcast(Intent intent, String receiverPermission) {
    mContext.sendOrderedBroadcast(intent, receiverPermission);
  }

  @Override
  public void sendOrderedBroadcast(Intent intent, String receiverPermission, BroadcastReceiver resultReceiver, Handler scheduler, int initialCode, String initialData, Bundle initialExtras) {
    mContext.sendOrderedBroadcast(intent, receiverPermission, resultReceiver, scheduler, initialCode, initialData, initialExtras);
  }

  @Override
  public void sendBroadcastAsUser(Intent intent, UserHandle user) {
    mContext.sendBroadcastAsUser(intent, user);
  }

  @Override
  public void sendBroadcastAsUser(Intent intent, UserHandle user, String receiverPermission) {
    mContext.sendBroadcastAsUser(intent, user, receiverPermission);
  }

  @Override
  public void sendOrderedBroadcastAsUser(Intent intent, UserHandle user, String receiverPermission, BroadcastReceiver resultReceiver, Handler scheduler, int initialCode, String initialData, Bundle initialExtras) {
    mContext.sendOrderedBroadcastAsUser(intent, user, receiverPermission, resultReceiver, scheduler, initialCode, initialData, initialExtras);
  }

  @Override
  public void sendStickyBroadcast(Intent intent) {
    mContext.sendStickyBroadcast(intent);
  }

  @Override
  public void sendStickyOrderedBroadcast(Intent intent, BroadcastReceiver resultReceiver, Handler scheduler, int initialCode, String initialData, Bundle initialExtras) {
    mContext.sendStickyOrderedBroadcast(intent, resultReceiver, scheduler, initialCode, initialData, initialExtras);
  }

  @Override
  public void removeStickyBroadcast(Intent intent) {
    mContext.removeStickyBroadcast(intent);
  }

  @Override
  public void sendStickyBroadcastAsUser(Intent intent, UserHandle user) {
    mContext.sendStickyBroadcastAsUser(intent, user);
  }

  @Override
  public void sendStickyOrderedBroadcastAsUser(Intent intent, UserHandle user, BroadcastReceiver resultReceiver, Handler scheduler, int initialCode, String initialData, Bundle initialExtras) {
    mContext.sendStickyOrderedBroadcastAsUser(intent, user, resultReceiver, scheduler, initialCode, initialData, initialExtras);
  }

  @Override
  public void removeStickyBroadcastAsUser(Intent intent, UserHandle user) {
    mContext.removeStickyBroadcastAsUser(intent, user);
  }

  @Nullable
  @Override
  public Intent registerReceiver(BroadcastReceiver receiver, IntentFilter filter) {
    return mContext.registerReceiver(receiver, filter);
  }

  @Override
  public Intent registerReceiver(BroadcastReceiver broadcastReceiver, IntentFilter intentFilter, int i) {
    return mContext.registerReceiver(broadcastReceiver, intentFilter, i);
  }

  @Nullable
  @Override
  public Intent registerReceiver(BroadcastReceiver receiver, IntentFilter filter, String broadcastPermission, Handler scheduler) {
    return mContext.registerReceiver(receiver, filter, broadcastPermission, scheduler);
  }

  @Override
  public Intent registerReceiver(BroadcastReceiver broadcastReceiver, IntentFilter intentFilter, String s, Handler handler, int i) {
    return mContext.registerReceiver(broadcastReceiver, intentFilter, s, handler, i);
  }

  @Override
  public void unregisterReceiver(BroadcastReceiver receiver) {
    mContext.unregisterReceiver(receiver);
  }

  @Nullable
  @Override
  public ComponentName startService(Intent service) {
    return mContext.startService(service);
  }

  @Override
  public ComponentName startForegroundService(Intent intent) {
    return mContext.startForegroundService(intent);
  }

  @Override
  public boolean stopService(Intent service) {
    return mContext.stopService(service);
  }

  @Override
  public boolean bindService(Intent service, ServiceConnection conn, int flags) {
    return mContext.bindService(service, conn, flags);
  }

  @Override
  public void unbindService(ServiceConnection conn) {
    mContext.unbindService(conn);
  }

  @Override
  public boolean startInstrumentation(ComponentName className, String profileFile, Bundle arguments) {
    return mContext.startInstrumentation(className, profileFile, arguments);
  }

  @Override
  public Object getSystemService(String name) {
    return mContext.getSystemService(name);
  }

  @Override
  public String getSystemServiceName(Class<?> serviceClass) {
    return mContext.getSystemServiceName(serviceClass);
  }

  @Override
  public int checkPermission(String permission, int pid, int uid) {
    return mContext.checkPermission(permission, pid, uid);
  }

  @Override
  public int checkCallingPermission(String permission) {
    return mContext.checkCallingPermission(permission);
  }

  @Override
  public int checkCallingOrSelfPermission(String permission) {
    return mContext.checkCallingOrSelfPermission(permission);
  }

  @Override
  public int checkSelfPermission(String permission) {
    return mContext.checkSelfPermission(permission);
  }

  @Override
  public void enforcePermission(String permission, int pid, int uid, String message) {
    mContext.enforcePermission(permission, pid, uid, message);
  }

  @Override
  public void enforceCallingPermission(String permission, String message) {
    mContext.enforceCallingPermission(permission, message);
  }

  @Override
  public void enforceCallingOrSelfPermission(String permission, String message) {
    mContext.enforceCallingOrSelfPermission(permission, message);
  }

  @Override
  public void grantUriPermission(String toPackage, Uri uri, int modeFlags) {
    mContext.grantUriPermission(toPackage, uri, modeFlags);
  }

  @Override
  public void revokeUriPermission(Uri uri, int modeFlags) {
    mContext.revokeUriPermission(uri, modeFlags);
  }

  @Override
  public void revokeUriPermission(String s, Uri uri, int i) {
    mContext.revokeUriPermission(s, uri, i);
  }

  @Override
  public int checkUriPermission(Uri uri, int pid, int uid, int modeFlags) {
    return mContext.checkUriPermission(uri, pid, uid, modeFlags);
  }

  @Override
  public int checkCallingUriPermission(Uri uri, int modeFlags) {
    return mContext.checkCallingUriPermission(uri, modeFlags);
  }

  @Override
  public int checkCallingOrSelfUriPermission(Uri uri, int modeFlags) {
    return mContext.checkCallingOrSelfUriPermission(uri, modeFlags);
  }

  @Override
  public int checkUriPermission(Uri uri, String readPermission, String writePermission, int pid, int uid, int modeFlags) {
    return mContext.checkUriPermission(uri, readPermission, writePermission, pid, uid, modeFlags);
  }

  @Override
  public void enforceUriPermission(Uri uri, int pid, int uid, int modeFlags, String message) {
    mContext.enforceUriPermission(uri, pid, uid, modeFlags, message);
  }

  @Override
  public void enforceCallingUriPermission(Uri uri, int modeFlags, String message) {
    mContext.enforceCallingUriPermission(uri, modeFlags, message);
  }

  @Override
  public void enforceCallingOrSelfUriPermission(Uri uri, int modeFlags, String message) {
    mContext.enforceCallingOrSelfUriPermission(uri, modeFlags, message);
  }

  @Override
  public void enforceUriPermission(Uri uri, String readPermission, String writePermission, int pid, int uid, int modeFlags, String message) {
    mContext.enforceUriPermission(uri, readPermission, writePermission, pid, uid, modeFlags, message);
  }

  @Override
  public Context createPackageContext(String packageName, int flags) throws PackageManager.NameNotFoundException {
    return mContext.createPackageContext(packageName, flags);
  }

  @Override
  public Context createContextForSplit(String s) throws PackageManager.NameNotFoundException {
    return mContext.createContextForSplit(s);
  }

  @Override
  public Context createConfigurationContext(Configuration overrideConfiguration) {
    return mContext.createConfigurationContext(overrideConfiguration);
  }

  @Override
  public Context createDisplayContext(Display display) {
    return mContext.createDisplayContext(display);
  }

  @Override
  public Context createDeviceProtectedStorageContext() {
    return mContext.createDeviceProtectedStorageContext();
  }

  @Override
  public boolean isDeviceProtectedStorage() {
    return mContext.isDeviceProtectedStorage();
  }

  public Context getContext() {
    return mContext;
  }
}
