package expo.modules.notifications.notifications.channels.serializers

import android.app.NotificationChannel
import android.os.Build
import android.os.Bundle
import androidx.annotation.RequiresApi

interface NotificationsChannelSerializer {
  @RequiresApi(api = Build.VERSION_CODES.O)
  fun toBundle(channel: NotificationChannel): Bundle

  companion object {
    const val ID_KEY = "id"
    const val NAME_KEY = "name"
    const val IMPORTANCE_KEY = "importance"
    const val BYPASS_DND_KEY = "bypassDnd"
    const val DESCRIPTION_KEY = "description"
    const val GROUP_ID_KEY = "groupId"
    const val LIGHT_COLOR_KEY = "lightColor"
    const val LOCKSCREEN_VISIBILITY_KEY = "lockscreenVisibility"
    const val SHOW_BADGE_KEY = "showBadge"
    const val SOUND_KEY = "sound"
    const val SOUND_AUDIO_ATTRIBUTES_KEY = "audioAttributes"
    const val VIBRATION_PATTERN_KEY = "vibrationPattern"
    const val ENABLE_LIGHTS_KEY = "enableLights"
    const val ENABLE_VIBRATE_KEY = "enableVibrate"

    const val AUDIO_ATTRIBUTES_USAGE_KEY = "usage"
    const val AUDIO_ATTRIBUTES_CONTENT_TYPE_KEY = "contentType"
    const val AUDIO_ATTRIBUTES_FLAGS_KEY = "flags"
    const val AUDIO_ATTRIBUTES_FLAGS_ENFORCE_AUDIBILITY_KEY = "enforceAudibility"
    const val AUDIO_ATTRIBUTES_FLAGS_HW_AV_SYNC_KEY = "requestHardwareAudioVideoSynchronization"
  }
}
