package com.reactnativecommunity.asyncstorage;

import java.util.ArrayDeque;
import java.util.concurrent.Executor;

/**
 * Detox is using this implementation detail in its environment setup,
 * so in order for Next storage to work, this class has been made public
 *
 * Adapted from https://android.googlesource.com/platform/frameworks/base.git/+/1488a3a19d4681a41fb45570c15e14d99db1cb66/core/java/android/os/AsyncTask.java#237
 */
public class SerialExecutor implements Executor {
    private final ArrayDeque<Runnable> mTasks = new ArrayDeque<Runnable>();
    private Runnable mActive;
    private final Executor executor;

    public SerialExecutor(Executor executor) {
        this.executor = executor;
    }

    public synchronized void execute(final Runnable r) {
        mTasks.offer(new Runnable() {
            public void run() {
                try {
                    r.run();
                } finally {
                    scheduleNext();
                }
            }
        });
        if (mActive == null) {
            scheduleNext();
        }
    }
    synchronized void scheduleNext() {
        if ((mActive = mTasks.poll()) != null) {
            executor.execute(mActive);
        }
    }
}
