// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import android.content.Context;

import host.exp.exponent.analytics.EXL;
import host.exp.exponent.experience.ExperienceActivity;

public class ExponentUncaughtExceptionHandler implements Thread.UncaughtExceptionHandler {

  private static final String TAG = ExponentUncaughtExceptionHandler.class.getSimpleName();

  private Thread.UncaughtExceptionHandler mOldExceptionHandler;
  private Context mContext;

  public ExponentUncaughtExceptionHandler(Context context) {
    mOldExceptionHandler = Thread.getDefaultUncaughtExceptionHandler();
    mContext = context;
  }

  @Override
  public void uncaughtException(Thread thread, Throwable ex) {
    try {
      ExperienceActivity.removeNotification(mContext);
    } catch (Throwable e) {
      // Don't ever want to crash before getting to default exception handler
      EXL.e(TAG, e);
    }

    if (mOldExceptionHandler != null) {
      // Let default handler know about the crash.
      mOldExceptionHandler.uncaughtException(thread, ex);
    }

    // TODO: open up home screen with error screen preloaded.
    // KernelProvider.getInstance().handleError doesn't always work because sometimes the process gets corrupted.
    System.exit(1);
  }
}
