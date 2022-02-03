package abi44_0_0.expo.modules.kotlin

import abi44_0_0.com.facebook.react.bridge.ReadableArray
import abi44_0_0.expo.modules.core.utilities.ifNull
import abi44_0_0.expo.modules.kotlin.events.BasicEventListener
import abi44_0_0.expo.modules.kotlin.events.EventListenerWithPayload
import abi44_0_0.expo.modules.kotlin.events.EventListenerWithSenderAndPayload
import abi44_0_0.expo.modules.kotlin.events.EventName
import abi44_0_0.expo.modules.kotlin.exception.MethodNotFoundException
import abi44_0_0.expo.modules.kotlin.modules.Module

class ModuleHolder(val module: Module) {
  val definition = module.definition()
  val name get() = definition.name

  fun call(methodName: String, args: ReadableArray, promise: Promise) {
    val method = definition.methods[methodName].ifNull {
      promise.reject(MethodNotFoundException(methodName, definition.name))
      return
    }

    method.call(args, promise)
  }

  fun post(eventName: EventName) {
    val listener = definition.eventListeners[eventName] ?: return
    (listener as? BasicEventListener)?.call()
  }

  @Suppress("UNCHECKED_CAST")
  fun <Payload> post(eventName: EventName, payload: Payload) {
    val listener = definition.eventListeners[eventName] ?: return
    (listener as? EventListenerWithPayload<Payload>)?.call(payload)
  }

  @Suppress("UNCHECKED_CAST")
  fun <Sender, Payload> post(eventName: EventName, sender: Sender, payload: Payload) {
    val listener = definition.eventListeners[eventName] ?: return
    (listener as? EventListenerWithSenderAndPayload<Sender, Payload>)?.call(sender, payload)
  }
}
