// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.net.Uri
import android.os.AsyncTask
import android.os.Debug
import android.text.TextUtils
import android.util.Log
import android.util.LruCache
import expo.modules.updates.manifest.ManifestFactory
import expo.modules.updates.manifest.raw.InternalJSONMutator
import expo.modules.updates.manifest.raw.RawManifest
import host.exp.exponent.analytics.Analytics
import host.exp.exponent.analytics.EXL
import host.exp.exponent.exceptions.ManifestException
import host.exp.exponent.generated.ExponentBuildConstants
import host.exp.exponent.kernel.Crypto
import host.exp.exponent.kernel.ExponentUrls
import host.exp.exponent.kernel.KernelProvider
import host.exp.exponent.network.ExpoHeaders
import host.exp.exponent.network.ExpoResponse
import host.exp.exponent.network.ExponentHttpClient.SafeCallback
import host.exp.exponent.network.ExponentNetwork
import host.exp.exponent.storage.ExponentSharedPreferences
import host.exp.exponent.utils.ColorParser
import host.exp.expoview.R
import okhttp3.CacheControl
import org.apache.commons.io.IOUtils
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URI
import java.net.URISyntaxException
import java.net.URL
import java.text.DateFormat
import java.text.ParseException
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.math.max

@Singleton
class ExponentManifest @Inject constructor(
  var context: Context,
  var exponentNetwork: ExponentNetwork,
  var crypto: Crypto,
  var exponentSharedPreferences: ExponentSharedPreferences
) {
  interface ManifestListener {
    fun onCompleted(manifest: RawManifest)
    fun onError(e: Exception)
    fun onError(e: String)
  }

  interface BitmapListener {
    fun onLoadBitmap(bitmap: Bitmap?)
  }

  private val memoryCache: LruCache<String, Bitmap>

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

  @JvmOverloads
  fun fetchManifest(
    manifestUrl: String,
    listener: ManifestListener,
    shouldWriteToCache: Boolean = true
  ) {
    Analytics.markEvent(Analytics.TimedEvent.STARTED_FETCHING_MANIFEST)
    val uriBuilder = httpManifestUrlBuilder(manifestUrl)
    if (!shouldWriteToCache) {
      // add a dummy parameter so this doesn't overwrite the current cached manifest
      // more correct would be to add Cache-Control: no-store header, but this doesn't seem to
      // work correctly with requests in okhttp
      uriBuilder.appendQueryParameter("cache", "false")
    }
    val httpManifestUrl = uriBuilder.build().toString()

    // Fetch manifest
    val requestBuilder = ExponentUrls.addExponentHeadersToManifestUrl(
      httpManifestUrl,
      manifestUrl == Constants.INITIAL_URL,
      exponentSharedPreferences.sessionSecret
    ).apply {
      header("Exponent-Accept-Signature", "true")
      header("Expo-JSON-Error", "true")
      cacheControl(CacheControl.FORCE_NETWORK)
    }
    Analytics.markEvent(Analytics.TimedEvent.STARTED_MANIFEST_NETWORK_REQUEST)
    if (Constants.DEBUG_MANIFEST_METHOD_TRACING) {
      Debug.startMethodTracing("manifest")
    }
    val request = requestBuilder.build()
    val finalUri = request.url().toString()
    exponentNetwork.client.callSafe(
      request,
      object : SafeCallback {
        override fun onFailure(e: IOException) {
          listener.onError(ManifestException(e, manifestUrl))
        }

        override fun onResponse(response: ExpoResponse) {
          // OkHttp sometimes decides to use the cache anyway here
          val isCached = response.networkResponse() == null
          handleManifestResponse(response, manifestUrl, finalUri, listener, false, isCached)
        }

        override fun onCachedResponse(response: ExpoResponse, isEmbedded: Boolean) {
          // this is only called if network is unavailable for some reason
          handleManifestResponse(response, manifestUrl, finalUri, listener, isEmbedded, true)
        }
      }
    )
  }

  private fun handleManifestResponse(
    response: ExpoResponse,
    manifestUrl: String,
    httpManifestUrl: String,
    listener: ManifestListener,
    isEmbedded: Boolean,
    isCached: Boolean
  ) {
    if (!response.isSuccessful) {
      val exception: ManifestException = try {
        val errorJSON = JSONObject(response.body().string())
        ManifestException(null, manifestUrl, errorJSON)
      } catch (e: JSONException) {
        ManifestException(null, manifestUrl)
      } catch (e: IOException) {
        ManifestException(null, manifestUrl)
      }
      listener.onError(exception)
      return
    }
    try {
      val manifestString = response.body().string()
      fetchManifestStep2(
        manifestUrl,
        httpManifestUrl,
        manifestString,
        response.headers(),
        listener,
        isEmbedded,
        isCached
      )
    } catch (e: JSONException) {
      listener.onError(e)
    } catch (e: IOException) {
      listener.onError(e)
    } catch (e: URISyntaxException) {
      listener.onError(e)
    }
  }

  @Throws(JSONException::class, ParseException::class)
  private fun newerManifest(manifest1: RawManifest, manifest2: RawManifest): RawManifest {
    val manifest1Timestamp = manifest1.getSortTime()
    val manifest2Timestamp = manifest2.getSortTime()

    // SimpleDateFormat on Android does not support the ISO-8601 representation of the timezone,
    // namely, using 'Z' to represent GMT. Since all our dates here are in the same timezone,
    // and we're just comparing them relative to each other, we can just ignore this character.
    val formatter: DateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
    val manifest1Date = formatter.parse(manifest1Timestamp)
    val manifest2Date = formatter.parse(manifest2Timestamp)
    return if (manifest1Date.after(manifest2Date)) {
      manifest1
    } else {
      manifest2
    }
  }

  private fun isManifestSDKVersionValid(manifest: RawManifest): Boolean {
    val sdkVersion = manifest.getSDKVersionNullable() ?: return false
    return if (RNObject.UNVERSIONED == sdkVersion) {
      true
    } else {
      for (version in Constants.SDK_VERSIONS_LIST) {
        if (version == sdkVersion) {
          return true
        }
      }
      false
    }
  }

  @Throws(IOException::class)
  private fun extractManifest(manifestString: String): JSONObject {
    try {
      return JSONObject(manifestString)
    } catch (e: JSONException) {
      // Ignore this error, try to parse manifest as array
    }
    try {
      // the manifestString could be an array of manifest objects
      // in this case, we choose the first compatible manifest in the array
      val manifestArray = JSONArray(manifestString)
      for (i in 0 until manifestArray.length()) {
        val manifestCandidate = manifestArray.getJSONObject(i)
        val sdkVersion = manifestCandidate.getString(MANIFEST_SDK_VERSION_KEY)
        if (Constants.SDK_VERSIONS_LIST.contains(sdkVersion)) {
          return manifestCandidate
        }
      }
    } catch (e: JSONException) {
      throw IOException(
        "Manifest string is not a valid JSONObject or JSONArray: $manifestString",
        e
      )
    }
    throw IOException("No compatible manifest found. SDK Versions supported: " + Constants.SDK_VERSIONS + " Provided manifestString: " + manifestString)
  }

  @Throws(JSONException::class, URISyntaxException::class, IOException::class)
  private fun fetchManifestStep2(
    manifestUrl: String,
    httpManifestUrl: String,
    manifestString: String,
    headers: ExpoHeaders?,
    listener: ManifestListener,
    isEmbedded: Boolean,
    isCached: Boolean
  ) {
    if (Constants.DEBUG_MANIFEST_METHOD_TRACING) {
      Debug.stopMethodTracing()
    }
    if (headers != null) {
      Analytics.markEvent(Analytics.TimedEvent.FINISHED_MANIFEST_NETWORK_REQUEST)
    }
    val outerManifestJson = extractManifest(manifestString)
    val isMainShellAppExperience = manifestUrl == Constants.INITIAL_URL
    val parsedManifestUrl = URI(manifestUrl)
    val isManifestSigned = outerManifestJson.has(MANIFEST_STRING_KEY) && outerManifestJson.has(
      MANIFEST_SIGNATURE_KEY
    )
    var manifestJson = outerManifestJson
    if (isManifestSigned) {
      // get inner manifest if manifest is wrapped in signature
      manifestJson = JSONObject(outerManifestJson.getString(MANIFEST_STRING_KEY))
    }
    var manifest = ManifestFactory.getRawManifestFromJson(
      manifestJson
    )

    // if the manifest we are passed is from the cache, we need to get the embedded manifest so that
    // we can compare them in case embedded manifest is newer (i.e. user has installed a new APK)
    var isUsingEmbeddedManifest = isEmbedded
    if (!isEmbedded && isCached) {
      val embeddedResponse = exponentNetwork.client.getHardCodedResponse(httpManifestUrl)
      if (embeddedResponse != null) {
        try {
          val embeddedManifest = ManifestFactory.getRawManifestFromJson(JSONObject(embeddedResponse))
          manifest = if (!isManifestSDKVersionValid(manifest)) {
            // if we somehow try to load a cached manifest with an invalid SDK version,
            // fall back immediately to the embedded manifest, which should never have an
            // invalid SDK version.
            embeddedManifest
          } else {
            newerManifest(embeddedManifest, manifest)
          }
          isUsingEmbeddedManifest = embeddedManifest === manifest
        } catch (e: Exception) {
          EXL.e(TAG, e)
        }
      }
    }
    val isUsingEmbeddedManifestFinal = isUsingEmbeddedManifest
    manifest.mutateInternalJSONInPlace(object : InternalJSONMutator {
      override fun updateJSON(json: JSONObject) {
        json.put(
          MANIFEST_LOADED_FROM_CACHE_KEY, isCached || isUsingEmbeddedManifestFinal
        )
      }
    })
    if (isManifestSigned) {
      val isOffline = !ExponentNetwork.isNetworkAvailable(context)
      if (isAnonymousExperience(manifest) || isMainShellAppExperience || isUsingEmbeddedManifest) {
        // Automatically verified.
        fetchManifestStep3(manifest, true, listener)
      } else {
        val finalManifest = manifest
        crypto.verifyPublicRSASignature(
          Constants.API_HOST + "/--/manifest-public-key",
          outerManifestJson.getString(MANIFEST_STRING_KEY),
          outerManifestJson.getString(
            MANIFEST_SIGNATURE_KEY
          ),
          object : Crypto.RSASignatureListener {
            override fun onError(errorMessage: String?, isNetworkError: Boolean) {
              if (isOffline && isNetworkError) {
                // automatically validate if offline and don't have public key
                // TODO: we need to evict manifest from the cache if it doesn't pass validation when online
                fetchManifestStep3(finalManifest, true, listener)
              } else {
                Log.w(TAG, errorMessage!!)
                fetchManifestStep3(finalManifest, false, listener)
              }
            }

            override fun onCompleted(isValid: Boolean) {
              fetchManifestStep3(finalManifest, isValid, listener)
            }
          }
        )
      }
    } else {
      // if we're using a cached manifest that's stored without the signature, we can assume
      // we've already verified it previously
      if (isCached || isUsingEmbeddedManifest || isMainShellAppExperience) {
        fetchManifestStep3(manifest, true, listener)
      } else if (isThirdPartyHosted(parsedManifestUrl)) {
        // Sandbox third party apps and consider them verified
        // for https urls, sandboxed id is of form quinlanj.github.io/myProj-myApp
        // for http urls, sandboxed id is of form UNVERIFIED-quinlanj.github.io/myProj-myApp
        if (!Constants.isStandaloneApp()) {
          val protocol = parsedManifestUrl.scheme
          val securityPrefix = if (protocol == "https" || protocol == "exps") "" else "UNVERIFIED-"
          val path = if (parsedManifestUrl.path != null) parsedManifestUrl.path else ""
          val slug = if (manifest.getSlug() != null) manifest.getSlug() else ""
          val sandboxedId = securityPrefix + parsedManifestUrl.host + path + "-" + slug
          manifest.mutateInternalJSONInPlace(object : InternalJSONMutator {
            override fun updateJSON(json: JSONObject) {
              json.put(
                MANIFEST_ID_KEY, sandboxedId
              )
            }
          })
        }
        fetchManifestStep3(manifest, true, listener)
      } else {
        fetchManifestStep3(manifest, false, listener)
      }
    }
    if (headers != null) {
      val exponentServerHeader = headers[EXPONENT_SERVER_HEADER]
      if (exponentServerHeader != null) {
        try {
          val eventProperties = JSONObject(exponentServerHeader)
          Analytics.logEvent(Analytics.AnalyticsEvent.LOAD_DEVELOPER_MANIFEST, eventProperties)
        } catch (e: Throwable) {
          EXL.e(TAG, e)
        }
      }
    }
  }

  private fun isThirdPartyHosted(uri: URI): Boolean {
    val host = uri.host
    val isExpoHost =
      host == "exp.host" || host == "expo.io" || host == "exp.direct" || host == "expo.test" ||
        host.endsWith(".exp.host") || host.endsWith(".expo.io") || host.endsWith(".exp.direct") || host.endsWith(
        ".expo.test"
      )
    return !isExpoHost
  }

  private fun fetchManifestStep3(
    manifest: RawManifest,
    isVerified: Boolean,
    listener: ManifestListener
  ) {
    try {
      manifest.getBundleURL()
    } catch (e: JSONException) {
      listener.onError("No bundleUrl in manifest")
      return
    }
    try {
      manifest.mutateInternalJSONInPlace(object : InternalJSONMutator {
        override fun updateJSON(json: JSONObject) {
          json.put(
            MANIFEST_IS_VERIFIED_KEY, isVerified
          )
        }
      })
    } catch (e: JSONException) {
      listener.onError(e)
      return
    }
    listener.onCompleted(manifest)
  }

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
    } else memoryCache[iconUrl]
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

  fun getColorFromManifest(manifest: RawManifest): Int {
    val colorString = manifest.getPrimaryColor()
    return if (colorString != null && ColorParser.isValid(colorString)) {
      Color.parseColor(colorString)
    } else {
      R.color.colorPrimary
    }
  }

  fun isAnonymousExperience(manifest: RawManifest): Boolean {
    return try {
      val id = manifest.getLegacyID()
      id.startsWith(ANONYMOUS_EXPERIENCE_PREFIX)
    } catch (e: JSONException) {
      false
    }
  }

  private fun getLocalKernelManifest(): RawManifest = try {
    val manifest = JSONObject(ExponentBuildConstants.BUILD_MACHINE_KERNEL_MANIFEST)
    manifest.put(MANIFEST_IS_VERIFIED_KEY, true)
    ManifestFactory.getRawManifestFromJson(manifest)
  } catch (e: JSONException) {
    throw RuntimeException("Can't get local manifest: $e")
  }

  private fun getRemoteKernelManifest(): RawManifest? = try {
    val inputStream = context.assets.open(EMBEDDED_KERNEL_MANIFEST_ASSET)
    val jsonString = IOUtils.toString(inputStream)
    val manifest = JSONObject(jsonString)
    manifest.put(MANIFEST_IS_VERIFIED_KEY, true)
    ManifestFactory.getRawManifestFromJson(manifest)
  } catch (e: Exception) {
    KernelProvider.instance.handleError(e)
    null
  }

  fun getKernelManifest(): RawManifest {
    val manifest: RawManifest?
    val log: String
    if (exponentSharedPreferences.shouldUseInternetKernel()) {
      log = "Using remote Expo kernel manifest"
      manifest = getRemoteKernelManifest()
    } else {
      log = "Using local Expo kernel manifest"
      manifest = getLocalKernelManifest()
    }
    if (!hasShownKernelManifestLog) {
      hasShownKernelManifestLog = true
      EXL.d(TAG, log + ": " + manifest.toString())
    }
    return manifest!!
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

    private const val MAX_BITMAP_SIZE = 192
    private const val REDIRECT_SNIPPET = "exp.host/--/to-exp/"
    private const val ANONYMOUS_EXPERIENCE_PREFIX = "@anonymous/"
    private const val EMBEDDED_KERNEL_MANIFEST_ASSET = "kernel-manifest.json"
    private const val EXPONENT_SERVER_HEADER = "Exponent-Server"

    private var hasShownKernelManifestLog = false

    @Throws(JSONException::class)
    fun normalizeRawManifestInPlace(rawManifest: RawManifest, manifestUrl: String) {
      rawManifest.mutateInternalJSONInPlace(object : InternalJSONMutator {
        override fun updateJSON(json: JSONObject) {
          if (!json.has(MANIFEST_ID_KEY)) {
            json.put(MANIFEST_ID_KEY, manifestUrl)
          }
          if (!json.has(MANIFEST_NAME_KEY)) {
            json.put(MANIFEST_NAME_KEY, "My New Experience")
          }
          if (!json.has(MANIFEST_PRIMARY_COLOR_KEY)) {
            json.put(MANIFEST_PRIMARY_COLOR_KEY, "#023C69")
          }
          if (!json.has(MANIFEST_ICON_URL_KEY)) {
            json.put(
              MANIFEST_ICON_URL_KEY,
              "https://d3lwq5rlu14cro.cloudfront.net/ExponentEmptyManifest_192.png"
            )
          }
          if (!json.has(MANIFEST_ORIENTATION_KEY)) {
            json.put(MANIFEST_ORIENTATION_KEY, "default")
          }
        }
      })
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
