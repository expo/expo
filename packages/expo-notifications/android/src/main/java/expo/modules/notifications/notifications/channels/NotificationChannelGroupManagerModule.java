package expo.modules.notifications.notifications.channels;

import android.app.NotificationChannelGroup;
import android.content.Context;
import android.os.Bundle;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.arguments.ReadableArguments;
import org.unimodules.core.interfaces.ExpoMethod;

import java.util.ArrayList;
import java.util.List;

import expo.modules.notifications.notifications.channels.managers.NotificationsChannelGroupManager;

import static expo.modules.notifications.notifications.channels.NotificationChannelGroupSerializer.NAME_KEY;
import static expo.modules.notifications.notifications.channels.NotificationChannelGroupSerializer.toBundle;

/**
 * An exported module responsible for exposing methods for managing notification channel groups.
 */
public class NotificationChannelGroupManagerModule extends ExportedModule {
  private final static String EXPORTED_NAME = "ExpoNotificationChannelGroupManager";

  private NotificationsChannelGroupManager mNotificationManager;

  public NotificationChannelGroupManagerModule(Context context) {
    super(context);
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mNotificationManager = moduleRegistry.getModule(NotificationsChannelGroupManager.class);
  }

  @Override
  public String getName() {
    return EXPORTED_NAME;
  }

  @ExpoMethod
  public void getNotificationChannelGroupAsync(String groupId, Promise promise) {
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.O) {
      promise.resolve(null);
      return;
    }

    NotificationChannelGroup group = mNotificationManager.getNotificationChannelGroup(groupId);
    promise.resolve(toBundle(group));
  }

  @ExpoMethod
  public void getNotificationChannelGroupsAsync(Promise promise) {
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.O) {
      promise.resolve(null);
      return;
    }

    List<NotificationChannelGroup> existingChannels = mNotificationManager.getNotificationChannelGroups();
    List<Bundle> serializedChannels = new ArrayList<>(existingChannels.size());
    for (NotificationChannelGroup channelGroup : existingChannels) {
      serializedChannels.add(toBundle(channelGroup));
    }
    promise.resolve(serializedChannels);
  }

  @ExpoMethod
  public void setNotificationChannelGroupAsync(String groupId, ReadableArguments groupOptions, Promise promise) {
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.O) {
      promise.resolve(null);
      return;
    }

    NotificationChannelGroup group = mNotificationManager.createNotificationChannelGroup(groupId, getNameFromOptions(groupOptions), groupOptions);
    promise.resolve(toBundle(group));
  }

  @ExpoMethod
  public void deleteNotificationChannelGroupAsync(String groupId, Promise promise) {
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.O) {
      promise.resolve(null);
      return;
    }

    mNotificationManager.deleteNotificationChannelGroup(groupId);
    promise.resolve(null);
  }


  protected CharSequence getNameFromOptions(ReadableArguments groupOptions) {
    return groupOptions.getString(NAME_KEY);
  }
}
