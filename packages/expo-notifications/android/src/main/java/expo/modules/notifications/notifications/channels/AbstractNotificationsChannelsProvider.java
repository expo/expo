package expo.modules.notifications.notifications.channels;

import android.content.Context;

import expo.modules.core.ModuleRegistry;
import expo.modules.core.interfaces.InternalModule;

import java.util.Collections;
import java.util.List;

import expo.modules.notifications.notifications.channels.managers.NotificationsChannelGroupManager;
import expo.modules.notifications.notifications.channels.managers.NotificationsChannelManager;
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelGroupSerializer;
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer;

public abstract class AbstractNotificationsChannelsProvider implements NotificationsChannelsProvider, InternalModule {
  protected final Context mContext;
  private NotificationsChannelManager mChannelManager;
  private NotificationsChannelGroupManager mChannelGroupManager;
  private NotificationsChannelSerializer mChannelSerializer;
  private NotificationsChannelGroupSerializer mChannelGroupSerializer;

  private ModuleRegistry mModuleRegistry;

  public AbstractNotificationsChannelsProvider(Context context) {
    mContext = context;
  }

  public List<? extends Class> getExportedInterfaces() {
    return Collections.singletonList(NotificationsChannelsProvider.class);
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  public final ModuleRegistry getModuleRegistry() {
    return mModuleRegistry;
  }

  @Override
  public final NotificationsChannelManager getChannelManager() {
    if (mChannelManager == null) {
      mChannelManager = createChannelManager();
    }
    return mChannelManager;
  }

  @Override
  public final NotificationsChannelGroupManager getGroupManager() {
    if (mChannelGroupManager == null) {
      mChannelGroupManager = createChannelGroupManager();
    }
    return mChannelGroupManager;
  }

  @Override
  public final NotificationsChannelSerializer getChannelSerializer() {
    if (mChannelSerializer == null) {
      mChannelSerializer = createChannelSerializer();
    }
    return mChannelSerializer;
  }

  @Override
  public final NotificationsChannelGroupSerializer getGroupSerializer() {
    if (mChannelGroupSerializer == null) {
      mChannelGroupSerializer = createChannelGroupSerializer();
    }
    return mChannelGroupSerializer;
  }

  protected abstract NotificationsChannelManager createChannelManager();

  protected abstract NotificationsChannelGroupManager createChannelGroupManager();

  protected abstract NotificationsChannelSerializer createChannelSerializer();

  protected abstract NotificationsChannelGroupSerializer createChannelGroupSerializer();
}
