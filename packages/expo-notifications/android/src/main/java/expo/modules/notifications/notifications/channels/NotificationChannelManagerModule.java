package expo.modules.notifications.notifications.channels;

import android.app.NotificationChannel;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;

import expo.modules.core.ExportedModule;
import expo.modules.core.ModuleRegistry;
import expo.modules.core.Promise;
import expo.modules.core.arguments.ReadableArguments;
import expo.modules.core.interfaces.ExpoMethod;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

import androidx.annotation.RequiresApi;
import expo.modules.notifications.notifications.channels.managers.NotificationsChannelManager;
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer;
import expo.modules.notifications.notifications.enums.NotificationImportance;

import static expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer.IMPORTANCE_KEY;
import static expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer.NAME_KEY;

/**
 * An exported module responsible for exposing methods for managing notification channels.
 */
public class NotificationChannelManagerModule extends ExportedModule {
  private final static String EXPORTED_NAME = "ExpoNotificationChannelManager";

  private NotificationsChannelManager mChannelManager;
  private NotificationsChannelSerializer mChannelSerializer;

  public NotificationChannelManagerModule(Context context) {
    super(context);
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    NotificationsChannelsProvider provider = moduleRegistry.getModule(NotificationsChannelsProvider.class);
    mChannelManager = provider.getChannelManager();
    mChannelSerializer = provider.getChannelSerializer();
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

    promise.resolve(mChannelSerializer.toBundle(mChannelManager.getNotificationChannel(channelId)));
  }

  @ExpoMethod
  public void getNotificationChannelsAsync(Promise promise) {
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.O) {
      promise.resolve(Collections.EMPTY_LIST);
      return;
    }

    List<NotificationChannel> existingChannels = mChannelManager.getNotificationChannels();
    List<Bundle> serializedChannels = new ArrayList<>(existingChannels.size());
    for (NotificationChannel channel : existingChannels) {
      serializedChannels.add(mChannelSerializer.toBundle(channel));
    }
    promise.resolve(serializedChannels);
  }

  @ExpoMethod
  public void setNotificationChannelAsync(String channelId, ReadableArguments channelOptions, Promise promise) {
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.O) {
      promise.resolve(null);
      return;
    }

    NotificationChannel channel = mChannelManager.createNotificationChannel(channelId, getNameFromOptions(channelOptions), getImportanceFromOptions(channelOptions), channelOptions);
    promise.resolve(mChannelSerializer.toBundle(channel));
  }

  @ExpoMethod
  public void deleteNotificationChannelAsync(String channelId, Promise promise) {
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.O) {
      promise.resolve(null);
      return;
    }

    mChannelManager.deleteNotificationChannel(channelId);
    promise.resolve(null);
  }

  protected CharSequence getNameFromOptions(ReadableArguments channelOptions) {
    return channelOptions.getString(NAME_KEY);
  }

  @RequiresApi(api = Build.VERSION_CODES.N)
  protected int getImportanceFromOptions(ReadableArguments channelOptions) {
    int enumValue = channelOptions.getInt(IMPORTANCE_KEY, NotificationImportance.DEFAULT.getEnumValue());
    NotificationImportance importance = Objects.requireNonNull(NotificationImportance.fromEnumValue(enumValue));
    return importance.getNativeValue();
  }
}
