// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.kotlin.devtools

import expo.modules.kotlin.devtools.cdp.Event
import expo.modules.kotlin.devtools.cdp.ExpoReceivedResponseBodyParams
import expo.modules.kotlin.devtools.cdp.LoadingFinishedParams
import expo.modules.kotlin.devtools.cdp.RequestWillBeSentExtraInfoParams
import expo.modules.kotlin.devtools.cdp.RequestWillBeSentParams
import expo.modules.kotlin.devtools.cdp.ResponseReceivedParams
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.Request
import okhttp3.Response
import okhttp3.ResponseBody
import java.lang.ref.WeakReference
import java.math.BigDecimal
import java.math.RoundingMode

/**
 * The `ExpoRequestInterceptorProtocolDelegate` implementation to
 * dispatch CDP (Chrome DevTools Protocol: https://chromedevtools.github.io/devtools-protocol/) events.
 */
object ExpoRequestCdpInterceptor : ExpoNetworkInspectOkHttpInterceptorsDelegate {
  private var delegate: WeakReference<Delegate?> = WeakReference(null)
  internal var coroutineScope = CoroutineScope(Dispatchers.Default)

  fun setDelegate(delegate: Delegate?) {
    coroutineScope.launch {
      this@ExpoRequestCdpInterceptor.delegate = WeakReference(delegate)
    }
  }

  private fun dispatchEvent(event: Event) {
    coroutineScope.launch {
      this@ExpoRequestCdpInterceptor.delegate.get()?.dispatch(event.toJson())
    }
  }

  //region ExpoNetworkInspectOkHttpInterceptorsDelegate implementations

  override fun willSendRequest(
    requestId: String,
    request: Request,
    redirectResponse: Response?
  ) {
    val now = BigDecimal(System.currentTimeMillis() / 1000.0).setScale(3, RoundingMode.CEILING)

    val params = RequestWillBeSentParams(now, requestId, request, redirectResponse)
    dispatchEvent(Event("Network.requestWillBeSent", params))

    val params2 = RequestWillBeSentExtraInfoParams(now, requestId, request)
    dispatchEvent(Event("Network.requestWillBeSentExtraInfo", params2))
  }

  override fun didReceiveResponse(
    requestId: String,
    request: Request,
    response: Response,
    body: ResponseBody?
  ) {
    val now = BigDecimal(System.currentTimeMillis() / 1000.0).setScale(3, RoundingMode.CEILING)

    val params = ResponseReceivedParams(now, requestId, response)
    dispatchEvent(Event("Network.responseReceived", params))

    if (body != null) {
      val params2 = ExpoReceivedResponseBodyParams(requestId, body)
      dispatchEvent(Event("Expo(Network.receivedResponseBody)", params2))
    }

    val params3 = LoadingFinishedParams(now, requestId, response)
    dispatchEvent(Event("Network.loadingFinished", params3))
  }

  //endregion ExpoNetworkInspectOkHttpInterceptorsDelegate implementations

  interface Delegate {
    fun dispatch(event: String)
  }
}
