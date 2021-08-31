package versioned.host.exp.exponent.modules.api.notifications

import android.app.NotificationChannel
import android.app.NotificationChannelGroup
import android.os.Build
import androidx.annotation.RequiresApi
import expo.modules.notifications.notifications.model.NotificationCategory
import host.exp.exponent.kernel.ExperienceKey

object ScopedNotificationsIdUtils {
  private const val SCOPED_GROUP_TAG = "EXPO_GROUP"
  private const val SCOPED_CHANNEL_TAG = "EXPO_CHANNEL"
  private const val SCOPED_CATEGORY_TAG = "EXPO_CATEGORY"
  private const val SEPARATOR = "/"

  fun getScopedChannelId(experienceKey: ExperienceKey, channelId: String): String {
    return SCOPED_CHANNEL_TAG + SEPARATOR + experienceKey.scopeKey + SEPARATOR + channelId
  }

  fun getScopedGroupId(experienceKey: ExperienceKey, channelId: String): String {
    return SCOPED_GROUP_TAG + SEPARATOR + experienceKey.scopeKey + SEPARATOR + channelId
  }

  fun getScopedCategoryId(experienceKey: ExperienceKey, categoryId: String): String {
    return getScopedCategoryIdRaw(experienceKey.scopeKey, categoryId)
  }

  fun getScopedCategoryIdRaw(experienceScopeKey: String, categoryId: String): String {
    return SCOPED_CATEGORY_TAG + SEPARATOR + experienceScopeKey + SEPARATOR + categoryId
  }

  fun getUnscopedId(scopedId: String?): String? {
    if (scopedId == null ||
      !scopedId.startsWith(SCOPED_CHANNEL_TAG) &&
      !scopedId.startsWith(SCOPED_GROUP_TAG) &&
      !scopedId.startsWith(SCOPED_CATEGORY_TAG)
    ) {
      return scopedId
    }
    val idFragments = scopedId.split(SEPARATOR.toRegex()).toTypedArray()
    val sb = StringBuilder()
    when {
      idFragments.size < 3 -> {
        return scopedId
      }
      idFragments.size == 3 -> {
        // unlogged user or new scope key based ID
        // For unlogged user, the scopedId looks like: EXPO_CHANNEL/UNVERIFIED-192.168.83.49-sandbox/test-channel-id
        // For scope key based ID, the scopedId looks like EXPO_CHANNEL/randomscopekey/test-channel-id
        sb.append(idFragments[2])
      }
      else -> {
        // Scoped id looks like this: `EXPO_CHANNEL/@expo/sandbox/test-channel-id`.
        for (i in 3 until idFragments.size) {
          sb.append(idFragments[i])
        }
      }
    }
    return sb.toString()
  }

  @RequiresApi(api = Build.VERSION_CODES.O)
  fun checkIfGroupBelongsToExperience(
    experienceKey: ExperienceKey,
    channelGroup: NotificationChannelGroup
  ): Boolean {
    return checkIfIdBelongsToExperience(experienceKey, channelGroup.id)
  }

  @RequiresApi(api = Build.VERSION_CODES.O)
  fun checkIfChannelBelongsToExperience(
    experienceKey: ExperienceKey,
    channel: NotificationChannel
  ): Boolean {
    return checkIfIdBelongsToExperience(experienceKey, channel.id)
  }

  fun checkIfCategoryBelongsToExperience(
    experienceKey: ExperienceKey,
    category: NotificationCategory
  ): Boolean {
    return checkIfIdBelongsToExperience(experienceKey, category.identifier)
  }

  private fun checkIfIdBelongsToExperience(
    experienceKey: ExperienceKey,
    scopedId: String
  ): Boolean {
    // Backward compatibility with unscoped channels.
    return if (!scopedId.startsWith(SCOPED_CHANNEL_TAG)) {
      true
    } else experienceKey.scopeKey == getExperienceScopeKeyFromScopedId(
      scopedId
    )
  }

  private fun getExperienceScopeKeyFromScopedId(scopedId: String): String {
    val idFragments = scopedId.split(SEPARATOR.toRegex()).toTypedArray()
    return if (idFragments.size == 3) {
      // unlogged user or new scope key based ID
      // For unlogged user, the scopedId looks like: EXPO_CHANNEL/UNVERIFIED-192.168.83.49-sandbox/test-channel-id
      // For scope key based ID, the scopedId looks like EXPO_CHANNEL/randomscopekey/test-channel-id
      idFragments[1]
    } else idFragments[1] + SEPARATOR + idFragments[2]
    // Scoped id looks like this: `EXPOCHANNEL/@expo/sandbox/id`.
  }
}
