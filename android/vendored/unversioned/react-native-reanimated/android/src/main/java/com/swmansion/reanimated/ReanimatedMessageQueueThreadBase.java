package com.swmansion.reanimated;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.queue.MessageQueueThread;
import com.facebook.react.bridge.queue.MessageQueueThreadImpl;
import com.facebook.react.bridge.queue.MessageQueueThreadPerfStats;
import com.facebook.react.bridge.queue.MessageQueueThreadSpec;
import java.lang.reflect.Field;
import java.util.concurrent.Callable;
import java.util.concurrent.Future;

// This class is an almost exact copy of MessageQueueThreadImpl taken from here:
// https://github.com/facebook/react-native/blob/main/ReactAndroid/src/main/java/com/facebook/react/bridge/queue/MessageQueueThreadImpl.java
// The only method that has changed is `quitSynchronous()` (see comment above
// function implementation for details).
@DoNotStrip
public abstract class ReanimatedMessageQueueThreadBase implements MessageQueueThread {
  protected final MessageQueueThreadImpl messageQueueThread;

  public ReanimatedMessageQueueThreadBase() {
    messageQueueThread =
        MessageQueueThreadImpl.create(
            MessageQueueThreadSpec.mainThreadSpec(),
            exception -> {
              throw new RuntimeException(exception);
            });
  }

  @Override
  public <T> Future<T> callOnQueue(Callable<T> callable) {
    return messageQueueThread.callOnQueue(callable);
  }

  @Override
  public boolean isOnThread() {
    return messageQueueThread.isOnThread();
  }

  @Override
  public void assertIsOnThread() {
    messageQueueThread.assertIsOnThread();
  }

  @Override
  public void assertIsOnThread(String s) {
    messageQueueThread.assertIsOnThread(s);
  }

  // We don't want to quit the main looper (which is what MessageQueueThreadImpl would have done),
  // but we still want to prevent anything else from executing.
  @Override
  public void quitSynchronous() {
    try {
      Field mIsFinished = messageQueueThread.getClass().getDeclaredField("mIsFinished");
      mIsFinished.setAccessible(true);
      mIsFinished.set(messageQueueThread, true);
      mIsFinished.setAccessible(false);
    } catch (NoSuchFieldException | IllegalAccessException e) {
      e.printStackTrace();
    }
  }

  @Override
  public MessageQueueThreadPerfStats getPerfStats() {
    return messageQueueThread.getPerfStats();
  }

  @Override
  public void resetPerfStats() {
    messageQueueThread.resetPerfStats();
  }
}
