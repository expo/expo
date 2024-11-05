// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.expoview

import android.app.Activity
import android.app.Application
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.os.StrictMode
import android.os.StrictMode.ThreadPolicy
import android.os.UserManager
import com.facebook.common.internal.ByteStreams
import com.facebook.drawee.backends.pipeline.Fresco
import com.facebook.imagepipeline.backends.okhttp3.OkHttpImagePipelineConfigFactory
import com.facebook.imagepipeline.producers.HttpUrlConnectionNetworkFetcher
import com.facebook.react.ReactInstanceManagerBuilder
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers
import com.raizlabs.android.dbflow.config.DatabaseConfig
import com.raizlabs.android.dbflow.config.FlowConfig
import com.raizlabs.android.dbflow.config.FlowManager
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.SingletonModule
import expo.modules.kotlin.devtools.ExpoNetworkInspectOkHttpAppInterceptor
import expo.modules.kotlin.devtools.ExpoNetworkInspectOkHttpNetworkInterceptor
import expo.modules.manifests.core.Manifest
import host.exp.exponent.*
import host.exp.exponent.analytics.EXL
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.kernel.ExponentUrls
import host.exp.exponent.kernel.ExponentUrls.addHeadersFromJSONObject
import host.exp.exponent.kernel.KernelConstants
import host.exp.exponent.network.ExpoResponse
import host.exp.exponent.network.ExponentHttpClient.SafeCallback
import host.exp.exponent.network.ExponentNetwork
import host.exp.exponent.notifications.ActionDatabase
import host.exp.exponent.notifications.managers.SchedulersDatabase
import host.exp.exponent.storage.ExponentDB
import host.exp.exponent.storage.ExponentSharedPreferences
import okhttp3.*
import org.apache.commons.io.IOUtils
import org.apache.commons.io.output.ByteArrayOutputStream
import org.apache.commons.io.output.TeeOutputStream
import org.json.JSONArray
import org.json.JSONObject
import versioned.host.exp.exponent.ExponentPackageDelegate
import java.io.*
import java.net.URLEncoder
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.TimeUnit
import javax.inject.Inject

class Exponent private constructor(val context: Context, val application: Application) {
  var currentActivity: Activity? = null

  private val bundleStrings = mutableMapOf<String, String>()

  fun getBundleSource(path: String): String? {
    synchronized(bundleStrings) {
      return bundleStrings.remove(path)
    }
  }

  @Inject
  lateinit var exponentNetwork: ExponentNetwork

  @Inject
  lateinit var exponentManifest: ExponentManifest

  @Inject
  lateinit var exponentSharedPreferences: ExponentSharedPreferences

  @Inject
  lateinit var expoHandler: ExpoHandler

  fun runOnUiThread(action: Runnable) {
    if (Thread.currentThread() !== Looper.getMainLooper().thread) {
      Handler(context.mainLooper).post(action)
    } else {
      action.run()
    }
  }

  private val activityResultListeners = CopyOnWriteArrayList<ActivityResultListener>()

  data class InstanceManagerBuilderProperties(
    var application: Application?,
    var jsBundlePath: String?,
    var experienceProperties: Map<String, Any?>,
    var expoPackages: List<Package>?,
    var exponentPackageDelegate: ExponentPackageDelegate?,
    var manifest: Manifest,
    var singletonModules: List<SingletonModule>
  )

  fun addActivityResultListener(listener: ActivityResultListener) {
    activityResultListeners.add(listener)
  }

  fun removeActivityResultListener(listener: ActivityResultListener) {
    activityResultListeners.remove(listener)
  }

  fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    for (listener in activityResultListeners) {
      listener.onActivityResult(requestCode, resultCode, data)
    }
  }

  /*
   * Bundle loading
   */
  interface BundleListener {
    fun onBundleLoaded(localBundlePath: String)
    fun onError(e: Exception)
  }

  // `id` must be URL encoded. Returns true if found cached bundle.
  @JvmOverloads
  fun loadJSBundle(
    manifest: Manifest?,
    urlString: String,
    requestHeaders: JSONObject,
    id: String,
    abiVersion: String,
    bundleListener: BundleListener,
    shouldForceNetworkArg: Boolean = false,
    shouldForceCache: Boolean = false
  ): Boolean {
    var shouldForceNetwork = shouldForceNetworkArg
    val isDeveloping = manifest?.isDevelopmentMode() ?: false
    if (isDeveloping) {
      // This is important for running locally with no-dev
      shouldForceNetwork = true
    }

    // The bundle is cached in two places:
    //   1. The OkHttp cache (which lives in internal storage)
    //   2. Written to our own file (in cache dir)
    // Ideally we'd take the OkHttp response and send the InputStream directly to RN but RN doesn't
    // support that right now so we need to write the response to a file.
    // getCacheDir() doesn't work here! Some phones clean the file up in between when we check
    // file.exists() and when we feed it into React Native!
    // TODO: clean up files here!
    val fileName =
      KernelConstants.BUNDLE_FILE_PREFIX + id + urlString.hashCode().toString() + '-' + abiVersion
    val directory = File(context.filesDir, abiVersion)
    if (!directory.exists()) {
      directory.mkdir()
    }

    try {
      val requestBuilder = if (KernelConstants.KERNEL_BUNDLE_ID == id) {
        // TODO(eric): remove once home bundle is loaded normally
        ExponentUrls.addExponentHeadersToUrl(urlString).addHeadersFromJSONObject(requestHeaders)
      } else {
        Request.Builder().url(urlString).addHeadersFromJSONObject(requestHeaders)
      }
      if (shouldForceNetwork) {
        requestBuilder.cacheControl(CacheControl.FORCE_NETWORK)
      }
      val request = requestBuilder.build()

      // Use OkHttpClient with long read timeout for dev bundles
      val callback: SafeCallback = object : SafeCallback {
        override fun onFailure(e: IOException) {
          bundleListener.onError(e)
        }

        override fun onResponse(response: ExpoResponse) {
          if (!response.isSuccessful) {
            var body = "(could not render body)"
            try {
              body = response.body().string()
            } catch (e: IOException) {
              EXL.e(TAG, e)
            }
            bundleListener.onError(
              Exception(
                "Bundle return code: " + response.code() +
                  ". With body: " + body
              )
            )
            return
          }

          try {
            val sourceFile = File(directory, fileName)

            var hasCachedSourceFile = false
            val networkResponse = response.networkResponse()
            if (networkResponse == null || networkResponse.code() == KernelConstants.HTTP_NOT_MODIFIED) {
              // If we're getting a cached response don't rewrite the file to disk.
              EXL.d(TAG, "Got cached OkHttp response for $urlString")
              if (sourceFile.exists()) {
                hasCachedSourceFile = true
                EXL.d(TAG, "Have cached source file for $urlString")
              }
            }

            if (!hasCachedSourceFile) {
              var inputStream: InputStream? = null
              var fileOutputStream: FileOutputStream? = null
              var byteArrayOutputStream: ByteArrayOutputStream? = null
              var teeOutputStream: TeeOutputStream? = null
              try {
                EXL.d(TAG, "Do not have cached source file for $urlString")
                inputStream = response.body().byteStream()
                fileOutputStream = FileOutputStream(sourceFile)
                byteArrayOutputStream = ByteArrayOutputStream()

                // Multiplex the stream. Write both to file and string.
                teeOutputStream = TeeOutputStream(fileOutputStream, byteArrayOutputStream)
                ByteStreams.copy(inputStream, teeOutputStream)
                teeOutputStream.flush()
                bundleStrings[sourceFile.absolutePath] = byteArrayOutputStream.toString()
                fileOutputStream.flush()
                fileOutputStream.fd.sync()
              } finally {
                IOUtils.closeQuietly(teeOutputStream)
                IOUtils.closeQuietly(fileOutputStream)
                IOUtils.closeQuietly(byteArrayOutputStream)
                IOUtils.closeQuietly(inputStream)
              }
            }

            if (Constants.WRITE_BUNDLE_TO_LOG) {
              printSourceFile(sourceFile.absolutePath)
            }

            expoHandler.post {
              bundleListener.onBundleLoaded(sourceFile.absolutePath)
            }
          } catch (e: Exception) {
            bundleListener.onError(e)
          }
        }

        override fun onCachedResponse(response: ExpoResponse, isEmbedded: Boolean) {
          EXL.d(TAG, "Using cached or embedded response.")
          onResponse(response)
        }
      }

      exponentNetwork.longTimeoutClient.apply {
        when {
          shouldForceCache -> tryForcedCachedResponse(
            request.url.toString(),
            request,
            callback,
            null,
            null
          )
          shouldForceNetwork -> callSafe(request, callback)
          else -> callDefaultCache(request, callback)
        }
      }
    } catch (e: Exception) {
      bundleListener.onError(e)
    }

    // Guess whether we'll use the cache based on whether the source file is saved.
    val sourceFile = File(directory, fileName)
    return sourceFile.exists()
  }

  private fun printSourceFile(path: String) {
    EXL.d(KernelConstants.BUNDLE_TAG, "Printing bundle:")
    val inputStream = try {
      FileInputStream(path)
    } catch (e: Exception) {
      EXL.e(KernelConstants.BUNDLE_TAG, e.toString())
      return
    }
    inputStream.bufferedReader().useLines { lines ->
      lines.forEach { line -> EXL.d(KernelConstants.BUNDLE_TAG, line) }
    }
  }

  interface PackagerStatusCallback {
    fun onSuccess()
    fun onFailure(errorMessage: String)
  }

  fun testPackagerStatus(
    isDebug: Boolean,
    mManifest: Manifest,
    callback: PackagerStatusCallback
  ) {
    if (!isDebug) {
      callback.onSuccess()
      return
    }

    val debuggerHost = mManifest.getDebuggerHost()
    exponentNetwork.noCacheClient.newCall(
      Request.Builder().url("http://$debuggerHost/status").build()
    ).enqueue(object : Callback {
      override fun onFailure(call: Call, e: IOException) {
        EXL.d(TAG, e.toString())
        callback.onFailure("Packager is not running at http://$debuggerHost")
      }

      @Throws(IOException::class)
      override fun onResponse(call: Call, response: Response) {
        val responseString = response.body!!.string()
        if (responseString.contains(PACKAGER_RUNNING)) {
          runOnUiThread { callback.onSuccess() }
        } else {
          callback.onFailure("Packager is not running at http://$debuggerHost")
        }
      }
    })
  }

  interface StartReactInstanceDelegate {
    val isDebugModeEnabled: Boolean
    val isInForeground: Boolean
    val exponentPackageDelegate: ExponentPackageDelegate?
    fun handleUnreadNotifications(unreadNotifications: JSONArray)
  }

  companion object {
    private val TAG = Exponent::class.java.simpleName

    private const val PACKAGER_RUNNING = "running"

    @JvmStatic lateinit var instance: Exponent
      private set
    private var hasBeenInitialized = false

    @JvmStatic fun initialize(context: Context, application: Application) {
      if (!hasBeenInitialized) {
        hasBeenInitialized = true
        Exponent(context, application)
      }
    }

    @Throws(UnsupportedEncodingException::class)
    fun encodeExperienceId(manifestId: String): String {
      return URLEncoder.encode("experience-$manifestId", "UTF-8")
    }

    private fun getPort(urlArg: String): Int {
      var url = urlArg
      if (!url.contains("://")) {
        url = "http://$url"
      }
      val uri = Uri.parse(url)
      val port = uri.port
      return if (port == -1) {
        80
      } else {
        port
      }
    }

    private fun getHostname(urlArg: String): String? {
      var url = urlArg
      if (!url.contains("://")) {
        url = "http://$url"
      }
      val uri = Uri.parse(url)
      return uri.host
    }

    @JvmStatic fun enableDeveloperSupport(
      debuggerHost: String,
      mainModuleName: String,
    ) {
      if (debuggerHost.isEmpty() || mainModuleName.isEmpty()) {
        return
      }

      try {
        val debuggerHostHostname = getHostname(debuggerHost)
        val debuggerHostPort = getPort(debuggerHost)

        AndroidInfoHelpers.DEVICE_LOCALHOST = debuggerHostHostname
        AndroidInfoHelpers.GENYMOTION_LOCALHOST = debuggerHostHostname
        AndroidInfoHelpers.EMULATOR_LOCALHOST = debuggerHostHostname
        AndroidInfoHelpers.setDevServerPort(debuggerHostPort)
        AndroidInfoHelpers.setInspectorProxyPort(debuggerHostPort)
      } catch (e: IllegalAccessException) {
        e.printStackTrace()
      } catch (e: NoSuchFieldException) {
        e.printStackTrace()
      }
    }
  }

  init {
    instance = this
    NativeModuleDepsProvider.initialize(application)
    NativeModuleDepsProvider.instance.inject(Exponent::class.java, this)

    // Fixes Android memory leak
    try {
      UserManager::class.java.getMethod("get", Context::class.java).invoke(null, context)
    } catch (e: Throwable) {
      EXL.testError(e)
    }

    try {
      val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(HttpUrlConnectionNetworkFetcher.HTTP_DEFAULT_TIMEOUT.toLong(), TimeUnit.MILLISECONDS)
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .writeTimeout(0, TimeUnit.MILLISECONDS)
        .addInterceptor(ExpoNetworkInspectOkHttpAppInterceptor())
        .addNetworkInterceptor(ExpoNetworkInspectOkHttpNetworkInterceptor())
        .build()
      val imagePipelineConfig = OkHttpImagePipelineConfigFactory.newBuilder(context, okHttpClient).build()
      Fresco.initialize(context, imagePipelineConfig)
    } catch (e: RuntimeException) {
      EXL.testError(e)
    }

    // TODO: profile this
    FlowManager.init(
      FlowConfig.builder(context)
        .addDatabaseConfig(
          DatabaseConfig.builder(SchedulersDatabase::class.java)
            .databaseName(SchedulersDatabase.NAME)
            .build()
        )
        .addDatabaseConfig(
          DatabaseConfig.builder(ActionDatabase::class.java)
            .databaseName(ActionDatabase.NAME)
            .build()
        )
        .addDatabaseConfig(
          DatabaseConfig.builder(ExponentDB::class.java)
            .databaseName(ExponentDB.NAME)
            .build()
        )
        .build()
    )

    if (!ExpoViewBuildConfig.DEBUG) {
      // There are a few places in RN code that throw NetworkOnMainThreadException.
      // WebsocketJavaScriptExecutor.connectInternal closes a websocket on the main thread.
      // Shouldn't actually block the ui since it's fire and forget so not high priority to fix the root cause.
      val policy = ThreadPolicy.Builder().permitAll().build()
      StrictMode.setThreadPolicy(policy)
    }
  }
}
