package expo.modules.notifications.displayers;

public class NotificationDisplayerProvider {

  private static volatile NotificationDisplayer instance;

  public synchronized static NotificationDisplayer getNotificationDisplayer() {
    if (instance == null) {
      instance = new LifecycleAwareNotificationDisplayer(new BasicNotificationDisplayer());
    }
    return instance;
  }

}
