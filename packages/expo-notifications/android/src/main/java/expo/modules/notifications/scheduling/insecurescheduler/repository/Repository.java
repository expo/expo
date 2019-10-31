package expo.modules.notifications.scheduling.insecurescheduler.repository;

import java.util.List;

public interface Repository {

  void addScheduledNotification(String appId, int notificationId);

  void deleteScheduledNotification(String appId, int notificationId);

  List<ScheduledNotification> getScheduledNotificationsForExperience(String appId);

}
