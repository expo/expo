package expo.modules.notifications.channels;

import com.raizlabs.android.dbflow.annotation.Column;
import com.raizlabs.android.dbflow.annotation.PrimaryKey;
import com.raizlabs.android.dbflow.annotation.Table;
import com.raizlabs.android.dbflow.structure.BaseModel;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;

@Table(database = ChannelPropertiesDatabase.class)
public class ChannelProperties extends BaseModel {

  @PrimaryKey
  @Column
  public String channelId;

  @Column
  public String serializedChannel;

  public ChannelProperties() {

  }

  public ChannelProperties(ChannelSpecification channelSpecification) {
    channelId = channelSpecification.getChannelId();
    try {
      ByteArrayOutputStream bo = new ByteArrayOutputStream();
      ObjectOutputStream so = new ObjectOutputStream(bo);
      so.writeObject(channelSpecification);
      so.flush();
      serializedChannel = bo.toString("ISO-8859-1");
      so.close();
    } catch (Exception e) {
      System.out.println(e);
    }
  }

  public ChannelSpecification toChannelSpecification() {
    try {
      byte b[] = serializedChannel.getBytes("ISO-8859-1");
      ByteArrayInputStream bi = new ByteArrayInputStream(b);
      ObjectInputStream si = new ObjectInputStream(bi);
      ChannelSpecification channelSpecification = (ChannelSpecification) si.readObject();
      si.close();
      return channelSpecification;
    } catch (Exception e) {
      System.out.println(e);
    }
    return null;
  }

}
