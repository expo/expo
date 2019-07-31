package host.exp.exponent.notifications.insecurecheduler.repository;

import com.raizlabs.android.dbflow.annotation.Column;
import com.raizlabs.android.dbflow.annotation.PrimaryKey;
import com.raizlabs.android.dbflow.annotation.Table;
import com.raizlabs.android.dbflow.structure.BaseModel;

@Table(databaseName = ScheduledNotificationDatabase.NAME)
public class ScheduledNotification extends BaseModel {

  @PrimaryKey
  @Column
  String experienceId;

  @PrimaryKey
  @Column
  int notificationId;

  public String getExperienceId() {
    return experienceId;
  }

  public void setExperienceId(String experienceId) {
    this.experienceId = experienceId;
  }

  public int getNotificationId() {
    return notificationId;
  }

  public void setNotificationId(int notificationId) {
    this.notificationId = notificationId;
  }

}
