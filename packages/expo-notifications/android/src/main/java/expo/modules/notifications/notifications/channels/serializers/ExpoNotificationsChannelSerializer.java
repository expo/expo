package expo.modules.notifications.notifications.channels.serializers;

import android.app.NotificationChannel;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import expo.modules.notifications.notifications.enums.AudioContentType;
import expo.modules.notifications.notifications.enums.AudioUsage;
import expo.modules.notifications.notifications.enums.NotificationImportance;
import expo.modules.notifications.notifications.enums.NotificationVisibility;

public class ExpoNotificationsChannelSerializer implements NotificationsChannelSerializer {

  @Override
  @Nullable
  @RequiresApi(api = Build.VERSION_CODES.O)
  public Bundle toBundle(@Nullable NotificationChannel channel) {
    if (channel == null) {
      return null;
    }

    Bundle result = new Bundle();
    result.putString(ID_KEY, getChannelId(channel));
    result.putString(NAME_KEY, channel.getName().toString());
    result.putInt(IMPORTANCE_KEY, NotificationImportance.fromNativeValue(channel.getImportance()).getEnumValue());
    result.putBoolean(BYPASS_DND_KEY, channel.canBypassDnd());
    result.putString(DESCRIPTION_KEY, channel.getDescription());
    result.putString(GROUP_ID_KEY, getGroupId(channel));
    result.putString(LIGHT_COLOR_KEY, String.format("#%08x", Color.valueOf(channel.getLightColor()).toArgb()).toUpperCase());
    result.putInt(LOCKSCREEN_VISIBILITY_KEY, NotificationVisibility.fromNativeValue(channel.getLockscreenVisibility()).getEnumValue());
    result.putBoolean(SHOW_BADGE_KEY, channel.canShowBadge());
    result.putString(SOUND_KEY, toString(channel.getSound()));
    result.putBundle(SOUND_AUDIO_ATTRIBUTES_KEY, toBundle(channel.getAudioAttributes()));
    result.putLongArray(VIBRATION_PATTERN_KEY, channel.getVibrationPattern());
    result.putBoolean(ENABLE_LIGHTS_KEY, channel.shouldShowLights());
    result.putBoolean(ENABLE_VIBRATE_KEY, channel.shouldVibrate());
    return result;
  }

  @Nullable
  @RequiresApi(api = Build.VERSION_CODES.O)
  protected String getChannelId(@NonNull NotificationChannel channel) {
    return channel.getId();
  }

  @Nullable
  @RequiresApi(api = Build.VERSION_CODES.O)
  protected String getGroupId(@NonNull NotificationChannel channel) {
    return channel.getGroup();
  }

  @Nullable
  private String toString(@Nullable Uri uri) {
    if (uri == null) {
      return null;
    }

    if (Settings.System.DEFAULT_NOTIFICATION_URI.equals(uri)) {
      return "default";
    }

    return "custom";
  }

  private Bundle toBundle(@Nullable AudioAttributes attributes) {
    if (attributes == null) {
      return null;
    }

    Bundle result = new Bundle();
    result.putInt(AUDIO_ATTRIBUTES_USAGE_KEY, AudioUsage.fromNativeValue(attributes.getUsage()).getEnumValue());
    result.putInt(AUDIO_ATTRIBUTES_CONTENT_TYPE_KEY, AudioContentType.fromNativeValue(attributes.getContentType()).getEnumValue());

    Bundle flags = new Bundle();
    flags.putBoolean(AUDIO_ATTRIBUTES_FLAGS_HW_AV_SYNC_KEY, (attributes.getFlags() & AudioAttributes.FLAG_HW_AV_SYNC) > 0);
    flags.putBoolean(AUDIO_ATTRIBUTES_FLAGS_ENFORCE_AUDIBILITY_KEY, (attributes.getFlags() & AudioAttributes.FLAG_AUDIBILITY_ENFORCED) > 0);
    result.putBundle(AUDIO_ATTRIBUTES_FLAGS_KEY, flags);

    return result;
  }
}
