package expo.modules.notifications.notifications.channels.managers;

import android.app.NotificationChannel;
import android.app.NotificationChannelGroup;
import android.content.Context;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import expo.modules.core.arguments.MapArguments;
import expo.modules.core.arguments.ReadableArguments;

import java.util.List;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import androidx.core.app.NotificationManagerCompat;
import expo.modules.notifications.notifications.SoundResolver;
import expo.modules.notifications.notifications.channels.InvalidVibrationPatternException;
import expo.modules.notifications.notifications.enums.AudioContentType;
import expo.modules.notifications.notifications.enums.AudioUsage;
import expo.modules.notifications.notifications.enums.NotificationVisibility;

import static expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer.AUDIO_ATTRIBUTES_CONTENT_TYPE_KEY;
import static expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer.AUDIO_ATTRIBUTES_FLAGS_ENFORCE_AUDIBILITY_KEY;
import static expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer.AUDIO_ATTRIBUTES_FLAGS_HW_AV_SYNC_KEY;
import static expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer.AUDIO_ATTRIBUTES_FLAGS_KEY;
import static expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer.AUDIO_ATTRIBUTES_USAGE_KEY;
import static expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer.BYPASS_DND_KEY;
import static expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer.DESCRIPTION_KEY;
import static expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer.ENABLE_LIGHTS_KEY;
import static expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer.ENABLE_VIBRATE_KEY;
import static expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer.GROUP_ID_KEY;
import static expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer.LIGHT_COLOR_KEY;
import static expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer.LOCKSCREEN_VISIBILITY_KEY;
import static expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer.SHOW_BADGE_KEY;
import static expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer.SOUND_AUDIO_ATTRIBUTES_KEY;
import static expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer.SOUND_KEY;
import static expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer.VIBRATION_PATTERN_KEY;


public class AndroidXNotificationsChannelManager implements NotificationsChannelManager {
  private final NotificationManagerCompat mNotificationManager;
  private NotificationsChannelGroupManager mNotificationsChannelGroupManager;
  private final SoundResolver mSoundResolver;

  public AndroidXNotificationsChannelManager(Context context, NotificationsChannelGroupManager groupManager) {
    mNotificationManager = NotificationManagerCompat.from(context);
    mSoundResolver = new SoundResolver(context);
    mNotificationsChannelGroupManager = groupManager;
  }


  @Nullable
  @Override
  @RequiresApi(api = Build.VERSION_CODES.O)
  public NotificationChannel getNotificationChannel(@NonNull String channelId) {
    return mNotificationManager.getNotificationChannel(channelId);
  }

  @NonNull
  @Override
  @RequiresApi(api = Build.VERSION_CODES.O)
  public List<NotificationChannel> getNotificationChannels() {
    return mNotificationManager.getNotificationChannels();
  }

  @Override
  @RequiresApi(api = Build.VERSION_CODES.O)
  public void deleteNotificationChannel(@NonNull String channelId) {
    mNotificationManager.deleteNotificationChannel(channelId);
  }

  @Override
  @RequiresApi(api = Build.VERSION_CODES.O)
  public NotificationChannel createNotificationChannel(@NonNull String channelId, CharSequence name, int importance, ReadableArguments channelOptions) {
    NotificationChannel channel = new NotificationChannel(channelId, name, importance);
    configureChannelWithOptions(channel, channelOptions);
    mNotificationManager.createNotificationChannel(channel);
    return channel;
  }

  // Processing options
  @RequiresApi(api = Build.VERSION_CODES.O)
  protected void configureChannelWithOptions(Object maybeChannel, ReadableArguments args) {
    // We cannot use NotificationChannel in the signature of the method
    // since it's a class available only on newer OSes and the adapter iterates
    // through all the methods and triggers the NoClassDefFoundError.
    if (!(maybeChannel instanceof NotificationChannel)) {
      return;
    }
    NotificationChannel channel = (NotificationChannel) maybeChannel;
    if (args.containsKey(BYPASS_DND_KEY)) {
      channel.setBypassDnd(args.getBoolean(BYPASS_DND_KEY));
    }
    if (args.containsKey(DESCRIPTION_KEY)) {
      channel.setDescription(args.getString(DESCRIPTION_KEY));
    }
    if (args.containsKey(LIGHT_COLOR_KEY)) {
      channel.setLightColor(Color.parseColor(args.getString(LIGHT_COLOR_KEY)));
    }
    if (args.containsKey(GROUP_ID_KEY)) {
      String groupId = args.getString(GROUP_ID_KEY);
      NotificationChannelGroup group = mNotificationsChannelGroupManager.getNotificationChannelGroup(groupId);
      if (group == null) {
        group = mNotificationsChannelGroupManager.createNotificationChannelGroup(groupId, groupId, new MapArguments());
      }
      channel.setGroup(group.getId());
    }
    if (args.containsKey(LOCKSCREEN_VISIBILITY_KEY)) {
      NotificationVisibility visibility = NotificationVisibility.fromEnumValue(args.getInt(LOCKSCREEN_VISIBILITY_KEY));
      if (visibility != null) {
        channel.setLockscreenVisibility(visibility.getNativeValue());
      }
    }
    if (args.containsKey(SHOW_BADGE_KEY)) {
      channel.setShowBadge(args.getBoolean(SHOW_BADGE_KEY));
    }
    if (args.containsKey(SOUND_KEY) || args.containsKey(SOUND_AUDIO_ATTRIBUTES_KEY)) {
      Uri soundUri = createSoundUriFromArguments(args);
      AudioAttributes soundAttributes = createAttributesFromArguments(args.getArguments(SOUND_AUDIO_ATTRIBUTES_KEY));
      channel.setSound(soundUri, soundAttributes);
    }
    if (args.containsKey(VIBRATION_PATTERN_KEY)) {
      channel.setVibrationPattern(createVibrationPatternFromList(args.getList(VIBRATION_PATTERN_KEY)));
    }
    if (args.containsKey(ENABLE_LIGHTS_KEY)) {
      channel.enableLights(args.getBoolean(ENABLE_LIGHTS_KEY));
    }
    if (args.containsKey(ENABLE_VIBRATE_KEY)) {
      channel.enableVibration(args.getBoolean(ENABLE_VIBRATE_KEY));
    }
  }

  @Nullable
  protected Uri createSoundUriFromArguments(ReadableArguments args) {
    // The default is... the default sound.
    if (!args.containsKey(SOUND_KEY)) {
      return Settings.System.DEFAULT_NOTIFICATION_URI;
    }
    // "null" means "no sound"
    String filename = args.getString(SOUND_KEY);
    if (filename == null) {
      return null;
    }
    // Otherwise it should be a sound filename
    return mSoundResolver.resolve(filename);
  }

  @Nullable
  protected long[] createVibrationPatternFromList(@Nullable List patternRequest) throws InvalidVibrationPatternException {
    if (patternRequest == null) {
      return null;
    }

    long[] pattern = new long[patternRequest.size()];
    for (int i = 0; i < patternRequest.size(); i++) {
      if (patternRequest.get(i) instanceof Number) {
        pattern[i] = ((Number) patternRequest.get(i)).longValue();
      } else {
        throw new InvalidVibrationPatternException(i, patternRequest.get(i));
      }
    }
    return pattern;
  }

  @Nullable
  protected AudioAttributes createAttributesFromArguments(@Nullable ReadableArguments args) {
    if (args == null) {
      return null;
    }

    AudioAttributes.Builder attributesBuilder = new AudioAttributes.Builder();
    if (args.containsKey(AUDIO_ATTRIBUTES_USAGE_KEY)) {
      attributesBuilder.setUsage(AudioUsage.fromEnumValue(args.getInt(AUDIO_ATTRIBUTES_USAGE_KEY)).getNativeValue());
    }
    if (args.containsKey(AUDIO_ATTRIBUTES_CONTENT_TYPE_KEY)) {
      attributesBuilder.setContentType(AudioContentType.fromEnumValue(args.getInt(AUDIO_ATTRIBUTES_CONTENT_TYPE_KEY)).getNativeValue());
    }
    if (args.containsKey(AUDIO_ATTRIBUTES_FLAGS_KEY)) {
      int flags = 0;
      ReadableArguments flagsArgs = args.getArguments(AUDIO_ATTRIBUTES_FLAGS_KEY);
      if (flagsArgs.getBoolean(AUDIO_ATTRIBUTES_FLAGS_ENFORCE_AUDIBILITY_KEY)) {
        flags |= AudioAttributes.FLAG_AUDIBILITY_ENFORCED;
      }
      if (flagsArgs.getBoolean(AUDIO_ATTRIBUTES_FLAGS_HW_AV_SYNC_KEY)) {
        flags |= AudioAttributes.FLAG_HW_AV_SYNC;
      }
      attributesBuilder.setFlags(flags);
    }
    return attributesBuilder.build();
  }
}
