package expo.modules.notifications.scheduling.insecurescheduler.repository;

import com.raizlabs.android.dbflow.annotation.Column;
import com.raizlabs.android.dbflow.annotation.PrimaryKey;
import com.raizlabs.android.dbflow.annotation.Table;
import com.raizlabs.android.dbflow.structure.BaseModel;

@Table(databaseName = ScheduledNotificationDatabase.NAME)
public class ScheduledNotification extends BaseModel {

  @PrimaryKey
  @Column
  String appId;

  @PrimaryKey
  @Column
  int notificationId;

  public String getappId() {
    return appId;
  }

  public void setappId(String appId) {
    this.appId = appId;
  }

  public int getNotificationId() {
    return notificationId;
  }

  public void setNotificationId(int notificationId) {
    this.notificationId = notificationId;
  }

}
