package host.exp.exponent.notifications.insecurecheduler.repository;

import java.util.List;

public interface Repository {

  void addScheduledNotification(String experienceId, int notificationId);

  void deleteScheduledNotification(String experienceId, int notificationId);

  List<ScheduledNotification> getScheduledNotificationsForExperience(String experienceId);

}
