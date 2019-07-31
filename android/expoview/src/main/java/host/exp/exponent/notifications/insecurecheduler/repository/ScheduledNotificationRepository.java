package host.exp.exponent.notifications.insecurecheduler.repository;

import com.raizlabs.android.dbflow.sql.builder.Condition;
import com.raizlabs.android.dbflow.sql.language.Select;

import java.util.List;

public class ScheduledNotificationRepository implements Repository {

  private volatile static Repository mRepository = new ScheduledNotificationRepository();

  public static Repository getInstance() {
    return mRepository;
  }

  @Override
  public void addScheduledNotification(String experienceId, int notificationId) {
    deleteScheduledNotification(experienceId, notificationId);

    ScheduledNotification scheduledNotification = new ScheduledNotification();
    scheduledNotification.setExperienceId(experienceId);
    scheduledNotification.setNotificationId(notificationId);

    scheduledNotification.save();
  }

  @Override
  public void deleteScheduledNotification(String experienceId, int notificationId) {
    List<ScheduledNotification> scheduledNotificationList = new Select().from(ScheduledNotification.class)
        .where(Condition.column(ScheduledNotification$Table.EXPERIENCEID).is(experienceId))
        .where(Condition.column(ScheduledNotification$Table.NOTIFICATIONID).is(notificationId))
        .queryList();

    for (ScheduledNotification scheduledNotification : scheduledNotificationList) {
      scheduledNotification.delete();
    }
  }

  @Override
  public List<ScheduledNotification> getScheduledNotificationsForExperience(String experienceId) {
    List<ScheduledNotification> scheduledNotificationList = new Select().from(ScheduledNotification.class)
        .where(Condition.column(ScheduledNotification$Table.EXPERIENCEID).is(experienceId))
        .where(Condition.column(ScheduledNotification$Table.NOTIFICATIONID).is(notificationId))
        .queryList();

    return scheduledNotificationList;
  }
}
