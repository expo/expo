package host.exp.exponent.notifications.channels;

import android.app.NotificationChannel;
import android.app.NotificationChannelGroup;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import host.exp.exponent.kernel.ExperienceId;

public class ScopedNotificationsChannelUtils {
  static final String SCOPED_GROUP_TAG = "EXPO_GROUP";
  static final String SCOPED_CHANNEL_TAG = "EXPO_CHANNEL";
  static final String SEPARATOR = "/";

  @NonNull
  static String getScopedChannelId(@NonNull ExperienceId experienceId, @NonNull String channelId) {
    return SCOPED_CHANNEL_TAG + SEPARATOR + experienceId.get() + SEPARATOR + channelId;
  }

  @NonNull
  static String getScopedGroupId(@NonNull ExperienceId experienceId, @NonNull String channelId) {
    return SCOPED_GROUP_TAG + SEPARATOR + experienceId.get() + SEPARATOR + channelId;
  }

  @Nullable
  static String getUnscopedId(@Nullable String scopedId) {
    if (scopedId == null || !scopedId.startsWith(SCOPED_CHANNEL_TAG) && !scopedId.startsWith(SCOPED_GROUP_TAG)) {
      return scopedId;
    }

    String[] idFragments = scopedId.split(SEPARATOR);
    StringBuilder sb = new StringBuilder();
    for (int i = 3; i < idFragments.length; i++) {
      sb.append(idFragments[i]);
    }

    return sb.toString();
  }

  @RequiresApi(api = Build.VERSION_CODES.O)
  static boolean checkIfGroupBelongsToExperience(@NonNull ExperienceId experienceId, @NonNull NotificationChannelGroup channelGroup) {
    return checkIfIdBelongsToExperience(experienceId, channelGroup.getId());
  }

  @RequiresApi(api = Build.VERSION_CODES.O)
  static boolean checkIfChannelBelongsToExperience(@NonNull ExperienceId experienceId, @NonNull NotificationChannel channel) {
    return checkIfIdBelongsToExperience(experienceId, channel.getId());
  }

  private static boolean checkIfIdBelongsToExperience(@NonNull ExperienceId experienceId, @NonNull String scopedId) {
    // Backward compatibility with unscoped channels.
    if (!scopedId.startsWith(SCOPED_CHANNEL_TAG)) {
      return true;
    }

    return experienceId.get().equals(getExperienceIdFromScopedId(scopedId));
  }

  private static String getExperienceIdFromScopedId(@NonNull String scopedId) {
    // Scoped id looks like this: `EXPOCHANNEL/@expo/sandbox/id`.
    String[] idFragments = scopedId.split(SEPARATOR);
    return idFragments[1] + SEPARATOR + idFragments[2];
  }
}
