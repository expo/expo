package expo.modules.kotlin

import com.facebook.react.bridge.ReadableArray
import expo.modules.kotlin.events.BasicEventListener
import expo.modules.kotlin.events.EventListenerWithPayload
import expo.modules.kotlin.events.EventListenerWithSenderAndPayload
import expo.modules.kotlin.events.EventName
import expo.modules.kotlin.exception.FunctionCallException
import expo.modules.kotlin.exception.MethodNotFoundException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.modules.Module

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
