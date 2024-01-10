package versioned.host.exp.exponent.modules.api.notifications;

import android.app.NotificationChannel;
import android.app.NotificationChannelGroup;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import expo.modules.notifications.notifications.model.NotificationCategory;
import host.exp.exponent.kernel.ExperienceKey;

public class ScopedNotificationsIdUtils {
  static final String SCOPED_GROUP_TAG = "EXPO_GROUP";
  static final String SCOPED_CHANNEL_TAG = "EXPO_CHANNEL";
  static final String SCOPED_CATEGORY_TAG = "EXPO_CATEGORY";
  static final String SEPARATOR = "/";

  @NonNull
  public static String getScopedChannelId(@NonNull ExperienceKey experienceKey, @NonNull String channelId) {
    return SCOPED_CHANNEL_TAG + SEPARATOR + experienceKey.getScopeKey() + SEPARATOR + channelId;
  }

  @NonNull
  public static String getScopedGroupId(@NonNull ExperienceKey experienceKey, @NonNull String channelId) {
    return SCOPED_GROUP_TAG + SEPARATOR + experienceKey.getScopeKey() + SEPARATOR + channelId;
  }

  @NonNull
  public static String getScopedCategoryId(@NonNull ExperienceKey experienceKey, @NonNull String categoryId) {
    return getScopedCategoryIdRaw(experienceKey.getScopeKey(), categoryId);
  }

  @NonNull
  public static String getScopedCategoryIdRaw(@NonNull String experienceScopeKey, @NonNull String categoryId) {
    return SCOPED_CATEGORY_TAG + SEPARATOR + experienceScopeKey + SEPARATOR + categoryId;
  }

  @Nullable
  public static String getUnscopedId(@Nullable String scopedId) {
    if (scopedId == null || !scopedId.startsWith(SCOPED_CHANNEL_TAG) && !scopedId.startsWith(SCOPED_GROUP_TAG) && !scopedId.startsWith(SCOPED_CATEGORY_TAG)) {
      return scopedId;
    }

    String[] idFragments = scopedId.split(SEPARATOR);
    StringBuilder sb = new StringBuilder();
    if (idFragments.length < 3) {
      return scopedId;
    } else if (idFragments.length == 3) {
      // unlogged user or new scope key based ID
      // For unlogged user, the scopedId looks like: EXPO_CHANNEL/UNVERIFIED-192.168.83.49-sandbox/test-channel-id
      // For scope key based ID, the scopedId looks like EXPO_CHANNEL/randomscopekey/test-channel-id
      sb.append(idFragments[2]);
    } else {
      // Scoped id looks like this: `EXPO_CHANNEL/@expo/sandbox/test-channel-id`.
      for (int i = 3; i < idFragments.length; i++) {
        sb.append(idFragments[i]);
      }
    }

    return sb.toString();
  }

  @RequiresApi(api = Build.VERSION_CODES.O)
  public static boolean checkIfGroupBelongsToExperience(@NonNull ExperienceKey experienceKey, @NonNull NotificationChannelGroup channelGroup) {
    return checkIfIdBelongsToExperience(experienceKey, channelGroup.getId());
  }

  @RequiresApi(api = Build.VERSION_CODES.O)
  public static boolean checkIfChannelBelongsToExperience(@NonNull ExperienceKey experienceKey, @NonNull NotificationChannel channel) {
    return checkIfIdBelongsToExperience(experienceKey, channel.getId());
  }

  public static boolean checkIfCategoryBelongsToExperience(@NonNull ExperienceKey experienceKey, @NonNull NotificationCategory category) {
    return checkIfIdBelongsToExperience(experienceKey, category.getIdentifier());
  }

  private static boolean checkIfIdBelongsToExperience(@NonNull ExperienceKey experienceKey, @NonNull String scopedId) {
    // Backward compatibility with unscoped channels.
    if (!scopedId.startsWith(SCOPED_CHANNEL_TAG)) {
      return true;
    }

    return experienceKey.getScopeKey().equals(getExperienceScopeKeyFromScopedId(scopedId));
  }

  private static String getExperienceScopeKeyFromScopedId(@NonNull String scopedId) {
    String[] idFragments = scopedId.split(SEPARATOR);
    if (idFragments.length == 3) {
      // unlogged user or new scope key based ID
      // For unlogged user, the scopedId looks like: EXPO_CHANNEL/UNVERIFIED-192.168.83.49-sandbox/test-channel-id
      // For scope key based ID, the scopedId looks like EXPO_CHANNEL/randomscopekey/test-channel-id
      return idFragments[1];
    }
    // Scoped id looks like this: `EXPOCHANNEL/@expo/sandbox/id`.
    return idFragments[1] + SEPARATOR + idFragments[2];
  }
}
