// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.fetch

import android.Manifest
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.Network
import android.util.Log
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.blob.BlobModule
import com.facebook.react.modules.network.CookieJarContainer
import com.facebook.react.modules.network.ForwardingCookieHandler
import com.facebook.react.modules.network.OkHttpClientProvider
import expo.modules.core.errors.ModuleDestroyedException
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.exception.toCodedException
import expo.modules.kotlin.jni.NativeArrayBuffer
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineName
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.cancel
import okhttp3.ConnectionPool
import okhttp3.JavaNetCookieJar
import okhttp3.OkHttpClient
import java.net.URL

@Suppress("unused")
class ExpoFetchModule : Module() {
  @Volatile
  private lateinit var client: OkHttpClient
  private val cookieHandler by lazy { ForwardingCookieHandler(reactContext) }
  private val cookieJarContainer by lazy { client.cookieJar as CookieJarContainer }

  private val reactContext: ReactContext
    get() = appContext.reactContext as? ReactContext ?: throw Exceptions.ReactContextLost()

  private var connectivityManager: ConnectivityManager? = null

  private val networkCallback = object : ConnectivityManager.NetworkCallback() {
    // Registration reports the current default network. Its connections are not stale.
    private var isFirstCall = true

    override fun onAvailable(network: Network) {
      if (!isFirstCall) {
        renewConnections()
      }
      isFirstCall = false
    }
  }

  private val moduleCoroutineScope by lazy {
    CoroutineScope(
      appContext.modulesQueue.coroutineContext +
        CoroutineName("expo.modules.fetch.CoroutineScope")
    )
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoFetchModule")

    OnCreate {
      client = createClient()
      cookieJarContainer.setCookieJar(JavaNetCookieJar(cookieHandler))
      watchDefaultNetwork()
    }

    // TODO(kudo,20260706): remove this when we install expo-blob as globalThis.Blob
    AsyncFunction("unstable_createBlobData") { data: ByteArray ->
      val blobModule = reactContext.getNativeModule(BlobModule::class.java)
        ?: throw FetchBlobModuleUnavailableException()
      return@AsyncFunction blobModule.store(data)
    }

    OnDestroy {
      connectivityManager?.unregisterNetworkCallback(networkCallback)
      connectivityManager = null
      cookieHandler.destroy()
      cookieJarContainer.removeCookieJar()

      try {
        moduleCoroutineScope.cancel(ModuleDestroyedException())
      } catch (e: IllegalStateException) {
        Log.e(TAG, "The scope does not have a job in it")
      }
    }

    Class(NativeResponse::class) {
      Constructor {
        return@Constructor NativeResponse(appContext, moduleCoroutineScope)
      }

      AsyncFunction("startStreaming") { response: NativeResponse ->
        return@AsyncFunction response.startStreaming()
      }

      AsyncFunction("cancelStreaming") { response: NativeResponse, _: String ->
        response.cancelStreaming()
      }

      Property("bodyUsed") { response: NativeResponse ->
        response.bodyUsed
      }

      Property("_rawHeaders") { response: NativeResponse ->
        response.responseInit?.headers ?: emptyList()
      }

      Property("status") { response: NativeResponse ->
        response.responseInit?.status ?: -1
      }

      Property("statusText") { response: NativeResponse ->
        response.responseInit?.statusText ?: ""
      }

      Property("url") { response: NativeResponse ->
        response.responseInit?.url ?: ""
      }

      Property("redirected") { response: NativeResponse ->
        response.responseInit?.redirected ?: false
      }

      AsyncFunction("arrayBuffer") { response: NativeResponse, promise: Promise ->
        response.waitForStates(listOf(ResponseState.BODY_COMPLETED)) {
          val data = response.sink.finalize(directBuffer = true)
          promise.resolve(NativeArrayBuffer(data))
        }
      }

      AsyncFunction("text") { response: NativeResponse, promise: Promise ->
        response.waitForStates(listOf(ResponseState.BODY_COMPLETED)) {
          val data = response.sink.finalize(directBuffer = false).array()
          val text = data.toString(Charsets.UTF_8)
          promise.resolve(text)
        }
      }
    }

    Class(NativeRequest::class) {
      Constructor { response: NativeResponse ->
        return@Constructor NativeRequest(appContext, response)
      }

      AsyncFunction("start") {
          request: NativeRequest,
          url: URL,
          requestInit: NativeRequestInit,
          requestBody: ByteArray?,
          promise: Promise ->
        request.start(client, url, requestInit, requestBody)
        request.response.waitForStates(
          listOf(
            ResponseState.RESPONSE_RECEIVED,
            ResponseState.ERROR_RECEIVED
          )
        ) { state ->
          if (state == ResponseState.RESPONSE_RECEIVED) {
            promise.resolve()
          } else if (state == ResponseState.ERROR_RECEIVED) {
            promise.reject(request.response.error?.toCodedException() ?: FetchUnknownException())
          }
        }
      }

      AsyncFunction("cancel") { request: NativeRequest ->
        request.cancel()
      }
    }
  }

  private fun createClient(): OkHttpClient =
    OkHttpClientProvider.createClient(reactContext)
      .newBuilder()
      .addInterceptor(OkHttpFileUrlInterceptor(reactContext))
      .addInterceptor(TransparentCompressionInterceptor)
      .build()

  private fun watchDefaultNetwork() {
    // The app may not declare this permission; without it, there is nothing to watch.
    val granted = reactContext.checkSelfPermission(Manifest.permission.ACCESS_NETWORK_STATE)
    if (granted != PackageManager.PERMISSION_GRANTED) {
      return
    }
    val manager = reactContext.getSystemService(ConnectivityManager::class.java) ?: return
    manager.registerDefaultNetworkCallback(networkCallback)
    connectivityManager = manager
  }

  // After a network change, a pooled HTTP/2 connection can be dead without a closed socket.
  // OkHttp keeps reusing it, so new calls get a new pool. Calls in flight keep the old client.
  private fun renewConnections() {
    val oldClient = client
    client = oldClient.newBuilder().connectionPool(ConnectionPool()).build()
    oldClient.connectionPool.evictAll()
  }

  companion object {
    private val TAG = ExpoFetchModule::class.java.simpleName
  }
}
