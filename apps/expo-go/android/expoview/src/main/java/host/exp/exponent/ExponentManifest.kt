// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.net.Uri
import android.os.AsyncTask
import android.text.TextUtils
import android.util.LruCache
import expo.modules.manifests.core.Manifest
import host.exp.exponent.analytics.EXL
import host.exp.exponent.generated.ExponentBuildConstants
import host.exp.exponent.kernel.ExponentUrls
import host.exp.exponent.kernel.KernelProvider
import host.exp.exponent.storage.ExponentSharedPreferences
import host.exp.exponent.utils.ColorParser
import host.exp.expoview.R
import org.apache.commons.io.IOUtils
import org.json.JSONException
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.math.max

data class ManifestAndAssetRequestHeaders(val manifest: Manifest, val assetRequestHeaders: JSONObject)

@Singleton
class ExponentManifest @Inject constructor(
  var context: Context,
  var exponentSharedPreferences: ExponentSharedPreferences
) {
  interface BitmapListener {
    fun onLoadBitmap(bitmap: Bitmap?)
  }

  private val memoryCache: LruCache<String, Bitmap>

  fun loadIconBitmap(iconUrl: String?, listener: BitmapListener) {
    val icon = getIconFromCache(iconUrl)
    if (icon != null) {
      listener.onLoadBitmap(icon)
      return
    }
    object : AsyncTask<Void?, Void?, Bitmap>() {
      override fun doInBackground(vararg p0: Void?): Bitmap? {
        return loadIconTask(iconUrl)
      }

      override fun onPostExecute(result: Bitmap?) {
        listener.onLoadBitmap(result)
      }
    }.execute()
  }

  private fun getIconFromCache(iconUrl: String?): Bitmap? {
    return if (iconUrl == null || TextUtils.isEmpty(iconUrl)) {
      BitmapFactory.decodeResource(context.resources, R.mipmap.ic_launcher)
    } else {
      memoryCache[iconUrl]
    }
  }

  private fun loadIconTask(iconUrl: String?): Bitmap? {
    return try {
      // TODO: inject shared OkHttp client
      val url = URL(iconUrl)
      val connection = url.openConnection() as HttpURLConnection
      connection.doInput = true
      connection.connect()
      val input = connection.inputStream
      val bitmap = BitmapFactory.decodeStream(input)
      val width = bitmap.width
      val height = bitmap.height
      if (width <= MAX_BITMAP_SIZE && height <= MAX_BITMAP_SIZE) {
        memoryCache.put(iconUrl, bitmap)
        return bitmap
      }
      val maxDimension = max(width, height)
      val scaledWidth = width.toFloat() * MAX_BITMAP_SIZE / maxDimension
      val scaledHeight = height.toFloat() * MAX_BITMAP_SIZE / maxDimension
      val scaledBitmap =
        Bitmap.createScaledBitmap(bitmap, scaledWidth.toInt(), scaledHeight.toInt(), true)
      memoryCache.put(iconUrl, scaledBitmap)
      scaledBitmap
    } catch (e: IOException) {
      EXL.e(TAG, e)
      BitmapFactory.decodeResource(context.resources, R.mipmap.ic_launcher)
    } catch (e: Throwable) {
      EXL.e(TAG, e)
      BitmapFactory.decodeResource(context.resources, R.mipmap.ic_launcher)
    }
  }

  fun getColorFromManifest(manifest: Manifest): Int {
    val colorString = manifest.getPrimaryColor()
    return if (colorString != null && ColorParser.isValid(colorString)) {
      Color.parseColor(colorString)
    } else {
      R.color.colorPrimary
    }
  }

  private fun getLocalKernelManifestAndAssetRequestHeaders(): ManifestAndAssetRequestHeaders = try {
    val manifestAndAssetRequestHeaders = JSONObject(ExponentBuildConstants.getBuildMachineKernelManifestAndAssetRequestHeaders())
    val manifest = manifestAndAssetRequestHeaders.getJSONObject("manifest")
    val assetRequestHeaders = manifestAndAssetRequestHeaders.getJSONObject("assetRequestHeaders")
    manifest.put(MANIFEST_IS_VERIFIED_KEY, true)
    ManifestAndAssetRequestHeaders(Manifest.fromManifestJson(manifest), assetRequestHeaders)
  } catch (e: JSONException) {
    throw RuntimeException("Can't get local manifest: $e")
  }

  private fun getEmbeddedKernelManifest(): Manifest? = try {
    val inputStream = context.assets.open(EMBEDDED_KERNEL_MANIFEST_ASSET)
    val jsonString = IOUtils.toString(inputStream)
    val manifest = JSONObject(jsonString)
    manifest.put(MANIFEST_IS_VERIFIED_KEY, true)
    Manifest.fromManifestJson(manifest)
  } catch (e: Exception) {
    KernelProvider.instance.handleError(e)
    null
  }

  fun getKernelManifestAndAssetRequestHeaders(): ManifestAndAssetRequestHeaders {
    val manifestAndAssetRequestHeaders: ManifestAndAssetRequestHeaders
    val log: String
    if (exponentSharedPreferences.shouldUseEmbeddedKernel()) {
      log = "Using embedded Expo kernel manifest"
      manifestAndAssetRequestHeaders = ManifestAndAssetRequestHeaders(getEmbeddedKernelManifest()!!, JSONObject())
    } else {
      log = "Using local Expo kernel manifest"
      manifestAndAssetRequestHeaders = getLocalKernelManifestAndAssetRequestHeaders()
    }
    if (!hasShownKernelManifestLog) {
      hasShownKernelManifestLog = true
      EXL.d(TAG, log + ": " + manifestAndAssetRequestHeaders.manifest.toString())
    }
    return manifestAndAssetRequestHeaders
  }

  companion object {
    private val TAG = ExponentManifest::class.java.simpleName

    const val MANIFEST_STRING_KEY = "manifestString"
    const val MANIFEST_SIGNATURE_KEY = "signature"
    const val MANIFEST_ID_KEY = "id"
    const val MANIFEST_NAME_KEY = "name"
    const val MANIFEST_APP_KEY_KEY = "appKey"
    const val MANIFEST_SDK_VERSION_KEY = "sdkVersion"
    const val MANIFEST_IS_VERIFIED_KEY = "isVerified"
    const val MANIFEST_ICON_URL_KEY = "iconUrl"
    const val MANIFEST_BACKGROUND_COLOR_KEY = "backgroundColor"
    const val MANIFEST_PRIMARY_COLOR_KEY = "primaryColor"
    const val MANIFEST_ORIENTATION_KEY = "orientation"
    const val MANIFEST_DEVELOPER_KEY = "developer"
    const val MANIFEST_DEVELOPER_TOOL_KEY = "tool"
    const val MANIFEST_PACKAGER_OPTS_KEY = "packagerOpts"
    const val MANIFEST_PACKAGER_OPTS_DEV_KEY = "dev"
    const val MANIFEST_BUNDLE_URL_KEY = "bundleUrl"
    const val MANIFEST_REVISION_ID_KEY = "revisionId"
    const val MANIFEST_PUBLISHED_TIME_KEY = "publishedTime"
    const val MANIFEST_COMMIT_TIME_KEY = "commitTime"
    const val MANIFEST_LOADED_FROM_CACHE_KEY = "loadedFromCache"
    const val MANIFEST_SLUG = "slug"
    const val MANIFEST_ANDROID_INFO_KEY = "android"
    const val MANIFEST_KEYBOARD_LAYOUT_MODE_KEY = "softwareKeyboardLayoutMode"

    // Statusbar
    const val MANIFEST_STATUS_BAR_KEY = "androidStatusBar"
    const val MANIFEST_STATUS_BAR_APPEARANCE = "barStyle"
    const val MANIFEST_STATUS_BAR_BACKGROUND_COLOR = "backgroundColor"
    const val MANIFEST_STATUS_BAR_HIDDEN = "hidden"
    const val MANIFEST_STATUS_BAR_TRANSLUCENT = "translucent"

    // NavigationBar
    const val MANIFEST_NAVIGATION_BAR_KEY = "androidNavigationBar"
    const val MANIFEST_NAVIGATION_BAR_VISIBLILITY = "visible"
    const val MANIFEST_NAVIGATION_BAR_APPEARANCE = "barStyle"
    const val MANIFEST_NAVIGATION_BAR_BACKGROUND_COLOR = "backgroundColor"

    // Notification
    const val MANIFEST_NOTIFICATION_INFO_KEY = "notification"
    const val MANIFEST_NOTIFICATION_ICON_URL_KEY = "iconUrl"
    const val MANIFEST_NOTIFICATION_COLOR_KEY = "color"
    const val MANIFEST_NOTIFICATION_ANDROID_MODE = "androidMode"
    const val MANIFEST_NOTIFICATION_ANDROID_COLLAPSED_TITLE = "androidCollapsedTitle"

    // Debugging
    const val MANIFEST_DEBUGGER_HOST_KEY = "debuggerHost"
    const val MANIFEST_MAIN_MODULE_NAME_KEY = "mainModuleName"

    // Splash
    const val MANIFEST_SPLASH_INFO_KEY = "splash"
    const val MANIFEST_SPLASH_IMAGE_URL_KEY = "imageUrl"
    const val MANIFEST_SPLASH_RESIZE_MODE_KEY = "resizeMode"
    const val MANIFEST_SPLASH_BACKGROUND_COLOR_KEY = "backgroundColor"

    // Updates
    const val MANIFEST_UPDATES_INFO_KEY = "updates"
    const val MANIFEST_UPDATES_TIMEOUT_KEY = "fallbackToCacheTimeout"
    const val MANIFEST_UPDATES_CHECK_AUTOMATICALLY_KEY = "checkAutomatically"
    const val MANIFEST_UPDATES_CHECK_AUTOMATICALLY_ON_LOAD = "ON_LOAD"
    const val MANIFEST_UPDATES_CHECK_AUTOMATICALLY_ON_ERROR = "ON_ERROR_RECOVERY"

    // Development client
    const val MANIFEST_DEVELOPMENT_CLIENT_KEY = "developmentClient"
    const val MANIFEST_DEVELOPMENT_CLIENT_SILENT_LAUNCH_KEY = "silentLaunch"
    const val DEEP_LINK_SEPARATOR = "--"
    const val DEEP_LINK_SEPARATOR_WITH_SLASH = "--/"
    const val QUERY_PARAM_KEY_RELEASE_CHANNEL = "release-channel"
    const val QUERY_PARAM_KEY_EXPO_UPDATES_RUNTIME_VERSION = "runtime-version"
    const val QUERY_PARAM_KEY_EXPO_UPDATES_CHANNEL_NAME = "channel-name"

    // snack
    const val QUERY_PARAM_KEY_SNACK_CHANNEL = "snack-channel"

    private const val MAX_BITMAP_SIZE = 192
    private const val REDIRECT_SNIPPET = "exp.host/--/to-exp/"
    private const val ANONYMOUS_SCOPE_KEY_PREFIX = "@anonymous/"
    private const val EMBEDDED_KERNEL_MANIFEST_ASSET = "kernel-manifest.json"
    private const val EXPONENT_SERVER_HEADER = "Exponent-Server"

    private var hasShownKernelManifestLog = false

    fun isAnonymousExperience(manifest: Manifest): Boolean {
      return try {
        manifest.getScopeKey().startsWith(ANONYMOUS_SCOPE_KEY_PREFIX)
      } catch (e: JSONException) {
        false
      }
    }

    fun httpManifestUrl(manifestUrl: String): Uri {
      return httpManifestUrlBuilder(manifestUrl).build()
    }

    private fun httpManifestUrlBuilder(manifestUrl: String): Uri.Builder {
      var realManifestUrl = manifestUrl
      if (manifestUrl.contains(REDIRECT_SNIPPET)) {
        // Redirect urls look like "https://exp.host/--/to-exp/exp%3A%2F%2Fgj-5x6.jesse.internal.exp.direct%3A80".
        // Android is crazy and catches this url with this intent filter:
        //  <data
        //    android:host="*.exp.direct"
        //    android:pathPattern=".*"
        //    android:scheme="http"/>
        //  <data
        //    android:host="*.exp.direct"
        //    android:pathPattern=".*"
        //    android:scheme="https"/>
        // so we have to add some special logic to handle that. This is than handling arbitrary HTTP 301s and 302
        realManifestUrl = Uri.decode(
          realManifestUrl.substring(
            realManifestUrl.indexOf(
              REDIRECT_SNIPPET
            ) + REDIRECT_SNIPPET.length
          )
        )
      }
      val httpManifestUrl = ExponentUrls.toHttp(realManifestUrl)
      val uri = Uri.parse(httpManifestUrl)
      var newPath = uri.path
      if (newPath == null) {
        newPath = ""
      }
      val deepLinkIndex = newPath.indexOf(DEEP_LINK_SEPARATOR_WITH_SLASH)
      if (deepLinkIndex > -1) {
        newPath = newPath.substring(0, deepLinkIndex)
      }
      return uri.buildUpon().encodedPath(newPath)
    }
  }

  init {
    val maxMemory = (Runtime.getRuntime().maxMemory() / 1024).toInt()
    // Use 1/16th of the available memory for this memory cache.
    val cacheSize = maxMemory / 16
    memoryCache = object : LruCache<String, Bitmap>(cacheSize) {
      override fun sizeOf(key: String?, bitmap: Bitmap): Int {
        return bitmap.byteCount / 1024
      }
    }
  }
}
