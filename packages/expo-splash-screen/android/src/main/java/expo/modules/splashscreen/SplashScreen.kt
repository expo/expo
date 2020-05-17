package expo.modules.splashscreen

import android.app.Activity
import android.util.Log
import android.view.ViewGroup
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
   * @param rootViewClass            Class of View that would be monitored for children occurrence (autohiding feature).
   * @param splashScreenResourcesProvider
   * @param successCallback          Callback to be called once SplashScreen is mounted in view hierarchy.
   * @param failureCallback          Callback to be called once SplashScreen cannot be mounted.
   * @throws [expo.modules.splashscreen.exceptions.NoContentViewException] when [SplashScreen.show] is called before [Activity.setContentView] (when no ContentView is present for given activity).
   */
  @JvmStatic
  @JvmOverloads
  fun show(
      activity: Activity,
      resizeMode: SplashScreenImageResizeMode,
      rootViewClass: Class<out ViewGroup>,
      splashScreenResourcesProvider: SplashScreenResourcesProvider = NativeResourcesBasedProvider(),
      successCallback: () -> Unit = {},
      failureCallback: (reason: String) -> Unit = { Log.w(TAG, it) }
  ) {
    // SplashScreen.show can only be called once per activity
    if (controllers.containsKey(activity)) {
      return failureCallback("'SplashScreen.show' has already been called for this activity.")
    }

    val controller = SplashScreenController(activity, resizeMode, rootViewClass, splashScreenResourcesProvider)
    controllers[activity] = controller
    controller.showSplashScreen(successCallback)
  }

  /**
   * Prevents SplashScreen from autoHiding once App View Hierarchy is mounted for given activity.
   * @param successCallback Callback to be called once SplashScreen could be successfully prevented from autohinding.
   * @param failureCallback Callback to be called upon failure in preventing SplashScreen from autohiding.
   */
  fun preventAutoHide(
    activity: Activity,
    successCallback: (hasEffect: Boolean) -> Unit,
    failureCallback: (reason: String) -> Unit
  ) {
    if (!controllers.containsKey(activity)) {
      return failureCallback("No native splash screen registered for provided activity. Please configure your application's main Activity to call 'SplashScreen.show' (https://github.com/expo/expo/tree/master/packages/expo-splash-screen#-configure-android).")
    }

    controllers[activity]?.preventAutoHide(successCallback, failureCallback)
  }

  /**
   * Hides SplashScreen for given activity.
   * @param successCallback Callback to be called once SplashScreen is removed from view hierarchy.
   * @param failureCallback Callback to be called upon failure in hiding SplashScreen.
   */
  fun hide(
    activity: Activity,
    successCallback: (hasEffect: Boolean) -> Unit,
    failureCallback: (reason: String) -> Unit
  ) {
    if (!controllers.containsKey(activity)) {
      return failureCallback("No native splash screen registered for provided activity. Please configure your application's main Activity to call 'SplashScreen.show' (https://github.com/expo/expo/tree/master/packages/expo-splash-screen#-configure-android).")
    }

    controllers[activity]?.hideSplashScreen(successCallback, failureCallback)
  }
}
