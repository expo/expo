package expo.modules.notifications.channels;

import android.content.Context;

import com.raizlabs.android.dbflow.sql.builder.Condition;
import com.raizlabs.android.dbflow.sql.language.Select;

import java.util.List;
import java.util.concurrent.Future;

public class PersistentChannelManager implements ChannelManager{

  @Override
  public void addChannel(String channelId, ChannelPOJO channel, final Context context) {
    deleteChannel(channelId, context);
    new ChannelProperties(channel).save();
  }

  @Override
  public void deleteChannel(String channelId, final Context context) {
    List<ChannelProperties> channelList = new Select().from(ChannelProperties.class)
            .where(Condition.column(ChannelProperties$Table.CHANNELID)
            .is(channelId))
            .queryList();
    for (ChannelProperties channelProperties : channelList) {
      channelProperties.delete();
    }
  }

  @Override
  public Future<ChannelPOJO> getPropertiesForChannelId(String channelId, final Context context) {
    List<ChannelProperties> channelList = new Select().from(ChannelProperties.class)
        .where(Condition.column(ChannelProperties$Table.CHANNELID)
            .is(channelId))
        .queryList();
    if (channelList.size() == 0) {
      return new SynchronicFuture(null);
    }
    return new SynchronicFuture(channelList.get(0).toChannelPOJO());
  }
}
