package expo.modules.updates

import android.content.Context
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import expo.modules.updates.loader.LoaderTask

/**
 * Main entry point to expo-updates. Singleton that keeps track of updates state, holds references
 * to instances of other updates classes, and is the central hub for all updates-related tasks.
 *
 * The `start` method in the singleton instance of [IUpdatesController] should be invoked early in
 * the application lifecycle, via [UpdatesPackage]. It delegates to an instance of [LoaderTask] to
 * start the process of loading and launching an update, then responds appropriately depending on
 * the callbacks that are invoked.
 *
 * This class also optionally holds a reference to the app's [ReactNativeHost], which allows
 * expo-updates to reload JS and send events through the bridge.
 */
class UpdatesController {
  companion object {
    private var singletonInstance: IUpdatesController? = null
    @JvmStatic val instance: IUpdatesController
      get() {
        return checkNotNull(singletonInstance) { "UpdatesController.instance was called before the module was initialized" }
      }

    @JvmStatic fun initializeWithoutStarting(context: Context, configuration: Map<String, Any>? = null) {
      if (singletonInstance == null) {
        var updatesDirectoryException: Exception? = null
        val updatesDirectory = try {
          UpdatesUtils.getOrCreateUpdatesDirectory(context)
        } catch (e: Exception) {
          updatesDirectoryException = e
          null
        }

        singletonInstance = if (UpdatesConfiguration.canCreateValidConfiguration(context, configuration) && updatesDirectory != null) {
          val updatesConfiguration = UpdatesConfiguration(context, null)
          EnabledUpdatesController(context, updatesConfiguration, updatesDirectory)
        } else {
          DisabledUpdatesController(context, updatesDirectoryException, UpdatesConfiguration.isMissingRuntimeVersion(context, configuration))
        }
      }
    }

    @JvmStatic fun initializeAsDevLauncherWithoutStarting(context: Context): UpdatesDevLauncherController {
      check(singletonInstance == null) { "UpdatesController must not be initialized prior to calling initializeAsDevLauncherWithoutStarting" }

      var updatesDirectoryException: Exception? = null
      val updatesDirectory = try {
        UpdatesUtils.getOrCreateUpdatesDirectory(context)
      } catch (e: Exception) {
        updatesDirectoryException = e
        null
      }

      val initialUpdatesConfiguration = if (UpdatesConfiguration.canCreateValidConfiguration(context, null)) {
        UpdatesConfiguration(context, null)
      } else {
        null
      }
      val instance = UpdatesDevLauncherController(
        context,
        initialUpdatesConfiguration,
        updatesDirectory,
        updatesDirectoryException,
        UpdatesConfiguration.isMissingRuntimeVersion(context, null)
      )
      singletonInstance = instance
      return instance
    }

    /**
     * Initializes the UpdatesController singleton. This should be called as early as possible in the
     * application's lifecycle. Can pass additional configuration to this method to set or override
     * configuration values at runtime rather than just AndroidManifest.xml.
     * @param context the base context of the application, ideally a [ReactApplication]
     * @param configuration map of configuration pairs to override those from AndroidManifest.xml
     */
    @JvmStatic suspend fun initialize(context: Context, configuration: Map<String, Any>? = null) {
      if (singletonInstance == null) {
        initializeWithoutStarting(context, configuration)
        singletonInstance!!.start()
      }
    }
  }
}
