package abi45_0_0.expo.modules.kotlin

import abi45_0_0.com.facebook.react.bridge.ReadableArray
import abi45_0_0.expo.modules.kotlin.events.BasicEventListener
import abi45_0_0.expo.modules.kotlin.events.EventListenerWithPayload
import abi45_0_0.expo.modules.kotlin.events.EventListenerWithSenderAndPayload
import abi45_0_0.expo.modules.kotlin.events.EventName
import abi45_0_0.expo.modules.kotlin.exception.FunctionCallException
import abi45_0_0.expo.modules.kotlin.exception.MethodNotFoundException
import abi45_0_0.expo.modules.kotlin.exception.exceptionDecorator
import abi45_0_0.expo.modules.kotlin.modules.Module

class ModuleHolder(val module: Module) {
  val definition = module.definition()
  val name get() = definition.name

  fun call(methodName: String, args: ReadableArray, promise: Promise) = exceptionDecorator({
    FunctionCallException(methodName, definition.name, it)
  }) {
    val method = definition.methods[methodName]
      ?: throw MethodNotFoundException()

    method.call(this, args, promise)
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

  fun cleanUp() {
    module.cleanUp()
  }
}
