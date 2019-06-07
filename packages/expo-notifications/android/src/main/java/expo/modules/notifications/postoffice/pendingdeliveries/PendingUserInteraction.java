package expo.modules.notifications.postoffice.pendingdeliveries;

import com.raizlabs.android.dbflow.annotation.Column;
import com.raizlabs.android.dbflow.annotation.PrimaryKey;
import com.raizlabs.android.dbflow.annotation.Table;
import com.raizlabs.android.dbflow.structure.BaseModel;

@Table(databaseName = PendingDeliveriesDatabase.NAME)
public class PendingUserInteraction extends BaseModel {

  @Column
  @PrimaryKey(autoincrement = true)
  public int id;

  @Column
  public String appId;

  @Column
  public String userInteraction;

  public int getId() {
    return id;
  }

  public void setId(int id) {
    this.id = id;
  }

  public String getappId() {
    return appId;
  }

  public void setappId(String appId) {
    this.appId = appId;
  }

  public String getUserInteraction() {
    return userInteraction;
  }

  public void setUserInteraction(String userInteraction) {
    this.userInteraction = userInteraction;
  }
}
