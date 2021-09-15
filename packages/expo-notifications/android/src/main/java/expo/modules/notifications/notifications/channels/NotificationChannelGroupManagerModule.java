package expo.modules.notifications.notifications.channels;

import android.app.NotificationChannelGroup;
import android.content.Context;
import android.os.Bundle;

import expo.modules.core.ExportedModule;
import expo.modules.core.ModuleRegistry;
import expo.modules.core.Promise;
import expo.modules.core.arguments.ReadableArguments;
import expo.modules.core.interfaces.ExpoMethod;

import java.util.ArrayList;
import java.util.List;

import expo.modules.notifications.notifications.channels.managers.NotificationsChannelGroupManager;
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelGroupSerializer;

import static expo.modules.notifications.notifications.channels.serializers.NotificationsChannelGroupSerializer.NAME_KEY;

/**
 * An exported module responsible for exposing methods for managing notification channel groups.
 */
public class NotificationChannelGroupManagerModule extends ExportedModule {
  private final static String EXPORTED_NAME = "ExpoNotificationChannelGroupManager";

  private NotificationsChannelGroupManager mGroupManager;
  private NotificationsChannelGroupSerializer mGroupSerializer;

  public NotificationChannelGroupManagerModule(Context context) {
    super(context);
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    NotificationsChannelsProvider provider = moduleRegistry.getModule(NotificationsChannelsProvider.class);
    mGroupManager = provider.getGroupManager();
    mGroupSerializer = provider.getGroupSerializer();
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

    NotificationChannelGroup group = mGroupManager.getNotificationChannelGroup(groupId);
    promise.resolve(mGroupSerializer.toBundle(group));
  }

  @ExpoMethod
  public void getNotificationChannelGroupsAsync(Promise promise) {
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.O) {
      promise.resolve(null);
      return;
    }

    List<NotificationChannelGroup> existingChannels = mGroupManager.getNotificationChannelGroups();
    List<Bundle> serializedChannels = new ArrayList<>(existingChannels.size());
    for (NotificationChannelGroup channelGroup : existingChannels) {
      serializedChannels.add(mGroupSerializer.toBundle(channelGroup));
    }
    promise.resolve(serializedChannels);
  }

  @ExpoMethod
  public void setNotificationChannelGroupAsync(String groupId, ReadableArguments groupOptions, Promise promise) {
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.O) {
      promise.resolve(null);
      return;
    }

    NotificationChannelGroup group = mGroupManager.createNotificationChannelGroup(groupId, getNameFromOptions(groupOptions), groupOptions);
    promise.resolve(mGroupSerializer.toBundle(group));
  }

  @ExpoMethod
  public void deleteNotificationChannelGroupAsync(String groupId, Promise promise) {
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.O) {
      promise.resolve(null);
      return;
    }

    mGroupManager.deleteNotificationChannelGroup(groupId);
    promise.resolve(null);
  }


  protected CharSequence getNameFromOptions(ReadableArguments groupOptions) {
    return groupOptions.getString(NAME_KEY);
  }
}
