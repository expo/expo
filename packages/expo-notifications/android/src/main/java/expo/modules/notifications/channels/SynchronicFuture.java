package expo.modules.notifications.channels;

import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

public class SynchronicFuture implements Future<ChannelSpecification> {

  private ChannelSpecification mChannelSpecification;

  SynchronicFuture(ChannelSpecification channelSpecification) {
    mChannelSpecification = channelSpecification;
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
  public ChannelSpecification get() {
    return mChannelSpecification;
  }

  @Override
  public ChannelSpecification get(long timeout, TimeUnit unit) {
    return mChannelSpecification;
  }
}
