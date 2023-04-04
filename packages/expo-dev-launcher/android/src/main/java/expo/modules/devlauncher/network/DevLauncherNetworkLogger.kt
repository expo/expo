package expo.modules.devlauncher.network

import androidx.collection.ArrayMap
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.Inspector
import com.facebook.react.common.LifecycleState
import com.facebook.react.devsupport.DevServerHelper
import com.facebook.react.devsupport.InspectorPackagerConnection
import expo.modules.devlauncher.DevLauncherController
import okhttp3.Headers
import okhttp3.Request
import okhttp3.Response
import okio.Buffer
import org.json.JSONObject
import java.lang.ref.WeakReference
import java.lang.reflect.Field
import java.lang.reflect.Method
import java.math.BigDecimal
import java.math.RoundingMode

class DevLauncherNetworkLogger private constructor() {
  private var reactInstanceHashCode: Int = 0
  private var _inspectorPackagerConnection: InspectorPackagerConnectionWrapper? = null

  private val inspectorPackagerConnection: InspectorPackagerConnectionWrapper
    get() {
      val reactInstanceManager = DevLauncherController.instance.appHost.reactInstanceManager
      if (reactInstanceHashCode != reactInstanceManager.hashCode()) {
        _inspectorPackagerConnection?.clear()
        _inspectorPackagerConnection = null
        reactInstanceHashCode = 0
      }
      if (_inspectorPackagerConnection == null) {
        _inspectorPackagerConnection = InspectorPackagerConnectionWrapper(reactInstanceManager)
        reactInstanceHashCode = reactInstanceManager.hashCode()
      }
      return requireNotNull(_inspectorPackagerConnection)
    }

  /**
   * Returns true when it is allowed to send CDP events
   */
  fun shouldEmitEvents(): Boolean {
    return DevLauncherController.wasInitialized() && DevLauncherController.instance.appHost.reactInstanceManager.lifecycleState == LifecycleState.RESUMED
  }

  /**
   * Emits CDP `Network.requestWillBeSent` and `Network.requestWillBeSentExtraInfo` events
   */
  fun emitNetworkWillBeSent(request: Request, requestId: String, redirectResponse: Response?) {
    val now = BigDecimal(System.currentTimeMillis() / 1000.0).setScale(3, RoundingMode.CEILING)
    val requestParams = buildMap<String, Any> {
      put("url", request.url().toString())
      put("method", request.method())
      put("headers", request.headers().toSingleMap())
      val body = request.body()
      if (body != null && body.contentLength() < MAX_BODY_SIZE) {
        val buffer = Buffer()
        body.writeTo(buffer)
        put("postData", buffer.readUtf8(buffer.size.coerceAtMost(MAX_BODY_SIZE)))
      }
    }
    val requestWillBeSentParams = buildMap<String, Any> {
      put("requestId", requestId)
      put("loaderId", "")
      put("documentURL", "mobile")
      put("initiator", mapOf("type" to "script"))
      put("redirectHasExtraInfo", redirectResponse != null)
      put("request", requestParams)
      put("referrerPolicy", "no-referrer")
      put("type", "Fetch")
      put("timestamp", now)
      put("wallTime", now)
      if (redirectResponse != null) {
        put("redirectResponse", mapOf(
          "url" to redirectResponse.request().url().toString(),
          "status" to redirectResponse.code(),
          "statusText" to redirectResponse.message(),
          "headers" to redirectResponse.headers().toSingleMap(),
        ))
      }
    }
    val requestWillBeSentData = JSONObject(mapOf(
      "method" to "Network.requestWillBeSent",
      "params" to requestWillBeSentParams,
    ))
    inspectorPackagerConnection.sendWrappedEventToAllPages(requestWillBeSentData.toString())

    val extraInfoParams = mapOf(
      "requestId" to requestId,
      "associatedCookies" to emptyList<Void>(),
      "headers" to request.headers().toSingleMap(),
      "connectTiming" to mapOf(
        "requestTime" to now,
      ),
    )
    val extraInfoData = JSONObject(mapOf(
      "method" to "Network.requestWillBeSentExtraInfo",
      "params" to extraInfoParams
    ))
    inspectorPackagerConnection.sendWrappedEventToAllPages(extraInfoData.toString())
  }

  /**
   * Emits CDP `Network.responseReceived` and `Network.loadingFinished` events
   */
  fun emitNetworkResponse(request: Request, requestId: String, response: Response) {
    val now = BigDecimal(System.currentTimeMillis() / 1000.0).setScale(3, RoundingMode.CEILING)
    val responseReceivedParams = mapOf(
      "requestId" to requestId,
      "loaderId" to "",
      "hasExtraInfo" to false,
      "response" to mapOf(
        "url" to request.url().toString(),
        "status" to response.code(),
        "statusText" to response.message(),
        "headers" to response.headers().toSingleMap(),
        "mimeType" to response.header("Content-Type", ""),
      ),
      "referrerPolicy" to "no-referrer",
      "type" to "Fetch",
      "timestamp" to now,
    )
    val responseReceivedData = JSONObject(mapOf(
      "method" to "Network.responseReceived",
      "params" to responseReceivedParams,
    ))
    inspectorPackagerConnection.sendWrappedEventToAllPages(responseReceivedData.toString())

    val loadingFinishedParams = mapOf(
      "requestId" to requestId,
      "timestamp" to now,
      "encodedDataLength" to (response.body()?.contentLength() ?: 0),
    )
    val loadingFinishedData = JSONObject(mapOf(
      "method" to "Network.loadingFinished",
      "params" to loadingFinishedParams,
    ))
    inspectorPackagerConnection.sendWrappedEventToAllPages(loadingFinishedData.toString())
  }

  /**
   * Emits our custom `Expo(Network.receivedResponseBody)` event
   */
  fun emitNetworkDidReceiveBody(requestId: String, response: Response) {
    val contentLength = response.body()?.contentLength() ?: 0
    if (contentLength <= 0 || contentLength > MAX_BODY_SIZE) {
      return
    }
    val body = response.peekBody(MAX_BODY_SIZE)
    val contentType = body.contentType()
    val isText = contentType?.type() == "text" || (contentType?.type() == "application" && contentType?.subtype() == "json")
    val bodyString = if (isText) body.string() else body.source().readByteString().base64()
    val params = mapOf(
      "requestId" to requestId,
      "body" to bodyString,
      "base64Encoded" to !isText,
    )
    val data = JSONObject(mapOf(
      "method" to "Expo(Network.receivedResponseBody)",
      "params" to params,
    ))
    inspectorPackagerConnection.sendWrappedEventToAllPages(data.toString())
  }

  companion object {
    val instance = DevLauncherNetworkLogger()
    private const val MAX_BODY_SIZE = 1048576L
  }
}

/**
 * A `InspectorPackagerConnection` wrapper to expose private members with reflection
 */
internal class InspectorPackagerConnectionWrapper constructor(reactInstanceManager: ReactInstanceManager) {
  private var inspectorPackagerConnectionWeak: WeakReference<InspectorPackagerConnection> = WeakReference(null)
  private val devServerHelperWeak: WeakReference<DevServerHelper>
  private val inspectorPackagerConnectionField: Field
  private val sendWrappedEventMethod: Method

  private val inspectorPackagerConnection: InspectorPackagerConnection?
    get() {
      var inspectorPackagerConnection = inspectorPackagerConnectionWeak.get()
      if (inspectorPackagerConnection == null) {
        val devServerHelper = devServerHelperWeak.get() ?: return null
        inspectorPackagerConnection = inspectorPackagerConnectionField[devServerHelper] as? InspectorPackagerConnection

        if (inspectorPackagerConnection != null) {
          inspectorPackagerConnectionWeak = WeakReference(inspectorPackagerConnection)
        }
      }
      return inspectorPackagerConnection
    }

  init {
    val devSupportManager = reactInstanceManager.devSupportManager
    val devSupportManagerBaseClass: Class<*> = devSupportManager.javaClass.superclass
    val mDevServerHelperField = devSupportManagerBaseClass.getDeclaredField("mDevServerHelper")
    mDevServerHelperField.isAccessible = true
    val devServerHelper = mDevServerHelperField[devSupportManager]
    devServerHelperWeak = WeakReference(devServerHelper as DevServerHelper)

    inspectorPackagerConnectionField = DevServerHelper::class.java.getDeclaredField("mInspectorPackagerConnection")
    inspectorPackagerConnectionField.isAccessible = true

    sendWrappedEventMethod = InspectorPackagerConnection::class.java.getDeclaredMethod("sendWrappedEvent", String::class.java, String::class.java)
    sendWrappedEventMethod.isAccessible = true
  }

  fun clear() {
    inspectorPackagerConnectionWeak.clear()
  }

  fun sendWrappedEventToAllPages(event: String) {
    val inspectorPackagerConnection = this.inspectorPackagerConnection ?: return
    for (page in Inspector.getPages()) {
      sendWrappedEventMethod.invoke(inspectorPackagerConnection, page.id.toString(), event)
    }
  }
}

/**
 * OkHttp `Headers` extension method to generate a simple key-value map
 * which only exposing single value for a key.
 */
fun Headers.toSingleMap(): Map<String, String> {
  val result = ArrayMap<String, String>()
  for (key in names()) {
    result[key] = get(key)
  }
  return result
}
