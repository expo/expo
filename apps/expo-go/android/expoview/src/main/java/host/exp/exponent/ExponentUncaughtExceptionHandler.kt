// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent

import android.content.Context
import host.exp.exponent.analytics.EXL
import host.exp.exponent.experience.ExperienceActivity

class ExponentUncaughtExceptionHandler(private val context: Context) : Thread.UncaughtExceptionHandler {
  private val oldExceptionHandler = Thread.getDefaultUncaughtExceptionHandler()

  override fun uncaughtException(thread: Thread, ex: Throwable) {
    try {
      ExperienceActivity.removeNotification(context)
    } catch (e: Throwable) {
      // Don't ever want to crash before getting to default exception handler
      EXL.e(TAG, e)
    }
    oldExceptionHandler.uncaughtException(thread, ex)

    // TODO: open up home screen with error screen preloaded.
    // KernelProvider.getInstance().handleError doesn't always work because sometimes the process gets corrupted.
    System.exit(1)
  }

  companion object {
    private val TAG = ExponentUncaughtExceptionHandler::class.java.simpleName
  }
}
