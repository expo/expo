package host.exp.exponent.notifications;

import expo.modules.notifications.notifications.interfaces.NotificationsBuilderCreator;
import expo.modules.notifications.notifications.interfaces.NotificationsReconstructor;
import host.exp.exponent.notifications.model.ScopedNotificationsReconstructor;

public class NotificationsScoper implements expo.modules.notifications.notifications.interfaces.NotificationsScoper {

  @Override
  public NotificationsReconstructor createReconstructor() {
    return new ScopedNotificationsReconstructor();
  }

  @Override
  public NotificationsBuilderCreator createBuilderCreator() {
    return ScopedCategoryAwareNotificationBuilder::new;
  }
}
