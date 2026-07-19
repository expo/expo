package expo.modules.devlauncher.launcher.loaders

import android.content.Context
import android.net.Uri
import androidx.core.net.toUri
import com.facebook.react.ReactHost
import expo.modules.devlauncher.DevLauncherController
import expo.modules.devlauncher.helpers.DevLauncherInstallationIDHelper
import expo.modules.devlauncher.helpers.DevLauncherUrl
import expo.modules.devlauncher.helpers.createUpdatesConfigurationWithUrl
import expo.modules.devlauncher.helpers.loadUpdate
import expo.modules.devlauncher.launcher.manifest.DevLauncherManifestParser
import expo.modules.manifests.core.Manifest
import expo.modules.updatesinterface.UpdatesDevLauncherInterface
import expo.modules.updatesinterface.UpdatesInterface

data class AppLoaderResult(
  val appLoader: DevLauncherAppLoader,
  val manifest: Manifest?,
  val manifestURL: Uri?,
  val resolvedUrl: Uri,
  val devLauncherUrl: DevLauncherUrl?,
  val useDeveloperSupport: Boolean
)

suspend fun createAppLoader(
  url: Uri,
  projectUrl: Uri?,
  context: Context,
  appHost: ReactHost,
  updatesInterface: UpdatesInterface?,
  controller: DevLauncherController,
  installationIDHelper: DevLauncherInstallationIDHelper
): AppLoaderResult {
  if (isAssetUrl(url)) {
    (updatesInterface as? UpdatesDevLauncherInterface)?.setIsUsingEmbeddedAssets(true)
    return AppLoaderResult(
      appLoader = DevLauncherEmbeddedAppLoader(appHost, context, controller, url.toString()),
      manifest = null,
      manifestURL = null,
      resolvedUrl = url,
      devLauncherUrl = null,
      useDeveloperSupport = false
    )
  }

  val devLauncherUrl = DevLauncherUrl(url)
  val parsedUrl = devLauncherUrl.url
  var parsedProjectUrl = projectUrl ?: url

  if (isEASUpdateURL(url) && projectUrl == null) {
    parsedProjectUrl = DevLauncherController.getMetadataValue(context, "expo.modules.updates.EXPO_UPDATE_URL").toUri()
  }

  val manifestParser = DevLauncherManifestParser(controller.httpClient, parsedUrl, installationIDHelper.getOrCreateInstallationID(context))

  if (!manifestParser.isManifestUrl()) {
    return AppLoaderResult(
      appLoader = DevLauncherReactNativeAppLoader(parsedUrl, appHost, context, controller),
      manifest = null,
      manifestURL = null,
      resolvedUrl = parsedUrl,
      devLauncherUrl = devLauncherUrl,
      useDeveloperSupport = true
    )
  }

  val validConfiguration = updatesInterface?.let {
    val runtimeVersion = it.runtimeVersion ?: return@let null
    val configurationCandidate = createUpdatesConfigurationWithUrl(parsedUrl, parsedProjectUrl, runtimeVersion, installationIDHelper.getOrCreateInstallationID(context))
    if ((it as UpdatesDevLauncherInterface).isValidUpdatesConfiguration(configurationCandidate)) {
      configurationCandidate
    } else {
      null
    }
  }

  if (validConfiguration == null) {
    val manifest = manifestParser.parseManifest()
    if (!manifest.isUsingDeveloperTool()) {
      throw Exception("expo-updates is not properly installed or integrated. In order to load published projects with this development client, follow all installation and setup instructions for both the expo-dev-client and expo-updates packages.")
    }
    return AppLoaderResult(
      appLoader = DevLauncherLocalAppLoader(manifest, appHost, context, controller),
      manifest = manifest,
      manifestURL = parsedUrl,
      resolvedUrl = parsedUrl,
      devLauncherUrl = devLauncherUrl,
      useDeveloperSupport = true
    )
  }

  var manifest: Manifest? = null
  val update = (updatesInterface as UpdatesDevLauncherInterface).loadUpdate(validConfiguration, context) {
    manifest = Manifest.fromManifestJson(it)
    return@loadUpdate !manifest.isUsingDeveloperTool()
  }

  return if (manifest!!.isUsingDeveloperTool()) {
    AppLoaderResult(
      appLoader = DevLauncherLocalAppLoader(manifest, appHost, context, controller),
      manifest = manifest,
      manifestURL = parsedUrl,
      resolvedUrl = parsedUrl,
      devLauncherUrl = devLauncherUrl,
      useDeveloperSupport = true
    )
  } else {
    AppLoaderResult(
      appLoader = DevLauncherPublishedAppLoader(manifest, update.launchAssetPath, appHost, context, controller),
      manifest = manifest,
      manifestURL = parsedUrl,
      resolvedUrl = parsedUrl,
      devLauncherUrl = devLauncherUrl,
      useDeveloperSupport = false
    )
  }
}

private fun isAssetUrl(url: Uri): Boolean {
  return url.toString().startsWith("assets://")
}

private fun isEASUpdateURL(url: Uri): Boolean {
  return url.host.equals("u.expo.dev") || url.host.equals("staging-u.expo.dev")
}
