package expo.modules.notifications.notifications.channels;

import android.app.NotificationChannel;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;

import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import expo.modules.notifications.notifications.enums.AudioContentType;
import expo.modules.notifications.notifications.enums.AudioUsage;
import expo.modules.notifications.notifications.enums.NotificationImportance;
import expo.modules.notifications.notifications.enums.NotificationVisibility;

public class NotificationChannelSerializer {
  // Keys reused in NotificationChannelManagerModule for fetching configuration from options
  public final static String ID_KEY = "id";
  public final static String NAME_KEY = "name";
  public final static String IMPORTANCE_KEY = "importance";
  public final static String BYPASS_DND_KEY = "bypassDnd";
  public final static String DESCRIPTION_KEY = "description";
  public final static String GROUP_ID_KEY = "groupId";
  public final static String LIGHT_COLOR_KEY = "lightColor";
  public final static String LOCKSCREEN_VISIBILITY_KEY = "lockscreenVisibility";
  public final static String SHOW_BADGE_KEY = "showBadge";
  public final static String SOUND_KEY = "sound";
  public final static String SOUND_AUDIO_ATTRIBUTES_KEY = "audioAttributes";
  public final static String VIBRATION_PATTERN_KEY = "vibrationPattern";
  public final static String ENABLE_LIGHTS_KEY = "enableLights";
  public final static String ENABLE_VIBRATE_KEY = "enableVibrate";

  public final static String AUDIO_ATTRIBUTES_USAGE_KEY = "usage";
  public final static String AUDIO_ATTRIBUTES_CONTENT_TYPE_KEY = "contentType";
  public final static String AUDIO_ATTRIBUTES_FLAGS_KEY = "flags";
  public final static String AUDIO_ATTRIBUTES_FLAGS_ENFORCE_AUDIBILITY_KEY = "enforceAudibility";
  public final static String AUDIO_ATTRIBUTES_FLAGS_HW_AV_SYNC_KEY = "requestHardwareAudioVideoSynchronization";

  @Nullable
  @RequiresApi(api = Build.VERSION_CODES.O)
  public static Bundle toBundle(@Nullable NotificationChannel channel) {
    if (channel == null) {
      return null;
    }

    Bundle result = new Bundle();
    result.putString(ID_KEY, channel.getId());
    result.putString(NAME_KEY, channel.getName().toString());
    result.putInt(IMPORTANCE_KEY, NotificationImportance.fromNativeValue(channel.getImportance()).getEnumValue());
    result.putBoolean(BYPASS_DND_KEY, channel.canBypassDnd());
    result.putString(DESCRIPTION_KEY, channel.getDescription());
    result.putString(GROUP_ID_KEY, channel.getGroup());
    result.putString(LIGHT_COLOR_KEY, String.format("#%08x", Color.valueOf(channel.getLightColor()).toArgb()).toUpperCase());
    result.putInt(LOCKSCREEN_VISIBILITY_KEY, NotificationVisibility.fromNativeValue(channel.getLockscreenVisibility()).getEnumValue());
    result.putBoolean(SHOW_BADGE_KEY, channel.canShowBadge());
    result.putString(SOUND_KEY, toString(channel.getSound()));
    result.putBundle(SOUND_AUDIO_ATTRIBUTES_KEY, toBundle(channel.getAudioAttributes()));
    result.putDoubleArray(VIBRATION_PATTERN_KEY, toArray(channel.getVibrationPattern()));
    result.putBoolean(ENABLE_LIGHTS_KEY, channel.shouldShowLights());
    result.putBoolean(ENABLE_VIBRATE_KEY, channel.shouldVibrate());
    return result;
  }

  @Nullable
  public static String toString(@Nullable Uri uri) {
    if (uri == null) {
      return null;
    }

    if (Settings.System.DEFAULT_NOTIFICATION_URI.equals(uri)) {
      return "default";
    }

    return "custom";
  }

  public static Bundle toBundle(@Nullable AudioAttributes attributes) {
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

  @Nullable
  public static double[] toArray(@Nullable long[] array) {
    if (array == null) {
      return null;
    }

    double[] result = new double[array.length];
    for (int i = 0; i < array.length; i++) {
      result[i] = array[i];
    }
    return result;
  }
}
