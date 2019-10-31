package expo.modules.notifications.channels;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

public class SynchronicFuture implements Future<ChannelPOJO> {

  private ChannelPOJO mChannelPOJO;

  SynchronicFuture(ChannelPOJO channelPOJO) {
    mChannelPOJO = channelPOJO;
  }

  @Override
  public boolean cancel(boolean mayInterruptIfRunning) {
    return false;
  }

  @Override
  public boolean isCancelled() {
    return false;
  }

  @Override
  public boolean isDone() {
    return true;
  }

  @Override
  public ChannelPOJO get() {
    return mChannelPOJO;
  }

  @Override
  public ChannelPOJO get(long timeout, TimeUnit unit) {
    return mChannelPOJO;
  }
}
