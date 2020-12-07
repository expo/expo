package versioned.host.exp.exponent.modules.universal.notifications;

import android.content.Context;

import java.io.File;

import expo.modules.constants.ExponentInstallationId;
import expo.modules.notifications.serverregistration.InstallationId;

/**
 * A customization of {@link InstallationId} modifying location
 * of the installation ID file to one that is *not* shared with
 * other Expo modules. This makes expo-notifications installation
 * ID provider maintain the same installation identifier
 * in managed apps upgraded from SDK39 to SDK40. Without this change
 * unscoped {@link InstallationId} would read the "shared"
 * installation ID migrated by {@link ExponentInstallationId}
 * or {@link host.exp.exponent.storage.ExponentSharedPreferences}
 */
public class ScopedInstallationId extends InstallationId {
  public static final String UUID_FILE_NAME = "expo_notifications_installation_id.txt";

  private Context mContext;

  public ScopedInstallationId(Context context) {
    super(context);
    mContext = context;
  }

  @Override
  protected File getNonBackedUpUuidFile() {
    return new File(mContext.getNoBackupFilesDir(), UUID_FILE_NAME);
  }
}
