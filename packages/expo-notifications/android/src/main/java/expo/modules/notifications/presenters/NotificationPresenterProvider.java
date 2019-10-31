package expo.modules.notifications.presenters;

public class NotificationPresenterProvider {

  private static volatile NotificationPresenter instance;

  public synchronized static NotificationPresenter getNotificationPresenter() {
    if (instance == null) {
      instance = new SmartNotificationPresenter();
    }
    return instance;
  }

}
