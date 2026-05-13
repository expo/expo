package expo.modules.devlauncher.launcher.loaders

import android.content.Context
import android.net.Uri
import com.facebook.react.ReactHost
import expo.modules.devlauncher.DevLauncherController
import expo.modules.devlauncher.helpers.DevLauncherInstallationIDHelper
import expo.modules.devlauncher.helpers.createUpdatesConfigurationWithUrl
import expo.modules.devlauncher.helpers.loadUpdate
import expo.modules.devlauncher.launcher.manifest.DevLauncherManifestParser
import expo.modules.manifests.core.Manifest
import expo.modules.updatesinterface.UpdatesDevLauncherInterface
import expo.modules.updatesinterface.UpdatesInterface

class DevLauncherAppLoaderFactory(
  val context: Context,
  val appHost: ReactHost,
  val updatesInterface: UpdatesInterface?,
  val controller: DevLauncherController,
  val installationIDHelper: DevLauncherInstallationIDHelper
) {
  private var instanceWasCreated = false
  private var manifest: Manifest? = null
  private var useDeveloperSupport = true

  suspend fun createAppLoader(url: Uri, projectUrl: Uri, manifestParser: DevLauncherManifestParser): DevLauncherAppLoader {
    instanceWasCreated = true

    if (!manifestParser.isManifestUrl()) {
      // It's (maybe) a raw React Native bundle
      return DevLauncherReactNativeAppLoader(url, appHost, context, controller)
    }

    val validConfiguration = updatesInterface?.let {
      val runtimeVersion = it.runtimeVersion
      if (runtimeVersion == null) {
        null
      } else {
        val configurationCandidate = createUpdatesConfigurationWithUrl(url, projectUrl, runtimeVersion, installationIDHelper.getOrCreateInstallationID(context))
        if ((it as UpdatesDevLauncherInterface).isValidUpdatesConfiguration(configurationCandidate)) {
          configurationCandidate
        } else {
          null
        }
      }
    }

    return if (validConfiguration == null) {
      manifest = manifestParser.parseManifest()
      if (!manifest!!.isUsingDeveloperTool()) {
        throw Exception("expo-updates is not properly installed or integrated. In order to load published projects with this development client, follow all installation and setup instructions for both the expo-dev-client and expo-updates packages.")
      }
      DevLauncherLocalAppLoader(manifest!!, appHost, context, controller)
    } else {
      val update = (updatesInterface as UpdatesDevLauncherInterface?)!!.loadUpdate(validConfiguration, context) {
        manifest = Manifest.fromManifestJson(it) // TODO: might be able to pass actual manifest object in here
        return@loadUpdate !manifest!!.isUsingDeveloperTool()
      }
      if (manifest!!.isUsingDeveloperTool()) {
        DevLauncherLocalAppLoader(manifest!!, appHost, context, controller)
      } else {
        useDeveloperSupport = false
        val localBundlePath = update.launchAssetPath
        DevLauncherPublishedAppLoader(manifest!!, localBundlePath, appHost, context, controller)
      }
    }
  }

  fun getManifest(): Manifest? = checkIfInstanceWasCreated { manifest }

  fun shouldUseDeveloperSupport(): Boolean = checkIfInstanceWasCreated { useDeveloperSupport }

  private inline fun <T> checkIfInstanceWasCreated(block: () -> T): T {
    if (!instanceWasCreated) {
      throw IllegalStateException("You need to create the AppLoader first.")
    }

    return block()
  }
}
