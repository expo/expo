package expo.modules.splashscreen

import android.app.Activity
import android.util.Log
import org.unimodules.core.interfaces.SingletonModule
import java.util.*

object SplashScreen: SingletonModule {
  private const val TAG = "SplashScreen"

  override fun getName(): String {
    return "SplashScreen"
  }

  private val controllers = WeakHashMap<Activity, SplashScreenController>()

  /**
   * Show SplashScreen by mounting it in ContentView.
   * @param activity                 Target Activity for SplashScreen to be mounted in.
   * @param resizeMode               SplashScreen imageView resizeMode.
   * @param rootViewClass            Class of View that would be monitored for children occurence (autohiding feature).
   * @param splashScreenConfigurator
   * @param successCallback          Callback to be called once SplashScreen is mounted in view hierarchy.
   * @param failureCallback          Callback to be called once SplashScreen cannot be mounted.
   * @throws [NoContentViewException] when [SplashScreen.show] is called before [Activity.setContentView] (when no ContentView is present for given activity).
   */
  @JvmStatic
  @JvmOverloads
  fun show(
    activity: Activity,
    resizeMode: SplashScreenImageResizeMode,
    rootViewClass: Class<*>,
    splashScreenConfigurator: SplashScreenConfigurator = ResourcesBasedSplashScreenConfigurator(),
    successCallback: () -> Unit = {},
    failureCallback: (reason: String) -> Unit = { Log.w(TAG, it) }
  ) {
    // SplashScreen.show can only be called once per activity
    if (controllers.containsKey(activity)) {
      return failureCallback("'SplashScreen.show' has already been called for this activity.")
    }

    val controller = SplashScreenController(activity, resizeMode, rootViewClass, splashScreenConfigurator)
    controller.showSplashScreen(successCallback)

    controllers[activity] = controller
  }

  /**
   * Prevents SplashScreen from autoHiding once App View Hierarchy is mounted for given activity.
   * @param successCallback Callback to be called once SplashScreen could be successfully prevented from autohinding.
   * @param failureCallback Callback to be called upon failure in preventing SplashScreen from autohiding.
   */
  @JvmStatic
  @JvmOverloads
  fun preventAutoHide(
    activity: Activity,
    successCallback: () -> Unit = {},
    failureCallback: (reason: String) -> Unit = {}
  ) {
    if (!controllers.containsKey(activity)) {
      return failureCallback("No Native SplashScreen registered for provided activity. First call 'SplashScreen.show' for this activity.")
    }

    controllers[activity]?.preventAutoHide(successCallback, failureCallback)
  }

  /**
   * Hides SplashScreen for given activity.
   * @param successCallback Callback to be called once SplashScreen is removed from view hierarchy.
   * @param failureCallback Callback to be called upon failure in hiding SplashScreen.
   */
  @JvmStatic
  @JvmOverloads
  fun hide(
    activity: Activity,
    successCallback: () -> Unit = {},
    failureCallback: (reason: String) -> Unit = {}
  ) {
    if (!controllers.containsKey(activity)) {
      return failureCallback("No Native SplashScreen registered for provided activity. First call 'SplashScreen.show' for this activity.")
    }

    controllers[activity]?.hideSplashScreen(successCallback, failureCallback)
  }
}
