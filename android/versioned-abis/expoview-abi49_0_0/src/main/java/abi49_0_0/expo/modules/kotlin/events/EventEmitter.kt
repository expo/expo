package abi49_0_0.expo.modules.kotlin.events

import abi49_0_0.com.facebook.react.bridge.WritableMap
import abi49_0_0.expo.modules.kotlin.records.Record

// We want to decorate a legacy event emitter interface to support advanced conversion between types in events.
// For instance, users will be able to create `Callback<Record>` that will be converted to the `WritableMap`.
interface EventEmitter : abi49_0_0.expo.modules.core.interfaces.services.EventEmitter {
  fun emit(eventName: String, eventBody: WritableMap?)
  fun emit(eventName: String, eventBody: Record?)
  fun emit(eventName: String, eventBody: Map<*, *>?)
  fun emit(viewId: Int, eventName: String, eventBody: WritableMap?, coalescingKey: Short? = null)
}
