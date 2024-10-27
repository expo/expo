package expo.modules.devlauncher.launcher.loaders

import android.content.Context
import android.net.Uri
import expo.modules.devlauncher.helpers.DevLauncherInstallationIDHelper
import expo.interfaces.devmenu.ReactHostWrapper
import expo.modules.devlauncher.helpers.createUpdatesConfigurationWithUrl
import expo.modules.devlauncher.helpers.loadUpdate
import expo.modules.devlauncher.koin.DevLauncherKoinComponent
import expo.modules.devlauncher.koin.optInject
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface
import expo.modules.devlauncher.launcher.manifest.DevLauncherManifestParser
import expo.modules.manifests.core.Manifest
import expo.modules.updatesinterface.UpdatesInterface
import org.koin.core.component.inject

interface DevLauncherAppLoaderFactoryInterface {
  suspend fun createAppLoader(url: Uri, projectUrl: Uri, manifestParser: DevLauncherManifestParser): DevLauncherAppLoader
  fun getManifest(): Manifest?
  fun shouldUseDeveloperSupport(): Boolean
}

class DevLauncherAppLoaderFactory : DevLauncherKoinComponent, DevLauncherAppLoaderFactoryInterface {
  private val context: Context by inject()
  private val appHost: ReactHostWrapper by inject()
  private val updatesInterface: UpdatesInterface? by optInject()
  private val controller: DevLauncherControllerInterface by inject()
  private val installationIDHelper: DevLauncherInstallationIDHelper by inject()

  private var instanceWasCreated = false
  private var manifest: Manifest? = null
  private var useDeveloperSupport = true

  override suspend fun createAppLoader(url: Uri, projectUrl: Uri, manifestParser: DevLauncherManifestParser): DevLauncherAppLoader {
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
        if (it.isValidUpdatesConfiguration(configurationCandidate)) {
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
      val update = updatesInterface!!.loadUpdate(validConfiguration, context) {
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

  override fun getManifest(): Manifest? = checkIfInstanceWasCreated { manifest }

  override fun shouldUseDeveloperSupport(): Boolean = checkIfInstanceWasCreated { useDeveloperSupport }

  private inline fun <T> checkIfInstanceWasCreated(block: () -> T): T {
    if (!instanceWasCreated) {
      throw IllegalStateException("You need to create the AppLoader first.")
    }

    return block()
  }
}
