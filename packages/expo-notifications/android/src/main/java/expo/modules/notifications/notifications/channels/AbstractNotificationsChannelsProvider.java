package expo.modules.notifications.notifications.channels;

import android.content.Context;

import expo.modules.core.interfaces.InternalModule;

import java.util.Collections;
import java.util.List;

public abstract class AbstractNotificationsChannelsProvider implements NotificationsChannelsProvider, InternalModule {
  protected final Context mContext;

  public AbstractNotificationsChannelsProvider(Context context) {
    mContext = context;
  }

  public List<? extends Class> getExportedInterfaces() {
    return Collections.singletonList(NotificationsChannelsProvider.class);
  }

}
