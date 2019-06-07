package expo.modules.notifications.channels;

import android.content.Context;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

public class ThreadSafeChannelManager implements ChannelManager {

  private volatile static ThreadSafeChannelManager mInstance = null;

  private final ChannelManager mChannelManager = new AndroidAwareChannelManager();

  private ExecutorService mSingleThreadExecutor = Executors.newSingleThreadExecutor();

  private ThreadSafeChannelManager() {}

  public static synchronized ChannelManager getInstance() {
    if (mInstance == null) {
      mInstance = new ThreadSafeChannelManager();
    }
    return mInstance;
  }

  @Override
  public void addChannel(String channelId, ChannelPOJO channel, Context context) {
    mSingleThreadExecutor.execute(() -> mChannelManager.addChannel(channelId, channel, context));
  }

  @Override
  public void deleteChannel(String channelId, Context context) {
    mSingleThreadExecutor.execute(() -> mChannelManager.deleteChannel(channelId, context));
  }

  @Override
  public void addChannel(String channelId, ChannelPOJO channel, Context context, Runnable continuation) {
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
  public Future<ChannelPOJO> getPropertiesForChannelId(String channelId, Context context) {
    return mSingleThreadExecutor.submit(() -> mChannelManager.getPropertiesForChannelId(channelId, context).get());
  }
}
