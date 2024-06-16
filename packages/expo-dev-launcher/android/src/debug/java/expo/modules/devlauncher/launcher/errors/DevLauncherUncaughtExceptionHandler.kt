package expo.modules.devlauncher.launcher.errors

import android.app.Activity
import android.app.Application
import android.content.Context
import android.net.Uri
import android.os.Bundle
import android.os.Process
import android.util.Log
import expo.modules.devlauncher.DevLauncherController
import expo.modules.devlauncher.koin.DevLauncherKoinContext
import expo.modules.devlauncher.logs.DevLauncherRemoteLogManager
import java.lang.ref.WeakReference
import java.util.*
import kotlin.concurrent.schedule
import kotlin.system.exitProcess

class DevLauncherUncaughtExceptionHandler(
  private val controller: DevLauncherController,
  application: Application,
  private val defaultUncaughtHandler: Thread.UncaughtExceptionHandler?
) : Thread.UncaughtExceptionHandler {
  private val applicationHolder = WeakReference(application)
  private var exceptionWasReported = false
  private var timerTask: TimerTask? = null

  init {
    application.registerActivityLifecycleCallbacks(object : Application.ActivityLifecycleCallbacks {
      override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
        if (exceptionWasReported && activity is DevLauncherErrorActivity) {
          timerTask?.cancel()
          timerTask = null
          exceptionWasReported = false
          return
        }
      }

      override fun onActivityStarted(activity: Activity) = Unit

      override fun onActivityResumed(activity: Activity) = Unit

      override fun onActivityPaused(activity: Activity) = Unit

      override fun onActivityStopped(activity: Activity) = Unit

      override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit

      override fun onActivityDestroyed(activity: Activity) = Unit
    })
  }

  override fun uncaughtException(thread: Thread, exception: Throwable) {
    // The same exception can be reported multiple times.
    // We handle only the first one.
    if (exceptionWasReported || DevLauncherErrorActivity.isVisible()) {
      return
    }

    exceptionWasReported = true
    Log.e("DevLauncher", "DevLauncher tries to handle uncaught exception.", exception)
    tryToSaveException(exception)
    tryToSendExceptionToBundler(exception)

    applicationHolder.get()?.let {
      DevLauncherErrorActivity.showFatalError(
        it,
        DevLauncherAppError(exception.message, exception)
      )
    }

    // We don't know if the error screen will show up.
    // For instance, if the exception was thrown in `MainApplication.onCreate` method,
    // the error screen won't show up.
    // That's why we schedule a simple function which will check
    // if the error was handle properly or will fallback
    // to the default exception handler.
    timerTask = Timer().schedule(2000) {
      if (!exceptionWasReported) {
        // Exception was handle, we should suppress error here
        return@schedule
      }

      // The error screen didn't appear in time.
      // We fallback to the default exception handler.
      if (defaultUncaughtHandler != null) {
        defaultUncaughtHandler.uncaughtException(thread, exception)
      } else {
        // This scenario should never occur. It can only happen if there was no defaultUncaughtHandler when the handler was set up.
        Log.e("UNCAUGHT_EXCEPTION", "exception", exception) // print exception in 'Logcat' tab.
        Process.killProcess(Process.myPid())
        exitProcess(0)
      }
    }
  }

  private fun tryToSaveException(exception: Throwable) {
    val context = DevLauncherKoinContext.app.koin.getOrNull<Context>() ?: return
    val errorRegistry = DevLauncherErrorRegistry(context)
    errorRegistry.storeException(exception)
  }

  private fun tryToSendExceptionToBundler(exception: Throwable) {
    if (
      controller.mode != DevLauncherController.Mode.APP ||
      !controller.appHost.hasInstance ||
      controller.appHost.currentReactContext === null
    ) {
      return
    }

    try {
      val url = getWebSocketUrl()
      val remoteLogManager = DevLauncherRemoteLogManager(DevLauncherKoinContext.app.koin.get(), url)
        .apply {
          deferError("Your app just crashed. See the error below.")
          deferError(exception)
        }
      remoteLogManager.sendViaWebSocket()
    } catch (e: Throwable) {
      Log.e("DevLauncher", "Couldn't send an exception to bundler. $e", e)
    }
  }

  private fun getWebSocketUrl(): Uri {
    // URL structure replicates
    // https://github.com/facebook/react-native/blob/0.69-stable/Libraries/Utilities/HMRClient.js#L164
    val devSupportManager = requireNotNull(controller.appHost.devSupportManager)
    return Uri
      .parse(devSupportManager.sourceUrl)
      .buildUpon()
      .path("hot")
      .clearQuery()
      .build()
  }
}
