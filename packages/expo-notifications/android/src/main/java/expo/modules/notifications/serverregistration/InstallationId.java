package expo.modules.notifications.serverregistration;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.UUID;

/**
 * An installation ID provider - it solves two purposes:
 * - in installations that have a legacy UUID persisted
 * in shared-across-expo-modules SharedPreferences or
 * shared-across-expo-modules non-backed-up file,
 * migrates the UUID from there to its own non-backed-up file,
 * - provides/creates a UUID unique per an installation.
 * <p>
 * Similar class exists in expoview and expo-constants.
 */
public class InstallationId {
  private static final String TAG = InstallationId.class.getSimpleName();

  // Legacy storage
  public static final String LEGACY_PREFERENCES_FILE_NAME = "host.exp.exponent.SharedPreferences";
  public static final String LEGACY_PREFERENCES_UUID_KEY = "uuid";

  public static final String LEGACY_UUID_FILE_NAME = "expo_installation_uuid.txt";

  // Primary storage
  public static final String UUID_FILE_NAME = "expo_notifications_installation_uuid.txt";

  private String mUuid;
  private Context mContext;
  private SharedPreferences mLegacySharedPreferences;

  public InstallationId(Context context) {
    mContext = context;
    mLegacySharedPreferences = context.getSharedPreferences(LEGACY_PREFERENCES_FILE_NAME, Context.MODE_PRIVATE);
  }

  public String getUUID() {
    // If it has already been cached, return the value.
    if (mUuid != null) {
      return mUuid;
    }

    // 1. Read from primary storage
    //    If there already is a value it must have been migrated previously.
    mUuid = readUUIDFromFile(new File(mContext.getNoBackupFilesDir(), UUID_FILE_NAME));
    if (mUuid != null) {
      return mUuid;
    }

    // 2. Read from legacy shared preferences
    //    If there is a value we should use it - it's been used by previous versions
    //    of expo-notifications, so in order not to rotate the ID we should migrate it
    //    to new storage.
    mUuid = mLegacySharedPreferences.getString(LEGACY_PREFERENCES_UUID_KEY, null);
    if (mUuid != null) {
      try {
        saveUUID(mUuid);
        // We only remove the value from old storage once it's set and saved in the new storage.
        mLegacySharedPreferences.edit().remove(LEGACY_PREFERENCES_UUID_KEY).apply();
      } catch (IOException e) {
        Log.e(TAG, "Error while migrating UUID from legacy storage. " + e);
      }

      return mUuid;
    }

    // 3. Migrate from legacy file
    //    If there is a value and we've made it up to here it means
    //    expo-notifications hasn't used *its own* ID in the past -
    //    - it used expo-constants' ID. Since it's now deprecated,
    //    let's copy the value to our own storage.
    mUuid = readUUIDFromFile(new File(mContext.getNoBackupFilesDir(), LEGACY_UUID_FILE_NAME));
    if (mUuid != null) {
      try {
        saveUUID(mUuid);
      } catch (IOException e) {
        Log.e(TAG, "Error while migrating UUID from legacy storage. " + e);
      }

      return mUuid;
    }

    //noinspection ConstantConditions
    return mUuid;
  }

  public String getOrCreateUUID() {
    String uuid = getUUID();
    if (uuid != null) {
      return uuid;
    }

    // We persist the new UUID in "session storage"
    // so that if writing to persistent storage
    // fails subsequent calls to get(orCreate)UUID
    // return the same value.
    mUuid = UUID.randomUUID().toString();
    try {
      saveUUID(mUuid);
    } catch (IOException e) {
      Log.e(TAG, "Error while writing new UUID. " + e);
    }
    return mUuid;
  }

  protected String readUUIDFromFile(File file) {
    try (FileReader fileReader = new FileReader(file);
         BufferedReader bufferedReader = new BufferedReader(fileReader)) {
      String line = bufferedReader.readLine();
      // If line is not a UUID, it throws an IllegalArgumentException
      return UUID.fromString(line).toString();
    } catch (IOException | IllegalArgumentException e) {
      return null;
    }
  }

  protected void saveUUID(String uuid) throws IOException {
    try (FileWriter writer = new FileWriter(getNonBackedUpUuidFile())) {
      writer.write(uuid);
    }
  }

  protected File getNonBackedUpUuidFile() {
    return new File(mContext.getNoBackupFilesDir(), UUID_FILE_NAME);
  }
}
