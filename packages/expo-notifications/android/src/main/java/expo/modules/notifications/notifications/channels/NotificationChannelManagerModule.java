package expo.modules.notifications.notifications.channels;

import android.app.NotificationChannel;
import android.content.Context;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.Promise;
import org.unimodules.core.arguments.ReadableArguments;
import org.unimodules.core.interfaces.ExpoMethod;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import androidx.core.app.NotificationManagerCompat;
import expo.modules.notifications.notifications.SoundResolver;
import expo.modules.notifications.notifications.enums.AudioContentType;
import expo.modules.notifications.notifications.enums.AudioUsage;
import expo.modules.notifications.notifications.enums.NotificationImportance;
import expo.modules.notifications.notifications.enums.NotificationVisibility;

import static expo.modules.notifications.notifications.channels.NotificationChannelSerializer.AUDIO_ATTRIBUTES_CONTENT_TYPE_KEY;
import static expo.modules.notifications.notifications.channels.NotificationChannelSerializer.AUDIO_ATTRIBUTES_FLAGS_ENFORCE_AUDIBILITY_KEY;
import static expo.modules.notifications.notifications.channels.NotificationChannelSerializer.AUDIO_ATTRIBUTES_FLAGS_HW_AV_SYNC_KEY;
import static expo.modules.notifications.notifications.channels.NotificationChannelSerializer.AUDIO_ATTRIBUTES_FLAGS_KEY;
import static expo.modules.notifications.notifications.channels.NotificationChannelSerializer.AUDIO_ATTRIBUTES_USAGE_KEY;
import static expo.modules.notifications.notifications.channels.NotificationChannelSerializer.BYPASS_DND_KEY;
import static expo.modules.notifications.notifications.channels.NotificationChannelSerializer.DESCRIPTION_KEY;
import static expo.modules.notifications.notifications.channels.NotificationChannelSerializer.ENABLE_LIGHTS_KEY;
import static expo.modules.notifications.notifications.channels.NotificationChannelSerializer.ENABLE_VIBRATE_KEY;
import static expo.modules.notifications.notifications.channels.NotificationChannelSerializer.GROUP_ID_KEY;
import static expo.modules.notifications.notifications.channels.NotificationChannelSerializer.IMPORTANCE_KEY;
import static expo.modules.notifications.notifications.channels.NotificationChannelSerializer.LIGHT_COLOR_KEY;
import static expo.modules.notifications.notifications.channels.NotificationChannelSerializer.LOCKSCREEN_VISIBILITY_KEY;
import static expo.modules.notifications.notifications.channels.NotificationChannelSerializer.NAME_KEY;
import static expo.modules.notifications.notifications.channels.NotificationChannelSerializer.SHOW_BADGE_KEY;
import static expo.modules.notifications.notifications.channels.NotificationChannelSerializer.SOUND_AUDIO_ATTRIBUTES_KEY;
import static expo.modules.notifications.notifications.channels.NotificationChannelSerializer.SOUND_KEY;
import static expo.modules.notifications.notifications.channels.NotificationChannelSerializer.VIBRATION_PATTERN_KEY;
import static expo.modules.notifications.notifications.channels.NotificationChannelSerializer.toBundle;

/**
 * An exported module responsible for exposing methods for managing notification channels.
 */
public class NotificationChannelManagerModule extends ExportedModule {
  private final static String EXPORTED_NAME = "ExpoNotificationChannelManager";

  private final NotificationManagerCompat mNotificationManager;
  private SoundResolver mSoundResolver;

  public NotificationChannelManagerModule(Context context) {
    super(context);
    mSoundResolver = new SoundResolver(context);
    mNotificationManager = NotificationManagerCompat.from(context);
  }

  @Override
  public String getName() {
    return EXPORTED_NAME;
  }

  @ExpoMethod
  public void getNotificationChannelAsync(String channelId, Promise promise) {
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.O) {
      promise.resolve(null);
      return;
    }

    promise.resolve(toBundle(mNotificationManager.getNotificationChannel(channelId)));
  }

  @ExpoMethod
  public void getNotificationChannelsAsync(Promise promise) {
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.O) {
      promise.resolve(Collections.EMPTY_LIST);
      return;
    }

    List<NotificationChannel> existingChannels = mNotificationManager.getNotificationChannels();
    List<Bundle> serializedChannels = new ArrayList<>(existingChannels.size());
    for (NotificationChannel channel : existingChannels) {
      serializedChannels.add(toBundle(channel));
    }
    promise.resolve(serializedChannels);
  }

  @ExpoMethod
  public void setNotificationChannelAsync(String channelId, ReadableArguments channelOptions, Promise promise) {
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.O) {
      promise.resolve(null);
      return;
    }

    NotificationChannel channel = new NotificationChannel(channelId, getNameFromOptions(channelOptions), getImportanceFromOptions(channelOptions));
    configureChannelWithOptions(channel, channelOptions);
    mNotificationManager.createNotificationChannel(channel);
    promise.resolve(toBundle(channel));
  }

  @ExpoMethod
  public void deleteNotificationChannelAsync(String channelId, Promise promise) {
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.O) {
      promise.resolve(null);
      return;
    }

    mNotificationManager.deleteNotificationChannel(channelId);
    promise.resolve(null);
  }

  // Processing options

  protected CharSequence getNameFromOptions(ReadableArguments channelOptions) {
    return channelOptions.getString(NAME_KEY);
  }

  @RequiresApi(api = Build.VERSION_CODES.N)
  protected int getImportanceFromOptions(ReadableArguments channelOptions) {
    int enumValue = channelOptions.getInt(IMPORTANCE_KEY, NotificationImportance.DEFAULT.getEnumValue());
    NotificationImportance importance = Objects.requireNonNull(NotificationImportance.fromEnumValue(enumValue));
    return importance.getNativeValue();
  }

  @RequiresApi(api = Build.VERSION_CODES.O)
  protected void configureChannelWithOptions(Object maybeChannel, ReadableArguments args) {
    // We cannot use NotificationChannel in the signature of the method
    // since it's a class available only on newer OSes and the adapter iterates
    // through all the methods and triggers the NoClassDefFoundError.
    if (!(maybeChannel instanceof NotificationChannel)) {
      return;
    }
    NotificationChannel channel = (NotificationChannel) maybeChannel;
    if (args.containsKey(NAME_KEY)) {
      channel.setName(getNameFromOptions(args));
    }
    if (args.containsKey(IMPORTANCE_KEY)) {
      channel.setImportance(getImportanceFromOptions(args));
    }
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
      channel.setGroup(args.getString(GROUP_ID_KEY));
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
}
