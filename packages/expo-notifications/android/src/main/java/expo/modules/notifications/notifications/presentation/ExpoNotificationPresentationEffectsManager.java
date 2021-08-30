package expo.modules.notifications.notifications.presentation;

import android.app.Notification;
import android.util.Log;

import expo.modules.core.interfaces.InternalModule;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

import androidx.annotation.Nullable;
import expo.modules.notifications.notifications.interfaces.NotificationPresentationEffect;
import expo.modules.notifications.notifications.interfaces.NotificationPresentationEffectsManager;

public class ExpoNotificationPresentationEffectsManager implements InternalModule, NotificationPresentationEffectsManager {
  private Collection<NotificationPresentationEffect> mEffects = new ArrayList<>();

  @Override
  public List<? extends Class> getExportedInterfaces() {
    return Collections.singletonList(NotificationPresentationEffectsManager.class);
  }

  @Override
  public void addEffect(NotificationPresentationEffect effect) {
    removeEffect(effect);
    mEffects.add(effect);
  }

  @Override
  public void removeEffect(NotificationPresentationEffect effect) {
    mEffects.remove(effect);
  }

  @Override
  public boolean onNotificationPresented(@Nullable String tag, int id, Notification notification) {
    boolean anyActed = false;
    for (NotificationPresentationEffect effect : mEffects) {
      try {
        anyActed = effect.onNotificationPresented(tag, id, notification) || anyActed;
      } catch (Exception e) {
        Log.w("expo-notifications", String.format("Notification presentation effector %s threw an exception for notification (%s, %d): %s", effect.getClass(), tag, id, e.getMessage()));
        e.printStackTrace();
      }
    }
    return anyActed;
  }

  @Override
  public boolean onNotificationPresentationFailed(@Nullable String tag, int id, Notification notification) {
    boolean anyActed = false;
    for (NotificationPresentationEffect effect : mEffects) {
      try {
        anyActed = effect.onNotificationPresentationFailed(tag, id, notification) || anyActed;
      } catch (Exception e) {
        Log.w("expo-notifications", String.format("Notification presentation effector %s threw an exception for notification (%s, %d): %s", effect.getClass(), tag, id, e.getMessage()));
        e.printStackTrace();
      }
    }
    return anyActed;
  }
}
