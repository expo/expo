package expo.modules.brownfield

import android.util.Log
import com.facebook.react.ReactHost
import com.facebook.react.common.ShakeDetector
import com.facebook.react.devsupport.DevServerHelper
import com.facebook.react.devsupport.DevSupportManagerBase
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.packagerconnection.JSPackagerClient
import expo.modules.manifests.core.Manifest
import java.io.IOException
import java.net.MalformedURLException
import java.net.URL
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject

object DevMenuSupport {
  val coroutineScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
}

/**
 * Fetches the manifest from the bundler server
 */
public fun fetchManifest(reactHost: ReactHost, completion: (Manifest?, String?) -> Unit) {
  DevMenuSupport.coroutineScope.launch {
    val manifestUrl = getManifestUrl(reactHost)
    if (manifestUrl == null) {
      Log.e("DevMenuSupport(brownfield)", "No manifest URL found")
      completion(null, null)
      return@launch
    }

    val manifest = withContext(Dispatchers.IO) {
      makeManifestRequest(manifestUrl)
    }

    if (manifest == null) {
      Log.e("DevMenuSupport(brownfield)", "Failed to fetch manifest")
      completion(null, null)
      return@launch
    }

    completion(manifest, manifestUrl)
  }
}

/*
 * Builds a request for fetching the manifest from the bundler server
 */
internal fun makeManifestRequest(manifestUrl: String): Manifest? {
  try {
    val client =
      OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    val request =
      Request.Builder()
        .url("$manifestUrl")
        .addHeader("Accept", "application/expo+json,application/json")
        .addHeader("Expo-Platform", "android")
        .build()

    client.newCall(request).execute().use { response ->
      if (response.isSuccessful) {
        val responseBody = response.body?.string()
        if (responseBody != null) {
          Log.d("DevMenuSupport(brownfield)", "Successfully fetched manifest")
          val manifestJson = JSONObject(responseBody)
          return Manifest.fromManifestJson(manifestJson)
        }
      } else {
        Log.e("DevMenuSupport(brownfield)", "Failed to fetch manifest: ${response.code}")
        return null
      }
    }

    return null
  } catch (e: IOException) {
    Log.e("DevMenuSupport(brownfield)", "Failed to connect to Metro: ${e.message}")
    return null
  } catch (e: Exception) {
    Log.e("DevMenuSupport(brownfield)", "Failed to retrieve manifest: ${e.message}")
    return null
  }
}

/**
 * Gets the manifest URL from the React host
 */
internal suspend fun getManifestUrl(reactHost: ReactHost): String? {
  try {
    val sourceUrl = reactHost.devSupportManager?.sourceUrl
    if (sourceUrl == null) {
      Log.e("DevMenuSupport(brownfield)", "No source URL found in reactHost.devSupportManager")
      return null
    }

    val url = URL(sourceUrl)
    if (url.port == -1) {
      Log.w("DevMenuSupport(brownfield)", "Port for the URL is not specified")

      val defaultPort = url.defaultPort
      if (defaultPort == -1) {
        Log.w("DevMenuSupport(brownfield)", "Default port for protocol ${url.protocol} is not specified")
        return null
      }

      Log.w("DevMenuSupport(brownfield)", "Fetching from the default port for protocol ${url.protocol}: $defaultPort")
      return "${url.protocol}://${url.host}:${url.defaultPort}"
    }

    return "${url.protocol}://${url.host}:${url.port}"
  } catch (e: MalformedURLException) {
    Log.e("DevMenuSupport(brownfield)", "Failed to parse source URL: ${e.message}")
    return null
  }
}

/**
 * Tries to stop the shake detector
 */
internal fun tryToStopShakeDetector(currentDevSupportManager: DevSupportManager) {
  try {
    val shakeDetector: ShakeDetector =
      DevSupportManagerBase::class
        .java
        .getProtectedFieldValue(currentDevSupportManager, "shakeDetector")
    shakeDetector.stop()
  } catch (e: Exception) {
    Log.w("DevMenuSupport(brownfield)", "Couldn't stop shake detector.", e)
  }
}

/**
 * Gets a protected field value from an object
 */
internal fun <T, U> Class<out T>.getProtectedFieldValue(obj: T, fieldName: String): U {
  val field = getDeclaredField(fieldName)
  field.isAccessible = true
  @Suppress("UNCHECKED_CAST")
  return field.get(obj) as U
}

/**
 * Closes and reopens the packager connection to reload dev menu handlers
 */
public fun closeAndReopenPackagerConnection(devSupportManager: DevSupportManagerBase) {
  DevMenuSupport.coroutineScope.launch {
    try {
      val devManagerClass = DevSupportManagerBase::class.java
      while (true) {
        // Invalidate shake detector - not doing that leads to memory leaks
        tryToStopShakeDetector(devSupportManager)

        val devServerHelper: DevServerHelper =
          devManagerClass.getProtectedFieldValue(devSupportManager, "devServerHelper")

        try {
          val packagerClient: JSPackagerClient? =
            DevServerHelper::class.java.getProtectedFieldValue(devServerHelper, "packagerClient")

          if (packagerClient != null) {
            devServerHelper.closePackagerConnection()
            Log.d(
              "DevMenuSupport(brownfield)",
              "Closed packager connection to install new handlers"
            )
            // The connection will automatically reopen when dev support is enabled
            // or when the activity resumes, and it will use the updated
            // customPackagerCommandHandlers
            return@launch
          }
        } catch (e: NoSuchFieldException) {
          Log.w("DevMenuSupport(brownfield)", "Couldn't close the packager connection", e)
          return@launch
        }

        delay(50)
      }
    } catch (e: Exception) {
      Log.w("DevMenuSupport(brownfield)", "Couldn't close packager connection: ${e.message}", e)
    }
  }
}
