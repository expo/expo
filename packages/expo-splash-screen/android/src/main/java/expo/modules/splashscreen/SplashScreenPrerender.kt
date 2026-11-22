package expo.modules.splashscreen

import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.Process
import android.os.SystemClock
import android.util.DisplayMetrics
import android.util.Log
import android.view.View
import android.view.ViewGroup
import com.facebook.react.ReactApplication
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.shell.MainReactPackage
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.react.uimanager.common.UIManagerType
import org.json.JSONObject
import java.io.File
import java.lang.ref.WeakReference
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlin.concurrent.thread

/**
 * Renders the app's first screen through Fabric before React Native starts.
 *
 * When the app hides the splash screen, the screen that replaces it is captured (the view hierarchy
 * with the frames Android resolved, and the props of its React Native views from the app's shadow
 * tree) and stored in the cache directory. On the next launch, the snapshot is read, built and laid
 * out with Fabric on a background thread from `Application.onCreate`, and mounted into an overlay on
 * the activity's decor view from `SplashScreenManager.registerOnActivity`. Only the renderer and the
 * mounting layer are used, through a standalone `FabricUIManager`: no React instance, no JS runtime,
 * no TurboModules. The overlay fades out when the app hides the splash screen.
 *
 * `<meta-data android:name="expo.modules.splashscreen.PRERENDER_SNAPSHOT" android:value="true"/>` in
 * AndroidManifest.xml turns it on.
 */
object SplashScreenPrerender {
  private const val TAG = "ExpoSplashPrerender"
  private const val META_DATA_KEY = "expo.modules.splashscreen.PRERENDER_SNAPSHOT"

  // `adb shell am start ... --ez ExpoSplashScreenPrerenderDisabled true` turns the prerender off for A/B runs.
  private const val DISABLED_EXTRA = "ExpoSplashScreenPrerenderDisabled"

  // Increment when the snapshot format changes. A rebuild with the same version code keeps old snapshots.
  private const val SNAPSHOT_FORMAT = 2

  // How long the first activity waits for the background preparation before it shows the splash only.
  private const val PREPARATION_TIMEOUT_MS = 50L

  // Root tags end in 1; this one is far above anything React allocates.
  private const val SURFACE_ID = 900001

  private val mainHandler = Handler(Looper.getMainLooper())

  private var prepared: CountDownLatch? = null

  // Written by the preparation thread, read on the main thread only after `prepared` is done.
  private var preparedEnvironment: JSONObject? = null
  private var preparedRenderer: Renderer? = null
  private var appBuild: String = ""

  /** The standalone Fabric renderer of a prepared snapshot, and the native shadow tree (`handle`). */
  private class Renderer(val context: SplashScreenPrerenderContext, val fabricUIManager: FabricUIManager, var handle: Long)

  private var renderer: Renderer? = null

  @Volatile
  private var enabled = false
  private var disabledForLaunch = false
  private var showAttempted = false
  private var pendingActivity: WeakReference<Activity>? = null
  private var hideRequested = false
  private var overlay: ViewGroup? = null
  private var isFadingOut = false
  private var activity: WeakReference<Activity>? = null
  private var capturePending = false
  private var captured = false

  /** Whether the prerender is turned on and active for this launch. */
  val isEnabled: Boolean
    get() = enabled && !disabledForLaunch

  /** Main thread. Whether the snapshot is on screen. When false, the splash screen should be shown instead. */
  val isShown: Boolean
    get() = overlay != null

  /** Starts reading the snapshot of the last launch on a background thread. */
  @Synchronized
  fun prepare(context: Context) {
    if (prepared != null) {
      return
    }
    val latch = CountDownLatch(1)
    prepared = latch
    val appContext = context.applicationContext
    thread(name = "expo-splash-screen-prerender", priority = Thread.MAX_PRIORITY) {
      try {
        val isOn = readEnabled(appContext)
        if (isOn) {
          appBuild = readAppBuild(appContext)
        }
        enabled = isOn
        if (isOn) {
          log("prepare")
          val snapshot = loadSnapshot(appContext)
          if (snapshot != null) {
            preparedRenderer = prepareRenderer(appContext, snapshot)
            if (preparedRenderer != null) {
              preparedEnvironment = snapshot.getJSONObject("environment")
              log("prepared (background)")
            }
          }
        }
      } catch (e: Throwable) {
        Log.w(TAG, "Failed to prepare the prerender", e)
        preparedRenderer = null
      } finally {
        latch.countDown()
        // The first activity did not wait this long; the snapshot can still replace the splash screen.
        mainHandler.post { showWhenPrepared() }
      }
    }
  }

  /**
   * Background thread. Builds the snapshot into a shadow tree and lays it out with Fabric. Text is
   * measured through a `FabricUIManager` with no binding, which mounts the tree later as well.
   */
  private fun prepareRenderer(context: Context, snapshot: JSONObject): Renderer? {
    val environment = snapshot.getJSONObject("environment")
    val template = SplashScreenSnapshot.removeUnavailableFonts(context, snapshot.getJSONObject("template")) ?: return null
    val density = environment.optInt("density") / DisplayMetrics.DENSITY_DEFAULT.toFloat()
    // Text measurement and `BackgroundStyleApplicator` convert sizes with the display metrics React
    // Native sets up when its instance starts, which is after this runs.
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(context)
    val reactContext = SplashScreenPrerenderContext(context)
    val reactPackage = MainReactPackage()
    val viewManagers = listOf("RCTView", "RCTText").mapNotNull { reactPackage.createViewManager(reactContext, it) }
    val registry = ViewManagerRegistry(viewManagers)
    val fabricUIManager = FabricUIManager(reactContext, registry) { }
    reactContext.uiManager = fabricUIManager
    val handle = SplashScreenPrerenderNative.prepare(
      fabricUIManager,
      SURFACE_ID,
      template.toString(),
      environment.optInt("width") / density,
      environment.optInt("height") / density,
      density,
      environment.optInt("layoutDirection") == View.LAYOUT_DIRECTION_RTL
    )
    if (handle == 0L) {
      return null
    }
    return Renderer(reactContext, fabricUIManager, handle)
  }

  /**
   * Main thread, before `super.onCreate`. Shows the prepared snapshot in an overlay on the decor view.
   * The overlay is removed again when its size turns out not to match the snapshot.
   */
  fun showIfPrepared(activity: Activity) {
    this.activity = WeakReference(activity)
    if (showAttempted) {
      return
    }
    showAttempted = true
    prepare(activity)
    if (activity.intent?.getBooleanExtra(DISABLED_EXTRA, false) == true) {
      disabledForLaunch = true
      hideRequested = true
      return
    }
    val latch = prepared ?: return
    if (!latch.await(PREPARATION_TIMEOUT_MS, TimeUnit.MILLISECONDS)) {
      log("not prepared in time, shown when prepared")
      pendingActivity = WeakReference(activity)
      return
    }
    show(activity)
  }

  /** Main thread. Shows a snapshot that was prepared after the first activity stopped waiting for it. */
  private fun showWhenPrepared() {
    if (hideRequested) {
      releasePreparedRenderer()
      return
    }
    val activity = pendingActivity?.get() ?: return
    pendingActivity = null
    if (hideRequested || activity.isFinishing) {
      releasePreparedRenderer()
      return
    }
    show(activity)
  }

  private fun releasePreparedRenderer() {
    renderer = preparedRenderer ?: return
    preparedRenderer = null
    preparedEnvironment = null
    releaseRenderer()
  }

  private fun show(activity: Activity) {
    val renderer = preparedRenderer ?: return
    val environment = preparedEnvironment ?: return
    preparedRenderer = null
    preparedEnvironment = null
    this.renderer = renderer
    val decorView = activity.window?.decorView as? ViewGroup
    if (decorView == null) {
      releaseRenderer()
      return
    }

    val expected = environmentOf(activity, environment.optInt("width"), environment.optInt("height"))
    if (!sameEnvironment(environment, expected)) {
      log("snapshot does not match this configuration: $environment is not $expected")
      releaseRenderer()
      return
    }

    val start = SystemClock.uptimeMillis()
    val container = SplashScreenPrerenderRootView(activity)
    decorView.addView(container, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
    val mounted = try {
      startSurface(renderer, activity, container) && SplashScreenPrerenderNative.mount(renderer.handle)
    } catch (e: Throwable) {
      Log.w(TAG, "Failed to mount the snapshot", e)
      false
    }
    if (!mounted) {
      decorView.removeView(container)
      releaseRenderer()
      return
    }
    // The window size is known once the decor view is laid out, before its first frame is drawn.
    container.addOnLayoutChangeListener { view, left, top, right, bottom, _, _, _, _ ->
      val width = right - left
      val height = bottom - top
      if (overlay === view && (width != environment.optInt("width") || height != environment.optInt("height"))) {
        log("snapshot does not match this window: ${width}x$height is not ${environment.optInt("width")}x${environment.optInt("height")}")
        // Hidden in this frame, so the splash screen stays; removing a view during layout is deferred.
        overlay = null
        view.alpha = 0f
        mainHandler.post {
          (view.parent as? ViewGroup)?.removeView(view)
          releaseRenderer()
        }
      }
    }
    overlay = container
    log("shown (mounted in ${SystemClock.uptimeMillis() - start} ms)")
  }

  /**
   * `FabricUIManager.startSurface` needs a binding (a React instance). The prerender starts the
   * surface in its mounting manager directly, which is all the mounting of a synchronous batch needs.
   */
  private fun startSurface(renderer: Renderer, activity: Activity, rootView: View): Boolean {
    val mountingManager = mountingManagerOf(renderer.fabricUIManager) ?: return false
    val themedContext = ThemedReactContext(renderer.context, activity, "", SURFACE_ID)
    mountingManager.javaClass
      .getMethod("startSurface", Int::class.javaPrimitiveType, ThemedReactContext::class.java, View::class.java)
      .invoke(mountingManager, SURFACE_ID, themedContext, rootView)
    return true
  }

  private fun mountingManagerOf(fabricUIManager: FabricUIManager): Any? = try {
    FabricUIManager::class.java.getDeclaredField("mMountingManager").apply { isAccessible = true }.get(fabricUIManager)
  } catch (e: ReflectiveOperationException) {
    Log.w(TAG, "React Native's mounting manager is not available", e)
    null
  }

  /** Main thread. Stops the surface and releases the shadow tree and the standalone `FabricUIManager`. */
  private fun releaseRenderer() {
    val renderer = renderer ?: return
    this.renderer = null
    try {
      mountingManagerOf(renderer.fabricUIManager)?.let { mountingManager ->
        mountingManager.javaClass.getMethod("stopSurface", Int::class.javaPrimitiveType).invoke(mountingManager, SURFACE_ID)
      }
    } catch (e: ReflectiveOperationException) {
      Log.w(TAG, "Failed to stop the prerender surface", e)
    }
    SplashScreenPrerenderNative.release(renderer.handle, SURFACE_ID)
    renderer.handle = 0
  }

  /** Main thread. Fades the overlay out over `durationMs` (0 removes it immediately), then releases it. */
  fun dismiss(durationMs: Long = 0) {
    hideRequested = true
    val container = overlay ?: return
    if (durationMs <= 0) {
      removeOverlay(container)
      return
    }
    if (isFadingOut) {
      return
    }
    isFadingOut = true
    log("fading out")
    container.animate()
      .alpha(0f)
      .setDuration(durationMs)
      .withEndAction { removeOverlay(container) }
      .start()
  }

  private fun removeOverlay(container: ViewGroup) {
    if (overlay === container) {
      overlay = null
      log("dismissed")
    }
    (container.parent as? ViewGroup)?.removeView(container)
    releaseRenderer()
  }

  /**
   * Main thread. Captures the screen on display after `delayMs` (once it has settled) for the next
   * launch. The snapshot replays only while the window size, density, text size, appearance and app
   * build match. Only the first successful capture of a process is saved.
   */
  fun captureLaunchScreen(delayMs: Long) {
    if (!isEnabled || captured || capturePending) {
      return
    }
    capturePending = true
    mainHandler.postDelayed({
      capturePending = false
      saveLaunchScreen()
    }, delayMs)
  }

  private fun saveLaunchScreen() {
    val activity = activity?.get() ?: return
    val decorView = activity.window?.decorView as? ViewGroup ?: return
    if (!isEnabled || captured || decorView.width == 0 || decorView.height == 0) {
      return
    }
    val url = snapshotFile(activity)
    val directory = url.parentFile ?: return
    // The marker file stays when the capture crashes. This build then does not capture again,
    // so a crash in the capture cannot repeat on every launch.
    val marker = File(directory, "capture-started")
    if (marker.exists() && runCatching { marker.readText() }.getOrNull() == appBuild) {
      captured = true
      log("snapshot: skipped, the last capture of this build did not finish")
      return
    }
    directory.mkdirs()
    marker.writeText(appBuild)

    val start = SystemClock.uptimeMillis()
    val nodes = appShadowTreeProps(activity)
    if (nodes == null) {
      marker.delete()
      log("snapshot: the app's shadow tree is not available")
      return
    }
    val serializer = SplashScreenSnapshot(decorView, exclude = overlay, nodes = nodes, debug = isLoggable)
    val template = serializer.serialize()
    if (template == null || (template.optJSONArray("children")?.length() ?: 0) == 0) {
      marker.delete()
      log("snapshot: nothing on screen")
      return
    }
    val snapshot = JSONObject()
      .put("environment", environmentOf(activity, decorView.width, decorView.height))
      .put("template", template)
    marker.delete()
    captured = true
    log("snapshot serialized (${serializer.viewCount} views) in ${SystemClock.uptimeMillis() - start} ms")
    thread(name = "expo-splash-screen-snapshot") {
      val data = snapshot.toString()
      val written = runCatching {
        val temporary = File(directory, "launch-snapshot.json.tmp")
        temporary.writeText(data)
        temporary.renameTo(url) || throw IllegalStateException("rename failed")
      }.isSuccess
      log("snapshot ${if (written) "saved" else "not saved"} (${data.length} bytes)")
    }
  }

  /** The props of the app's React Native views, by tag, from the shadow trees of its `FabricUIManager`. */
  private fun appShadowTreeProps(activity: Activity): JSONObject? {
    val reactContext = (activity.application as? ReactApplication)?.reactHost?.currentReactContext ?: return null
    val fabricUIManager = UIManagerHelper.getUIManager(reactContext, UIManagerType.FABRIC) as? FabricUIManager ?: return null
    val json = SplashScreenPrerenderNative.captureProps(fabricUIManager) ?: return null
    return runCatching { JSONObject(json) }.getOrNull()
  }

  // region Snapshot file

  /** Where the snapshot of the last launch's first screen lives. The system can delete it. */
  private fun snapshotFile(context: Context) = File(File(context.cacheDir, "expo-splash-screen"), "launch-snapshot.json")

  /** Background thread. Uses no view state: the window is compared in `showIfPrepared`. */
  private fun loadSnapshot(context: Context): JSONObject? {
    val file = snapshotFile(context)
    val data = runCatching { file.readText() }.getOrNull()
    // A snapshot is used for one launch only: the capture after the splash hides writes the next one.
    // A snapshot that crashes the prerender then cannot crash every launch.
    if (data == null || !file.delete()) {
      log("no snapshot for this launch")
      return null
    }
    val snapshot = runCatching { JSONObject(data) }.getOrNull()
    val environment = snapshot?.optJSONObject("environment")
    if (environment == null ||
      environment.optString("build") != appBuild ||
      environment.optInt("format") != SNAPSHOT_FORMAT ||
      snapshot.optJSONObject("template") == null
    ) {
      log("snapshot does not match this build")
      return null
    }
    return snapshot
  }

  /**
   * What a snapshot was taken under. A snapshot replays only when all of it still matches: frames are
   * absolute pixels, so a different window, density, text size or appearance would draw the wrong screen.
   */
  private fun environmentOf(activity: Activity, width: Int, height: Int): JSONObject {
    val configuration = activity.resources.configuration
    return JSONObject()
      .put("width", width)
      .put("height", height)
      .put("density", activity.resources.displayMetrics.densityDpi)
      .put("appearance", configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK)
      .put("fontScale", configuration.fontScale.toString())
      .put("layoutDirection", configuration.layoutDirection)
      .put("build", appBuild)
      .put("format", SNAPSHOT_FORMAT)
  }

  private fun sameEnvironment(a: JSONObject, b: JSONObject): Boolean {
    val keys = b.keys().asSequence().toList()
    return a.length() == keys.size && keys.all { a.opt(it)?.toString() == b.opt(it)?.toString() }
  }

  // endregion

  private fun readEnabled(context: Context): Boolean {
    val applicationInfo = context.packageManager.getApplicationInfo(context.packageName, PackageManager.GET_META_DATA)
    return applicationInfo.metaData?.getBoolean(META_DATA_KEY, false) == true
  }

  private fun readAppBuild(context: Context): String {
    val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
    val versionCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      packageInfo.longVersionCode
    } else {
      @Suppress("DEPRECATION")
      packageInfo.versionCode.toLong()
    }
    return "${packageInfo.versionName} $versionCode"
  }

  // `adb shell setprop log.tag.ExpoSplashPrerender DEBUG` turns the timeline log on.
  private val isLoggable: Boolean
    get() = Log.isLoggable(TAG, Log.DEBUG)

  private fun log(stage: String) {
    if (!isLoggable) {
      return
    }
    val sinceStart = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      SystemClock.uptimeMillis() - Process.getStartUptimeMillis()
    } else {
      -1
    }
    Log.d(TAG, "prerender $stage at $sinceStart ms since process start")
  }
}
