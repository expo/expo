package expo.modules.notifications;

import expo.modules.notifications.notifications.interfaces.NotificationsBuilderCreator;
import expo.modules.notifications.notifications.interfaces.NotificationsReconstructor;
import expo.modules.notifications.notifications.model.BareExpoNotificationsReconstructor;
import expo.modules.notifications.notifications.presentation.builders.CategoryAwareNotificationBuilder;

public class NotificationsScoper implements expo.modules.notifications.notifications.interfaces.NotificationsScoper {

  @Override
  public NotificationsReconstructor createReconstructor() {
    return new BareExpoNotificationsReconstructor();
  }

  @Override
  public NotificationsBuilderCreator createBuilderCreator() {
    return CategoryAwareNotificationBuilder::new;
  }
}
