package expo.modules.notifications.notifications.channels.serializers;

import android.app.NotificationChannel;
import android.os.Build;
import android.os.Bundle;

import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;

public interface NotificationsChannelSerializer {
  String ID_KEY = "id";
  String NAME_KEY = "name";
  String IMPORTANCE_KEY = "importance";
  String BYPASS_DND_KEY = "bypassDnd";
  String DESCRIPTION_KEY = "description";
  String GROUP_ID_KEY = "groupId";
  String LIGHT_COLOR_KEY = "lightColor";
  String LOCKSCREEN_VISIBILITY_KEY = "lockscreenVisibility";
  String SHOW_BADGE_KEY = "showBadge";
  String SOUND_KEY = "sound";
  String SOUND_AUDIO_ATTRIBUTES_KEY = "audioAttributes";
  String VIBRATION_PATTERN_KEY = "vibrationPattern";
  String ENABLE_LIGHTS_KEY = "enableLights";
  String ENABLE_VIBRATE_KEY = "enableVibrate";

  String AUDIO_ATTRIBUTES_USAGE_KEY = "usage";
  String AUDIO_ATTRIBUTES_CONTENT_TYPE_KEY = "contentType";
  String AUDIO_ATTRIBUTES_FLAGS_KEY = "flags";
  String AUDIO_ATTRIBUTES_FLAGS_ENFORCE_AUDIBILITY_KEY = "enforceAudibility";
  String AUDIO_ATTRIBUTES_FLAGS_HW_AV_SYNC_KEY = "requestHardwareAudioVideoSynchronization";

  @Nullable
  @RequiresApi(api = Build.VERSION_CODES.O)
  Bundle toBundle(@Nullable NotificationChannel channel);
}
