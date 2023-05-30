// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.kotlin.networks

import expo.modules.kotlin.networks.cdp.Event
import expo.modules.kotlin.networks.cdp.ExpoReceivedResponseBodyParams
import expo.modules.kotlin.networks.cdp.LoadingFinishedParams
import expo.modules.kotlin.networks.cdp.RequestWillBeSentExtraInfoParams
import expo.modules.kotlin.networks.cdp.RequestWillBeSentParams
import expo.modules.kotlin.networks.cdp.ResponseReceivedParams
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import okhttp3.Request
import okhttp3.Response
import java.math.BigDecimal
import java.math.RoundingMode

/**
 * The `ExpoNetworkInterceptorProtocolDelegate` implementation to dispatch CDP (Chrome DevTools Protocol) events
 */
object ExpoRequestCdpLogger : ExpoRequestLoggerOkHttpInterceptorsDelegate {
  private var delegate: Delegate? = null

  internal var dispatcher: CoroutineDispatcher = Dispatchers.Default

  fun setDelegate(delegate: Delegate?) {
    runBlocking {
      withContext(dispatcher) {
        this@ExpoRequestCdpLogger.delegate = delegate
      }
    }
  }

  private fun dispatchEvent(event: Event) {
    runBlocking {
      launch(dispatcher) {
        this@ExpoRequestCdpLogger.delegate?.dispatch(event.toJson())
      }
    }
  }

  //region ExpoRequestLoggerOkHttpInterceptorsDelegate implementations

  override fun willSendRequest(requestId: String, request: Request, redirectResponse: Response?) {
    val now = BigDecimal(System.currentTimeMillis() / 1000.0).setScale(3, RoundingMode.CEILING)

    val params = RequestWillBeSentParams(now, requestId, request, redirectResponse)
    dispatchEvent(Event("Network.requestWillBeSent", params))

    val params2 = RequestWillBeSentExtraInfoParams(now, requestId, request)
    dispatchEvent(Event("Network.requestWillBeSentExtraInfo", params2))
  }

  override fun didReceiveResponse(requestId: String, request: Request, response: Response) {
    val now = BigDecimal(System.currentTimeMillis() / 1000.0).setScale(3, RoundingMode.CEILING)

    val params = ResponseReceivedParams(now, requestId, request, response)
    dispatchEvent(Event("Network.responseReceived", params))

    val params2 = LoadingFinishedParams(now, requestId, request, response)
    dispatchEvent(Event("Network.loadingFinished", params2))

    val contentLength = response.body?.contentLength() ?: 0
    if (contentLength >= 0 && contentLength <= ExpoRequestLoggerOkHttpNetworkInterceptor.MAX_BODY_SIZE) {
      val params3 = ExpoReceivedResponseBodyParams(now, requestId, request, response)
      dispatchEvent(Event("Expo(Network.receivedResponseBody)", params3))
    }
  }

  //endregion ExpoRequestLoggerOkHttpInterceptorsDelegate implementations

  interface Delegate {
    fun dispatch(event: String)
  }
}
