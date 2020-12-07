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
 *   in shared-across-expo-modules SharedPreferences,
 *   migrates the UUID from there to a non-backed-up file,
 * - provides/creates a UUID unique per an installation.
 *
 * Similar class exists in expoview and expo-constants.
 */
public class InstallationId {
  private static final String TAG = InstallationId.class.getSimpleName();

  public static final String LEGACY_UUID_KEY = "uuid";
  public static final String UUID_FILE_NAME = "expo_installation_uuid.txt";
  public static final String SCOPED_UUID_FILE_NAME = "expo_notifications_installation_uuid.txt";
  private static final String PREFERENCES_FILE_NAME = "host.exp.exponent.SharedPreferences";

  private String mUuid;
  private Context mContext;
  private SharedPreferences mSharedPreferences;

  public InstallationId(Context context) {
    mContext = context;
    mSharedPreferences = context.getSharedPreferences(PREFERENCES_FILE_NAME, Context.MODE_PRIVATE);
  }

  public String getUUID() {
    // If it has already been cached, return the value.
    if (mUuid != null) {
      return mUuid;
    }

    // Read from scoped non-backed-up storage in case the ID
    // has already been migrated by managed code at some point
    // in the past.
    mUuid = readUUID(new File(mContext.getNoBackupFilesDir(), SCOPED_UUID_FILE_NAME));
    if (mUuid != null) {
      return mUuid;
    }

    // In November 2020 we decided to move installationID (backed by LEGACY_UUID_KEY value) from backed-up SharedPreferences
    // to a non-backed-up text file to fix issues where devices restored from backups have the same installation IDs
    // as the devices where the backup was created.
    String legacyUuid = mSharedPreferences.getString(LEGACY_UUID_KEY, null);
    if (legacyUuid != null) {
      mUuid = legacyUuid;

      boolean uuidHasBeenSuccessfullyMigrated = true;

      try {
        saveUUID(mUuid);
      } catch (IOException e) {
        uuidHasBeenSuccessfullyMigrated = false;
        Log.e(TAG, "Error while migrating UUID from legacy storage. " + e);
      }

      // We only remove the value from old storage once it's set and saved in the new storage.
      if (uuidHasBeenSuccessfullyMigrated) {
        mSharedPreferences.edit().remove(LEGACY_UUID_KEY).apply();
      }
    }
    if (mUuid != null) {
      return mUuid;
    }

    // Ready from non-scoped non-backed-up storage
    mUuid = readUUID(new File(mContext.getNoBackupFilesDir(), UUID_FILE_NAME));
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

  protected String readUUID(File file) {
    try (FileReader fileReader = new FileReader(file);
         BufferedReader bufferedReader = new BufferedReader(fileReader)) {
      // Cache for future calls
      return UUID.fromString(bufferedReader.readLine()).toString();
    } catch (IOException | IllegalArgumentException e) {
      // do nothing, try other sources
    }
    return null;
  }

  protected void saveUUID(String uuid) throws IOException {
    try (FileWriter writer = new FileWriter(getFileToWriteIdTo())) {
      writer.write(uuid);
    }
  }

  protected File getFileToWriteIdTo() {
    return new File(mContext.getNoBackupFilesDir(), UUID_FILE_NAME);
  }
}
