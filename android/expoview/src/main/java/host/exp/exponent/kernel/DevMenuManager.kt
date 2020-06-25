package host.exp.exponent.kernel

import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.ActivityInfo
import android.hardware.SensorManager
import android.os.Bundle
import android.os.Handler
import android.util.Log
import android.view.View
import android.view.ViewGroup
import com.facebook.react.ReactRootView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableMap
import de.greenrobot.event.EventBus
import host.exp.exponent.utils.ShakeDetector
import host.exp.exponent.Constants
import versioned.host.exp.exponent.modules.internal.DevMenuModule
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.experience.ExperienceActivity
import host.exp.exponent.experience.ReactNativeActivity
import versioned.host.exp.exponent.ReactUnthemedRootView
import java.util.*
import javax.inject.Inject
import host.exp.exponent.modules.ExponentKernelModule
import host.exp.exponent.storage.ExponentSharedPreferences


private const val DEV_MENU_JS_MODULE_NAME = "HomeMenu"

/**
 * DevMenuManager is like a singleton that manages the dev menu in the whole application
 * and delegates calls from [ExponentKernelModule] to the specific [DevMenuModule]
 * that is linked with a react context for which the dev menu is going to be rendered.
 * Its instance can be injected as a dependency of other classes by [NativeModuleDepsProvider]
 */
class DevMenuManager {
  private var shakeDetector: ShakeDetector? = null
  private var reactRootView: ReactRootView? = null
  private var orientationBeforeShowingDevMenu: Int = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
  private val devMenuModulesRegistry = WeakHashMap<ExperienceActivity, DevMenuModuleInterface>()

  @Inject
  internal val kernel: Kernel? = null

  @Inject
  internal val exponentSharedPreferences: ExponentSharedPreferences? = null

  init {
    NativeModuleDepsProvider.getInstance().inject(DevMenuManager::class.java, this)
    EventBus.getDefault().register(this)
  }

  //region publics

  /**
   * Links given [DevMenuModule] with given [ExperienceActivity]. [DevMenuManager] needs to know this to
   * get appropriate data or pass requests down to the correct [DevMenuModule] that handles
   * all these stuff for a specific experience (DevMenuManager only delegates those calls).
   */
  fun registerDevMenuModuleForActivity(devMenuModule: DevMenuModuleInterface, activity: ExperienceActivity) {
    // Start shake detector once the first DevMenuModule registers in the manager.
    maybeStartDetectingShakes(activity.applicationContext)
    devMenuModulesRegistry[activity] = devMenuModule
  }

  /**
   * Shows dev menu in given experience activity. Ensures it never happens in standalone apps and is run on the UI thread.
   */
  @SuppressLint("SourceLockedOrientationActivity")
  fun showInActivity(activity: ExperienceActivity) {
    if (Constants.isStandaloneApp()) {
      return
    }

    UiThreadUtil.runOnUiThread {
      try {
        val devMenuModule = devMenuModulesRegistry[activity] ?: return@runOnUiThread
        val devMenuView = prepareRootView(devMenuModule.getInitialProps())

        loseFocusInActivity(activity)

        // We need to force the device to use portrait orientation as the dev menu doesn't support landscape.
        // However, when removing it, we should set it back to the orientation from before showing the dev menu.
        orientationBeforeShowingDevMenu = activity.requestedOrientation
        activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT

        activity.addReactViewToContentContainer(devMenuView)

        // @tsapeta: We need to call onHostResume on kernel's react instance with the new ExperienceActivity.
        // Otherwise, touches and other gestures may not work correctly.
        kernel?.reactInstanceManager?.onHostResume(activity)
      } catch (exception: Exception) {
        Log.e("ExpoDevMenu", exception.message)
      }
    }
  }

  /**
   * Hides dev menu in given experience activity. Ensures it never happens in standalone apps and is run on the UI thread.
   */
  fun hideInActivity(activity: ExperienceActivity) {
    if (Constants.isStandaloneApp()) {
      return
    }

    UiThreadUtil.runOnUiThread {
      reactRootView?.let {
        val parentView = it.parent as ViewGroup?

        // Restore the original orientation that had been set before the dev menu was displayed.
        activity.requestedOrientation = orientationBeforeShowingDevMenu

        it.visibility = View.GONE
        parentView?.removeView(it)
        tryToPauseHostActivity(activity)
      }
    }
  }

  /**
   * Hides dev menu in the currently shown experience activity.
   * Does nothing if the current activity is not of type [ExperienceActivity].
   */
  fun hideInCurrentActivity() {
    val currentActivity = ExperienceActivity.getCurrentActivity()

    if (currentActivity != null) {
      hideInActivity(currentActivity)
    }
  }

  /**
   * Toggles dev menu visibility in given experience activity.
   */
  fun toggleInActivity(activity: ExperienceActivity) {
    if (isDevMenuVisible() && activity.hasReactView(reactRootView)) {
      requestToClose(activity)
    } else {
      showInActivity(activity)
    }
  }

  /**
   * Requests JavaScript side to start closing the dev menu (start the animation or so).
   * Fully closes the dev menu once it receives a response from that event.
   */
  fun requestToClose(activity: ExperienceActivity) {
    if (Constants.isStandaloneApp()) {
      return
    }

    ExponentKernelModule.queueEvent("ExponentKernel.requestToCloseDevMenu", Arguments.createMap(), object : ExponentKernelModuleProvider.KernelEventCallback {
      override fun onEventSuccess(result: ReadableMap) {
        hideInActivity(activity)
      }

      override fun onEventFailure(errorMessage: String) {
        hideInActivity(activity)
      }
    })
  }

  /**
   * Simplified version of the above function, but operates on the current experience activity.
   */
  fun requestToClose() {
    getCurrentExperienceActivity()?.let {
      requestToClose(it)
    }
  }

  /**
   * Gets a map of dev menu options available in the currently shown [ExperienceActivity].
   * If the experience doesn't support developer tools just returns an empty response.
   */
  fun getMenuItems(): WritableMap {
    val devMenuModule = getCurrentDevMenuModule()
    val menuItemsBundle = devMenuModule?.getMenuItems()

    return if (menuItemsBundle != null && devMenuModule.isDevSupportEnabled()) {
      Arguments.fromBundle(menuItemsBundle)
    } else {
      Arguments.createMap()
    }
  }

  /**
   * Function called every time the dev menu option is selected. It passes this request down
   * to the specific [DevMenuModule] that is linked with the currently shown [ExperienceActivity].
   */
  fun selectItemWithKey(itemKey: String) {
    getCurrentDevMenuModule()?.selectItemWithKey(itemKey)
  }

  /**
   * Reloads app with the manifest, falls back to reloading just JS bundle if reloading manifest fails.
   */
  fun reloadApp() {
    getCurrentDevMenuModule()?.let {
      try {
        val manifestUrl = it.getManifestUrl()
        kernel?.reloadVisibleExperience(manifestUrl, false)
      } catch (reloadingException: Exception) {
        reloadingException.printStackTrace()
        // If anything goes wrong here, we can fall back to plain JS reload.
        it.reloadApp()
      }
    }
  }

  /**
   * Returns boolean value determining whether the current app supports developer tools.
   */
  fun isDevSupportEnabledByCurrentActivity(): Boolean {
    val devMenuModule = getCurrentDevMenuModule()
    return devMenuModule?.isDevSupportEnabled() ?: false
  }

  /**
   * Checks whether the dev menu is shown over given experience activity.
   */
  fun isShownInActivity(activity: ExperienceActivity): Boolean {
    return reactRootView != null && activity.hasReactView(reactRootView)
  }

  /**
   * Checks whether the dev menu onboarding is already finished.
   * Onboarding is a screen that shows the dev menu to the user that opens any experience for the first time.
   */
  fun isOnboardingFinished(): Boolean {
    return exponentSharedPreferences?.getBoolean(ExponentSharedPreferences.IS_ONBOARDING_FINISHED_KEY) ?: false
  }

  /**
   * Sets appropriate setting in shared preferences that user's onboarding has finished.
   */
  fun setIsOnboardingFinished(isOnboardingFinished: Boolean = true) {
    exponentSharedPreferences?.setBoolean(ExponentSharedPreferences.IS_ONBOARDING_FINISHED_KEY, isOnboardingFinished)
  }

  /**
   * In case the user switches from [host.exp.exponent.experience.HomeActivity] to [ExperienceActivity] which has a visible dev menu,
   * we need to call onHostResume on the kernel's react instance manager to change its current activity.
   */
  fun maybeResumeHostWithActivity(activity: ExperienceActivity) {
    if (isShownInActivity(activity)) {
      kernel?.reactInstanceManager?.onHostResume(activity)
    }
  }

  /**
   * Receives events of type [ReactNativeActivity.ExperienceDoneLoadingEvent] once the experience finishes loading.
   */
  fun onEvent(event: ReactNativeActivity.ExperienceDoneLoadingEvent) {
    (event.activity as? ExperienceActivity)?.let {
      maybeShowWithOnboarding(it)
    }
  }

  //endregion publics
  //region internals

  /**
   * Says whether the dev menu should show onboarding view if this is the first time
   * the user opens an experience, or he hasn't finished onboarding yet.
   */
  private fun shouldShowOnboarding(): Boolean {
    return !Constants.isStandaloneApp() && !KernelConfig.HIDE_ONBOARDING && !isOnboardingFinished() && !Constants.DISABLE_NUX
  }

  /**
   * Shows dev menu in given activity but only when the onboarding view should show up.
   */
  private fun maybeShowWithOnboarding(activity: ExperienceActivity) {
    if (shouldShowOnboarding() && !isShownInActivity(activity)) {
      // @tsapeta: We need a small delay to allow the experience to be fully rendered.
      // Without the delay we were having some weird issues with style props being set on nonexistent shadow views.
      // From the other side, it's good that we don't show it immediately so the user can see his app first.
      Handler().postDelayed({ showInActivity(activity) }, 2000)
    }
  }

  /**
   * Starts [ShakeDetector] if it's not running yet.
   */
  private fun maybeStartDetectingShakes(context: Context) {
    if (shakeDetector != null) {
      return
    }
    shakeDetector = ShakeDetector { this.onShakeGesture() }
    shakeDetector?.start(context.getSystemService(Context.SENSOR_SERVICE) as SensorManager)
  }

  /**
   * If this is the first time when we're going to show the dev menu, it creates a new react root view
   * that will render the other endpoint of home app whose name is described by [DEV_MENU_JS_MODULE_NAME] constant.
   * Also sets initialProps, layout settings and initial animation values.
   */
  @Throws(Exception::class)
  private fun prepareRootView(initialProps: Bundle): ReactRootView {
    // Throw an exception in case the kernel is not initialized yet.
    if (kernel?.reactInstanceManager == null) {
      throw Exception("Kernel's React instance manager is not initialized yet.")
    }

    if (reactRootView == null) {
      reactRootView = ReactUnthemedRootView(kernel.activityContext)
      reactRootView?.startReactApplication(kernel.reactInstanceManager, DEV_MENU_JS_MODULE_NAME, initialProps)
    } else {
      reactRootView?.appProperties = initialProps
    }

    val rootView = reactRootView!!

    rootView.layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
    rootView.visibility = View.VISIBLE

    return rootView
  }

  /**
   * Loses view focus in given activity. It makes sure that system's keyboard is hidden when presenting dev menu view.
   */
  private fun loseFocusInActivity(activity: ExperienceActivity) {
    activity.getCurrentFocus()?.clearFocus()
  }

  /**
   * Returns an instance implementing [DevMenuModuleInterface] linked to the current [ExperienceActivity], or null if the current
   * activity is not of [ExperienceActivity] type or there is no module registered for that activity.
   */
  private fun getCurrentDevMenuModule(): DevMenuModuleInterface? {
    val currentActivity = getCurrentExperienceActivity()
    return if (currentActivity != null) devMenuModulesRegistry[currentActivity] else null
  }

  /**
   * Returns current activity if it's of type [ExperienceActivity], or null otherwise.
   */
  private fun getCurrentExperienceActivity(): ExperienceActivity? {
    return ExperienceActivity.getCurrentActivity()
  }

  /**
   * Checks whether the dev menu is visible anywhere.
   */
  private fun isDevMenuVisible(): Boolean {
    return reactRootView?.parent != null
  }

  /**
   * Handles shake gesture which simply toggles the dev menu.
   */
  private fun onShakeGesture() {
    val currentActivity = ExperienceActivity.getCurrentActivity()

    if (currentActivity != null) {
      toggleInActivity(currentActivity)
    }
  }

  private fun tryToPauseHostActivity(activity: ExperienceActivity) {
    try {
      kernel?.reactInstanceManager?.onHostPause(activity)
    } catch (e: AssertionError) {
      // nothing
    }
  }

  //endregion internals
}
