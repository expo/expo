package expo.modules.constants;

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
 * Similar class exists in expoview and expo-notifications.
 */
public class ExponentInstallationId {
  private static final String TAG = ExponentInstallationId.class.getSimpleName();

  public static final String LEGACY_UUID_KEY = "uuid";
  public static final String UUID_FILE_NAME = "expo_installation_uuid.txt";
  private static final String PREFERENCES_FILE_NAME = "host.exp.exponent.SharedPreferences";

  private String mUuid;
  private Context mContext;
  private SharedPreferences mSharedPreferences;

  /* package */ ExponentInstallationId(Context context) {
    mContext = context;
    mSharedPreferences = context.getSharedPreferences(PREFERENCES_FILE_NAME, Context.MODE_PRIVATE);
  }

  public String getUUID() {
    // If it has already been cached, return the value.
    if (mUuid != null) {
      return mUuid;
    }

    // Read from non-backed-up storage
    File uuidFile = getNonBackedUpUuidFile();
    try (FileReader fileReader = new FileReader(uuidFile);
         BufferedReader bufferedReader = new BufferedReader(fileReader)) {
      // Cache for future calls
      mUuid = UUID.fromString(bufferedReader.readLine()).toString();
    } catch (IOException | IllegalArgumentException e) {
      // do nothing, try other sources
    }

    // We could have returned inside try clause,
    // but putting it like this here makes it immediately
    // visible.
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

      try (FileWriter writer = new FileWriter(uuidFile)) {
        writer.write(legacyUuid);
      } catch (IOException e) {
        uuidHasBeenSuccessfullyMigrated = false;
        Log.e(TAG, "Error while migrating UUID from legacy storage. " + e);
      }

      // We only remove the value from old storage once it's set and saved in the new storage.
      if (uuidHasBeenSuccessfullyMigrated) {
        mSharedPreferences.edit().remove(LEGACY_UUID_KEY).apply();
      }
    }

    // Return either value from legacy storage or null
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
    try (FileWriter writer = new FileWriter(getNonBackedUpUuidFile())) {
      writer.write(mUuid);
    } catch (IOException e) {
      Log.e(TAG, "Error while writing new UUID. " + e);
    }
    return mUuid;
  }

  private File getNonBackedUpUuidFile() {
    return new File(mContext.getNoBackupFilesDir(), UUID_FILE_NAME);
  }
}
