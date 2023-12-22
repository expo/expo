package expo.modules.updates

import android.content.Context
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import expo.modules.updates.loader.LoaderTask
import expo.modules.updates.logging.UpdatesErrorCode
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updatesinterface.UpdatesInterfaceCallbacks

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
    private var overrideConfiguration: UpdatesConfiguration? = null

    @JvmStatic val instance: IUpdatesController
      get() {
        return checkNotNull(singletonInstance) { "UpdatesController.instance was called before the module was initialized" }
      }

    @JvmStatic fun initializeWithoutStarting(context: Context) {
      if (singletonInstance == null) {
        var updatesDirectoryException: Exception? = null
        val updatesDirectory = try {
          UpdatesUtils.getOrCreateUpdatesDirectory(context)
        } catch (e: Exception) {
          updatesDirectoryException = e
          null
        }

        val updatesConfiguration: UpdatesConfiguration? = overrideConfiguration ?: run {
          val logger = UpdatesLogger(context)
          when (UpdatesConfiguration.getUpdatesConfigurationValidationResult(context, null)) {
            UpdatesConfigurationValidationResult.VALID -> {
              return@run UpdatesConfiguration(context, null)
            }
            UpdatesConfigurationValidationResult.INVALID_NOT_ENABLED -> logger.warn(
              "The expo-updates system is explicitly disabled. To enable it, set the enabled setting to true.",
              UpdatesErrorCode.InitializationError
            )
            UpdatesConfigurationValidationResult.INVALID_MISSING_URL -> logger.warn(
              "The expo-updates system is disabled due to an invalid configuration. Ensure a valid URL is supplied.",
              UpdatesErrorCode.InitializationError
            )
            UpdatesConfigurationValidationResult.INVALID_MISSING_RUNTIME_VERSION -> logger.warn(
              "The expo-updates system is disabled due to an invalid configuration. Ensure a runtime version is supplied.",
              UpdatesErrorCode.InitializationError
            )
          }
          return@run null
        }

        singletonInstance = if (updatesConfiguration != null && updatesDirectory != null) {
          EnabledUpdatesController(context, updatesConfiguration, updatesDirectory)
        } else {
          val logger = UpdatesLogger(context)
          if (updatesDirectory == null) {
            // this means there was a storage error
            logger.error(
              "The expo-updates system is disabled due to a storage access error: ${updatesDirectoryException?.message ?: "Unknown Error"}",
              UpdatesErrorCode.InitializationError
            )
          }
          DisabledUpdatesController(context, updatesDirectoryException, UpdatesConfiguration.isMissingRuntimeVersion(context, null))
        }
      }
    }

    @JvmStatic fun initializeAsDevLauncherWithoutStarting(context: Context, callbacks: UpdatesInterfaceCallbacks): UpdatesDevLauncherController {
      check(singletonInstance == null) { "UpdatesController must not be initialized prior to calling initializeAsDevLauncherWithoutStarting" }

      var updatesDirectoryException: Exception? = null
      val updatesDirectory = try {
        UpdatesUtils.getOrCreateUpdatesDirectory(context)
      } catch (e: Exception) {
        updatesDirectoryException = e
        null
      }

      val initialUpdatesConfiguration = overrideConfiguration ?: run {
        if (UpdatesConfiguration.getUpdatesConfigurationValidationResult(context, null) == UpdatesConfigurationValidationResult.VALID) {
          UpdatesConfiguration(context, null)
        } else {
          null
        }
      }

      val instance = UpdatesDevLauncherController(
        context,
        initialUpdatesConfiguration,
        updatesDirectory,
        updatesDirectoryException,
        UpdatesConfiguration.isMissingRuntimeVersion(context, null),
        callbacks
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
    @JvmStatic fun initialize(context: Context) {
      if (singletonInstance == null) {
        initializeWithoutStarting(context)
        singletonInstance!!.start()
      }
    }

    /**
     * Overrides the [UpdatesConfiguration] that will be used inside [UpdatesController]
     * This should be called as early as possible in the application's lifecycle.
     * Can pass additional configuration to this method to set or override
     * configuration values at runtime rather than just AndroidManifest.xml.
     *
     * @param context the base context of the application, ideally a [ReactApplication]
     * @param configuration map of configuration pairs to override those from AndroidManifest.xml
     */
    @JvmStatic
    fun overrideConfiguration(context: Context, configuration: Map<String, Any>) {
      if (singletonInstance != null) {
        throw AssertionError("The method should be called before UpdatesController.initialize()")
      }
      val updatesConfigurationValidationResult = UpdatesConfiguration.getUpdatesConfigurationValidationResult(context, configuration)
      if (updatesConfigurationValidationResult == UpdatesConfigurationValidationResult.VALID) {
        overrideConfiguration = UpdatesConfiguration(context, configuration)
      } else {
        val logger = UpdatesLogger(context)
        logger.warn("Failed to overrideConfiguration: invalid configuration: ${updatesConfigurationValidationResult.name}")
      }
    }
  }
}
