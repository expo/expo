package expo.modules.notifications.scheduling.insecurescheduler.repository;

import com.raizlabs.android.dbflow.sql.language.Select;

import java.util.List;

public class ScheduledNotificationRepository implements Repository {

  private volatile static Repository mRepository = new ScheduledNotificationRepository();

  public static Repository getInstance() {
    return mRepository;
  }

  @Override
  public void addScheduledNotification(String appId, int notificationId) {
    deleteScheduledNotification(appId, notificationId);

    ScheduledNotification scheduledNotification = new ScheduledNotification();
    scheduledNotification.setappId(appId);
    scheduledNotification.setNotificationId(notificationId);

    scheduledNotification.save();
  }

  @Override
  public void deleteScheduledNotification(String appId, int notificationId) {

    List<ScheduledNotification> scheduledNotificationList = new Select().from(ScheduledNotification.class)
        .where(ScheduledNotification_Table.notificationId.eq(notificationId))
        .queryList();

    for (ScheduledNotification scheduledNotification : scheduledNotificationList) {
      scheduledNotification.delete();
    }
  }

  @Override
  public List<ScheduledNotification> getScheduledNotificationsForExperience(String appId) {
    List<ScheduledNotification> scheduledNotificationList = new Select().from(ScheduledNotification.class)
        .where(ScheduledNotification_Table.appId.eq(appId))
        .queryList();

    return scheduledNotificationList;
  }
}
