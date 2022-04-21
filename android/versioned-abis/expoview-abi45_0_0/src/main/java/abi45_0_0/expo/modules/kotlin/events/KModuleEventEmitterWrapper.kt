package abi45_0_0.expo.modules.kotlin.events

import android.os.Bundle
import abi45_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi45_0_0.com.facebook.react.bridge.WritableMap
import abi45_0_0.com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import abi45_0_0.com.facebook.react.uimanager.UIManagerModule
import abi45_0_0.com.facebook.react.uimanager.events.EventDispatcher
import abi45_0_0.com.facebook.react.uimanager.events.RCTEventEmitter
import abi45_0_0.expo.modules.kotlin.ModuleHolder
import abi45_0_0.expo.modules.kotlin.records.Record
import abi45_0_0.expo.modules.kotlin.types.JSTypeConverter
import java.lang.ref.WeakReference

/**
 * In Swift, we check if the event is supported. Otherwise, we can't send such event through the bridge.
 * However, in Kotlin this is unnecessary, but to make our API consistent, we added similar check.
 * But because of that, we had to create a wrapper for EventEmitter.
 */
class KModuleEventEmitterWrapper(
  private val moduleHolder: ModuleHolder,
  legacyEventEmitter: abi45_0_0.expo.modules.core.interfaces.services.EventEmitter,
  reactContextHolder: WeakReference<ReactApplicationContext>
) : KEventEmitterWrapper(legacyEventEmitter, reactContextHolder) {
  override fun emit(eventName: String, eventBody: Bundle?) {
    checkIfEventWasExported(eventName)
    super.emit(eventName, eventBody)
  }

  override fun emit(eventName: String, eventBody: WritableMap?) {
    checkIfEventWasExported(eventName)
    super.emit(eventName, eventBody)
  }

  override fun emit(eventName: String, eventBody: Record?) {
    checkIfEventWasExported(eventName)
    super.emit(eventName, eventBody)
  }

  override fun emit(eventName: String, eventBody: Map<*, *>?) {
    checkIfEventWasExported(eventName)
    super.emit(eventName, eventBody)
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
  private val legacyEventEmitter: abi45_0_0.expo.modules.core.interfaces.services.EventEmitter,
  private val reactContextHolder: WeakReference<ReactApplicationContext>
) : EventEmitter, abi45_0_0.expo.modules.core.interfaces.services.EventEmitter by legacyEventEmitter {
  private val deviceEventEmitter: RCTDeviceEventEmitter?
    get() = reactContextHolder
      .get()
      ?.getJSModule(RCTDeviceEventEmitter::class.java)

  private val uiEventDispatcher: EventDispatcher?
    get() = reactContextHolder
      .get()
      ?.getNativeModule(UIManagerModule::class.java)
      ?.eventDispatcher

  override fun emit(eventName: String, eventBody: WritableMap?) {
    deviceEventEmitter
      ?.emit(eventName, eventBody)
  }
  override fun emit(eventName: String, eventBody: Record?) {
    deviceEventEmitter
      ?.emit(eventName, JSTypeConverter.convertToJSValue(eventBody))
  }

  override fun emit(eventName: String, eventBody: Map<*, *>?) {
    deviceEventEmitter
      ?.emit(eventName, JSTypeConverter.convertToJSValue(eventBody))
  }

  override fun emit(viewId: Int, eventName: String, eventBody: WritableMap?) {
    uiEventDispatcher
      ?.dispatchEvent(UIEvent(viewId, eventName, eventBody))
  }

  private class UIEvent(
    private val viewId: Int,
    private val eventName: String,
    private val eventBody: WritableMap?
  ) : abi45_0_0.com.facebook.react.uimanager.events.Event<UIEvent>(viewId) {
    override fun getEventName(): String = eventName
    override fun canCoalesce(): Boolean = false
    override fun getCoalescingKey(): Short = 0
    override fun dispatch(rctEventEmitter: RCTEventEmitter) {
      rctEventEmitter.receiveEvent(viewId, eventName, eventBody)
    }
  }
}
