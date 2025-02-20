// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.fetch

import android.util.Log
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.network.CookieJarContainer
import com.facebook.react.modules.network.ForwardingCookieHandler
import com.facebook.react.modules.network.OkHttpClientProvider
import expo.modules.core.errors.ModuleDestroyedException
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.exception.toCodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineName
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.cancel
import okhttp3.JavaNetCookieJar
import java.net.URL

@Suppress("unused")
class ExpoFetchModule : Module() {
  private val client by lazy {
    OkHttpClientProvider.createClient(reactContext)
      .newBuilder()
      .addInterceptor(OkHttpFileUrlInterceptor(reactContext))
      .build()
  }
  private val cookieHandler by lazy { ForwardingCookieHandler(reactContext) }
  private val cookieJarContainer by lazy { client.cookieJar as CookieJarContainer }

  private val reactContext: ReactContext
    get() = appContext.reactContext as? ReactContext ?: throw Exceptions.ReactContextLost()

  private val moduleCoroutineScope by lazy {
    CoroutineScope(
      appContext.modulesQueue.coroutineContext +
        CoroutineName("expo.modules.fetch.CoroutineScope")
    )
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoFetchModule")

    OnCreate {
      cookieJarContainer.setCookieJar(JavaNetCookieJar(cookieHandler))
    }

    OnDestroy {
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
          val data = response.sink.finalize()
          promise.resolve(data)
        }
      }

      AsyncFunction("text") { response: NativeResponse, promise: Promise ->
        response.waitForStates(listOf(ResponseState.BODY_COMPLETED)) {
          val data = response.sink.finalize()
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

  companion object {
    private val TAG = ExpoFetchModule::class.java.simpleName
  }
}
