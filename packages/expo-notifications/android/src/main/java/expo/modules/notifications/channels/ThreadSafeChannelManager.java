package expo.modules.notifications.channels;

import android.content.Context;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

public class ThreadSafeChannelManager implements ChannelManager {

  private ChannelManager mChannelManager;

  private ExecutorService mSingleThreadExecutor = Executors.newSingleThreadExecutor();

  @Override
  public void setNextChannelManager(ChannelManager channelManager) {
    mChannelManager = channelManager;
  }

  @Override
  public void addChannel(String channelId, ChannelSpecification channel, Context context) {
    mSingleThreadExecutor.execute(() -> mChannelManager.addChannel(channelId, channel, context));
  }

  @Override
  public void deleteChannel(String channelId, Context context) {
    mSingleThreadExecutor.execute(() -> mChannelManager.deleteChannel(channelId, context));
  }

  @Override
  public void addChannel(String channelId, ChannelSpecification channel, Context context, Runnable continuation) {
    mSingleThreadExecutor.execute(
      () -> {
        mChannelManager.addChannel(channelId, channel, context);
        continuation.run();
      }
    );
  }

  @Override
  public void deleteChannel(String channelId, Context context, Runnable continuation) {
    mSingleThreadExecutor.execute(
      () -> {
        mChannelManager.deleteChannel(channelId, context);
        continuation.run();
      }
    );
  }

  @Override
  public Future<ChannelSpecification> getPropertiesForChannelId(String channelId, Context context) {
    return mSingleThreadExecutor.submit(() -> mChannelManager.getPropertiesForChannelId(channelId, context).get());
  }
}
