package expo.modules.notifications.notifications.channels;

import android.app.NotificationChannel;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.Promise;
import org.unimodules.core.arguments.ReadableArguments;
import org.unimodules.core.interfaces.ExpoMethod;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

import androidx.annotation.RequiresApi;
import expo.modules.notifications.notifications.channels.manager.NotificationsChannelManager;
import expo.modules.notifications.notifications.enums.NotificationImportance;

import static expo.modules.notifications.notifications.channels.NotificationChannelSerializer.IMPORTANCE_KEY;
import static expo.modules.notifications.notifications.channels.NotificationChannelSerializer.NAME_KEY;
import static expo.modules.notifications.notifications.channels.NotificationChannelSerializer.toBundle;

/**
 * An exported module responsible for exposing methods for managing notification channels.
 */
public class NotificationChannelManagerModule extends ExportedModule {
  private final static String EXPORTED_NAME = "ExpoNotificationChannelManager";

  private final NotificationsChannelManager mChannelManager;

  public NotificationChannelManagerModule(Context context, NotificationsChannelManager channelManager) {
    super(context);
    mChannelManager = channelManager;
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

    promise.resolve(toBundle(mChannelManager.getNotificationChannel(channelId)));
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

    NotificationChannel channel = mChannelManager.createNotificationChannel(channelId, getNameFromOptions(channelOptions), getImportanceFromOptions(channelOptions), channelOptions);
    promise.resolve(toBundle(channel));
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
