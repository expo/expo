package versioned.host.exp.exponent.modules.universal.notifications;

import android.content.Context;

import java.io.File;
import java.io.UnsupportedEncodingException;

import expo.modules.constants.ExponentInstallationId;
import expo.modules.notifications.serverregistration.InstallationId;
import host.exp.exponent.Constants;
import host.exp.exponent.kernel.ExperienceId;

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
  private ExperienceId mExperienceId;

  public ScopedInstallationId(Context context, ExperienceId experienceId) {
    super(context);
    mContext = context;
    mExperienceId = experienceId;
  }

  @Override
  protected File getNonBackedUpUuidFile() {
    if (!Constants.isStandaloneApp()) {
      try {
        return new File(mContext.getNoBackupFilesDir(), mExperienceId.getUrlEncoded() + "-" + UUID_FILE_NAME);
      } catch (UnsupportedEncodingException e) {
        // In an unlikely case of a device not supporting UTF-8 encoding
        // let's ignore the exception and use a single ID storage for all
        // Expo Go experiences. (The experience wouldn't run if the ID
        // could not have been encoded, so it's *really* unlikely
        // we'd get to here).
      }
    }

    // By using a well-known location for ID in standalone managed apps
    // we let ourselves fetch the same ID in bare apps too.
    return new File(mContext.getNoBackupFilesDir(), UUID_FILE_NAME);
  }
}
