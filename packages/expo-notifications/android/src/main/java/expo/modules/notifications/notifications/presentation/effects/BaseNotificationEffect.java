package expo.modules.notifications.notifications.presentation.effects;

import android.app.Notification;
import android.content.Context;

import expo.modules.core.ModuleRegistry;
import expo.modules.core.interfaces.InternalModule;

import java.util.Collections;
import java.util.List;

import androidx.annotation.Nullable;
import expo.modules.notifications.notifications.interfaces.NotificationPresentationEffect;
import expo.modules.notifications.notifications.interfaces.NotificationPresentationEffectsManager;

public abstract class BaseNotificationEffect implements InternalModule, NotificationPresentationEffect {
  private Context mContext;
  private NotificationPresentationEffectsManager mManager;

  public BaseNotificationEffect(Context context) {
    mContext = context;
  }

  protected Context getContext() {
    return mContext;
  }

  @Override
  public List<? extends Class> getExportedInterfaces() {
    return Collections.singletonList(getClass());
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mManager = moduleRegistry.getModule(NotificationPresentationEffectsManager.class);
    mManager.addEffect(this);
  }

  @Override
  public void onDestroy() {
    mManager.removeEffect(this);
  }

  @Override
  public boolean onNotificationPresented(@Nullable String tag, int id, Notification notification) {
    return false;
  }

  @Override
  public boolean onNotificationPresentationFailed(@Nullable String tag, int id, Notification notification) {
    return false;
  }
}
