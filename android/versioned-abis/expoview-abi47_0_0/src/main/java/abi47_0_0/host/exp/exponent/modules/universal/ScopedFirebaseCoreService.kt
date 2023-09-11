package abi47_0_0.host.exp.exponent.modules.universal

import android.content.Context
import android.util.Base64
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import abi47_0_0.expo.modules.core.ModuleRegistry
import abi47_0_0.expo.modules.core.interfaces.RegistryLifecycleListener
import abi47_0_0.expo.modules.firebase.core.FirebaseCoreOptions
import abi47_0_0.expo.modules.firebase.core.FirebaseCoreService
import expo.modules.manifests.core.Manifest
import host.exp.exponent.kernel.ExperienceKey
import org.json.JSONObject
import java.io.UnsupportedEncodingException
import java.lang.Exception

class ScopedFirebaseCoreService(
  context: Context,
  manifest: Manifest,
  experienceKey: ExperienceKey
) : FirebaseCoreService(context), RegistryLifecycleListener {
  private val appName: String
  private val appOptions: FirebaseOptions?

  override fun getAppName(): String {
    return appName
  }

  override fun getAppOptions(): FirebaseOptions? {
    return appOptions
  }

  override fun isAppAccessible(name: String): Boolean {
    synchronized(protectedAppNames) {
      if (protectedAppNames.containsKey(name) && appName != name) {
        return false
      }
    }
    return super.isAppAccessible(name)
  }

  // Registry lifecycle events
  override fun onCreate(moduleRegistry: ModuleRegistry) {
    // noop
  }

  override fun onDestroy() {
    // Mark this Firebase App as deleted. Don't delete it straight
    // away, but mark it for deletion. When loading a new project
    // a check is performed that will cleanup the deleted Firebase apps.
    // This ensures that Firebase Apps don't get deleted/recreated
    // every time a project reload happens, and also also ensures that
    // `isAppAccessible` keeps the app unavailable for other project/packages
    // after unload.
    synchronized(protectedAppNames) { protectedAppNames.put(appName, true) }
  }

  companion object {
    private val protectedAppNames = mutableMapOf<String, Boolean>() // Map<App-name, isDeleted>

    private fun getEncodedExperienceScopeKey(experienceKey: ExperienceKey): String {
      return try {
        val encodedUrl = experienceKey.getUrlEncodedScopeKey()
        val data = encodedUrl.toByteArray(charset("UTF-8"))
        Base64.encodeToString(
          data,
          Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP
        )
      } catch (e: UnsupportedEncodingException) {
        experienceKey.scopeKey.hashCode().toString()
      }
    }

    // google-services.json loading

    private fun getJSONStringByPath(jsonArg: JSONObject?, path: String): String? {
      var json = jsonArg ?: return null
      return try {
        val paths = path.split(".").toTypedArray()
        for (i in paths.indices) {
          val name = paths[i]
          if (!json.has(name)) return null
          if (i == paths.size - 1) {
            return json.getString(name)
          } else {
            json = json.getJSONObject(name)
          }
        }
        null
      } catch (err: Exception) {
        null
      }
    }

    private fun MutableMap<String, String>.putJSONString(
      key: String,
      json: JSONObject?,
      path: String
    ) {
      val value = getJSONStringByPath(json, path)
      if (value != null) this[key] = value
    }

    private fun getClientFromGoogleServices(
      googleServicesFile: JSONObject?,
      preferredPackageNames: List<String?>
    ): JSONObject? {
      val clients = googleServicesFile?.optJSONArray("client") ?: return null

      // Find the client and prefer the ones that are in the preferredPackageNames list.
      // Later in the list means higher priority.
      var client: JSONObject? = null
      var clientPreferredPackageNameIndex = -1
      for (i in 0 until clients.length()) {
        val possibleClient = clients.optJSONObject(i)
        if (possibleClient != null) {
          val packageName = getJSONStringByPath(possibleClient, "client_info.android_client_info.package_name")
          val preferredPackageNameIndex = if (packageName != null) preferredPackageNames.indexOf(packageName) else -1
          if (client == null || preferredPackageNameIndex > clientPreferredPackageNameIndex) {
            client = possibleClient
            clientPreferredPackageNameIndex = preferredPackageNameIndex
          }
        }
      }
      return client
    }

    private fun getOptionsFromManifest(manifest: Manifest): FirebaseOptions? {
      return try {
        val googleServicesFileString = manifest.getAndroidGoogleServicesFile()
        val googleServicesFile = if (googleServicesFileString != null) JSONObject(googleServicesFileString) else null
        val packageName = if (manifest.getAndroidPackageName() != null) manifest.getAndroidPackageName() else ""

        // Read project-info settings
        // https://developers.google.com/android/guides/google-services-plugin
        val json = mutableMapOf<String, String>().apply {
          putJSONString("projectId", googleServicesFile, "project_info.project_id")
          putJSONString("messagingSenderId", googleServicesFile, "project_info.project_number")
          putJSONString("databaseURL", googleServicesFile, "project_info.firebase_url")
          putJSONString("storageBucket", googleServicesFile, "project_info.storage_bucket")
        }

        // Get the client that matches this app. When the Expo Go package was explicitly
        // configured in google-services.json, then use that app when possible.
        // Otherwise, use the client that matches the package_name specified in app.json.
        // If none of those are found, use first encountered client in google-services.json.
        val client = getClientFromGoogleServices(
          googleServicesFile,
          listOf(
            packageName,
            "host.exp.exponent"
          )
        )

        // Read properties from client
        json.putJSONString("appId", client, "client_info.mobilesdk_app_id")
        json.putJSONString(
          "trackingId",
          client,
          "services.analytics_service.analytics_property.tracking_id"
        )
        val apiKey = client?.optJSONArray("api_key")
        if (apiKey != null && apiKey.length() > 0) {
          json.putJSONString("apiKey", apiKey.getJSONObject(0), "current_key")
        }

        // The appId is the best indicator on whether all required info was available
        // and parsed correctly.
        if (json.containsKey("appId")) FirebaseCoreOptions.fromJSON(json) else null
      } catch (err: Exception) {
        null
      }
    }
  }

  init {
    // Get the default firebase app name
    val defaultApp = getFirebaseApp(null)
    val defaultAppName = defaultApp?.name ?: DEFAULT_APP_NAME

    // Get experience key & unique app name
    appName = "__sandbox_" + getEncodedExperienceScopeKey(experienceKey)
    appOptions = getOptionsFromManifest(manifest)

    // Add the app to the list of protected app names
    synchronized(protectedAppNames) {
      protectedAppNames[defaultAppName] = false
      protectedAppNames[appName] = false
    }

    // Delete any previously created apps for which the project was unloaded
    // This ensures that the list of Firebase Apps doesn't keep growing
    // for each uniquely loaded project.
    for (app in FirebaseApp.getApps(context)) {
      var isDeleted = false
      synchronized(protectedAppNames) {
        if (protectedAppNames.containsKey(app.name)) {
          isDeleted = protectedAppNames[app.name]!!
        }
      }
      if (isDeleted) {
        app.delete()
      }
    }

    // Cleanup any deleted apps from the protected-names map
    synchronized(protectedAppNames) {
      val forRemoval = mutableSetOf<String>()
      for ((key, value) in protectedAppNames) {
        if (value) { // isDeleted
          forRemoval.add(key)
        }
      }
      for (app in forRemoval) {
        protectedAppNames.remove(app)
      }
    }

    // Initialize the firebase app. This will delete/create/update the app
    // if it has changed, and leaves the app untouched when the config
    // is the same.
    updateFirebaseApp(appOptions, appName)
  }
}
