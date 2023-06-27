package abi49_0_0.expo.modules.notifications.notifications.interfaces;

public interface NotificationPresentationEffectsManager extends NotificationPresentationEffect {
  void addEffect(NotificationPresentationEffect effector);

  void removeEffect(NotificationPresentationEffect effector);
}
