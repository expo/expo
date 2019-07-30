package host.exp.exponent.notifications.channels;

import com.raizlabs.android.dbflow.annotation.Column;
import com.raizlabs.android.dbflow.annotation.PrimaryKey;
import com.raizlabs.android.dbflow.annotation.Table;

import org.json.JSONObject;

import java.util.ArrayList;

@Table(databaseName = ChannelPropertiesDatabase.NAME)
public class ChannelProperties {

  @PrimaryKey
  @Column
  public String channelId;

  @Column
  public String channelName;

  @Column
  public Integer importance;

  @Column(typeConverter = ArrayConverter.class)
  public ArrayList vibrate;

  @Column
  public boolean badge;

  @Column
  public boolean sound;


  public static ChannelProperties createChannelProperties(String channelId, JSONObject jsonObject) {

  }
  
  public static ChannelProperties findChannelPropertiesForChannelId(String channelId) {

  }

  
  public void save() {

  }

  
  public void delete() {

  }

  
  public String getChannelId() {
    return null;
  }

  
  public Long[] getVibrate() {
    return new Long[0];
  }

  
  public String getChannelName() {
    return null;
  }

  
  public int getImportance() {
    return 0;
  }

  
  public boolean getSound() {
    return false;
  }

  
  public boolean getBadge() {
    return false;
  }

  
  public String getChannelDescription() {
    return null;
  }

  
  public void setChannelId(String channelId) {

  }

  
  public void setVibrate(Long[] vibrate) {

  }

  
  public void setChannelName(String channelName) {

  }

  
  public void setImportance(int importance) {

  }

  
  public void setSound(boolean sound) {

  }

  
  public void setBadge(boolean badge) {

  }

  
  public void setChannelDescription(String channelDescription) {

  }
}
