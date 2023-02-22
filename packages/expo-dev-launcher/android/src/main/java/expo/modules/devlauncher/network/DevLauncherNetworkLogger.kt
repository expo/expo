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
   * Emits CDP `Network.requestWillBeSent` event
   */
  fun emitNetworkWillBeSent(request: Request, requestId: String) {
    val now = BigDecimal(System.currentTimeMillis() / 1000.0).setScale(3, RoundingMode.CEILING)
    val params = mapOf(
      "requestId" to requestId,
      "loaderId" to "",
      "documentURL" to "mobile",
      "initiator" to mapOf("type" to "script"),
      "redirectHasExtraInfo" to false,
      "request" to mapOf(
        "url" to request.url().toString(),
        "method" to request.method(),
        "headers" to request.headers().toSingleMap(),
      ),
      "referrerPolicy" to "no-referrer",
      "type" to "Fetch",
      "timestamp" to now,
      "wallTime" to now,
    )
    val data = JSONObject(mapOf(
      "method" to "Network.requestWillBeSent",
      "params" to params,
    ))
    inspectorPackagerConnection.sendWrappedEventToAllPages(data.toString())
  }

  /**
   * Emits CDP `Network.responseReceived` and `Network.loadingFinished` events
   */
  fun emitNetworkResponse(request: Request, requestId: String, response: Response) {
    val now = BigDecimal(System.currentTimeMillis() / 1000.0).setScale(3, RoundingMode.CEILING)
    var params = mapOf(
      "requestId" to requestId,
      "loaderId" to "",
      "hasExtraInfo" to false,
      "response" to mapOf(
        "url" to request.url().toString(),
        "status" to response.code(),
        "statusText" to response.message(),
        "headers" to response.headers().toSingleMap(),
      ),
      "referrerPolicy" to "no-referrer",
      "type" to "Fetch",
      "timestamp" to now,
    )
    var data = JSONObject(mapOf(
      "method" to "Network.responseReceived",
      "params" to params,
    ))
    inspectorPackagerConnection.sendWrappedEventToAllPages(data.toString())

    params = mapOf(
      "requestId" to requestId,
      "timestamp" to now,
      "encodedDataLength" to (response.body()?.contentLength() ?: 0),
    )
    data = JSONObject(mapOf(
      "method" to "Network.loadingFinished",
      "params" to params,
    ))
    inspectorPackagerConnection.sendWrappedEventToAllPages(data.toString())
  }

  companion object {
    val instance = DevLauncherNetworkLogger()
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