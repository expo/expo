package expo.modules.kotlin.events

import android.os.Bundle
import android.view.View
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableNativeMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.facebook.react.uimanager.UIManagerHelper
import expo.modules.kotlin.ModuleHolder
import expo.modules.kotlin.jni.JNIUtils
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.JSTypeConverter
import expo.modules.kotlin.types.toJSValue
import java.lang.ref.WeakReference

/**
 * In Swift, we check if the event is supported. Otherwise, we can't send such event through the bridge.
 * However, in Kotlin this is unnecessary, but to make our API consistent, we added similar check.
 * But because of that, we had to create a wrapper for EventEmitter.
 */
class KModuleEventEmitterWrapper(
  private val moduleHolder: ModuleHolder<*>,
  legacyEventEmitter: expo.modules.core.interfaces.services.EventEmitter,
  reactContextHolder: WeakReference<ReactApplicationContext>
) : KEventEmitterWrapper(legacyEventEmitter, reactContextHolder) {
  override fun emit(eventName: String, eventBody: Bundle?) {
    checkIfEventWasExported(eventName)
    emitNative(eventName, eventBody?.toJSValue(JSTypeConverter.DefaultContainerProvider) as? ReadableNativeMap)
  }

  override fun emit(eventName: String, eventBody: WritableMap?) {
    checkIfEventWasExported(eventName)
    emitNative(eventName, eventBody as? ReadableNativeMap)
  }

  override fun emit(eventName: String, eventBody: Record?) {
    checkIfEventWasExported(eventName)
    emitNative(eventName, eventBody?.toJSValue(JSTypeConverter.DefaultContainerProvider) as? ReadableNativeMap)
  }

  override fun emit(eventName: String, eventBody: Map<*, *>?) {
    checkIfEventWasExported(eventName)
    emitNative(eventName, eventBody?.toJSValue(JSTypeConverter.DefaultContainerProvider) as? ReadableNativeMap)
  }

  private fun emitNative(eventName: String, eventBody: ReadableNativeMap?) {
    val runtimeContext = moduleHolder.module.runtimeContext
    val jsObject = moduleHolder.safeJSObject ?: return
    try {
      JNIUtils.emitEvent(jsObject, runtimeContext.jsiContext, eventName, eventBody)
    } catch (e: Exception) {
      // If the jsObject is valid, we should throw an exception.
      // Otherwise, we should ignore it.
      if (jsObject.isValid) {
        throw e
      }
    }
  }

  private fun checkIfEventWasExported(eventName: String) {
    require(
      moduleHolder
        .definition
        .eventsDefinition
        ?.names
        ?.contains(eventName) == true
    ) { "Unsupported event: $eventName." }
  }
}

open class KEventEmitterWrapper(
  private val legacyEventEmitter: expo.modules.core.interfaces.services.EventEmitter,
  private val reactContextHolder: WeakReference<ReactApplicationContext>
) : EventEmitter, expo.modules.core.interfaces.services.EventEmitter by legacyEventEmitter {
  private val deviceEventEmitter: RCTDeviceEventEmitter?
    get() = reactContextHolder
      .get()
      ?.getJSModule(RCTDeviceEventEmitter::class.java)

  override fun emit(eventName: String, eventBody: WritableMap?) {
    deviceEventEmitter
      ?.emit(eventName, eventBody)
  }

  override fun emit(eventName: String, eventBody: Record?) {
    deviceEventEmitter
      ?.emit(eventName, JSTypeConverter.legacyConvertToJSValue(eventBody))
  }

  override fun emit(eventName: String, eventBody: Map<*, *>?) {
    deviceEventEmitter
      ?.emit(eventName, JSTypeConverter.legacyConvertToJSValue(eventBody))
  }

  override fun emit(viewId: Int, eventName: String, eventBody: WritableMap?, coalescingKey: Short?) {
    val context = reactContextHolder.get() ?: return
    UIManagerHelper.getEventDispatcherForReactTag(context, viewId)
      ?.dispatchEvent(UIEvent(surfaceId = -1, viewId, eventName, eventBody, coalescingKey))
  }

  override fun emit(view: View, eventName: String, eventBody: WritableMap?, coalescingKey: Short?) {
    val context = reactContextHolder.get() ?: return
    val surfaceId = UIManagerHelper.getSurfaceId(view)
    val viewId = view.id
    UIManagerHelper.getEventDispatcherForReactTag(context, view.id)
      ?.dispatchEvent(UIEvent(surfaceId, viewId, eventName, eventBody, coalescingKey))
  }

  private class UIEvent(
    surfaceId: Int,
    viewId: Int,
    private val eventName: String,
    private val eventBody: WritableMap?,
    private val coalescingKey: Short?
  ) : com.facebook.react.uimanager.events.Event<UIEvent>(surfaceId, viewId) {
    override fun getEventName(): String = normalizeEventName(eventName)
    override fun canCoalesce(): Boolean = coalescingKey != null
    override fun getCoalescingKey(): Short = coalescingKey ?: 0
    override fun getEventData(): WritableMap = eventBody ?: Arguments.createMap()
  }
}

/**
 * On Android, event names should be explicitly "top" prefixed, especially in Fabric mode.
 * This method can help to make sure event name is in correct format.
 */
fun normalizeEventName(eventName: String): String {
  return if (eventName.startsWith("on")) {
    "top" + eventName.substring(2)
  } else {
    eventName
  }
}
