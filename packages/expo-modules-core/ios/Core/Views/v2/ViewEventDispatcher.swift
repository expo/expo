// Copyright 2026-present 650 Industries. All rights reserved.

@_spi(Internal) import ExpoModulesJSI

/// Dispatches the events of one view of Expo Modules v2 to JavaScript. In `_bindEvents(to:)`, `@ViewProps` sets each
/// event prop to a closure that calls it.
///
/// The decoder binds the props that a view starts from to a new dispatcher, and the copies that later decodes make keep
/// the bound closures. The view connects to the dispatcher when it mounts the props. An event that is dispatched
/// before that, or after the view is gone, is dropped. Events can be dispatched from any thread.
public final class ViewEventDispatcher: @unchecked Sendable {
  /// The view that sends the events to JavaScript. It's `nil` before `connect(_:)` and after the view is gone.
  private let connection = Mutex(WeakViewEventEmitting())

  @usableFromInline
  internal init() {}

  /// Dispatches the event with the given name, with an empty object as the payload.
  public func dispatch(_ name: String) {
    connectedView?.dispatchEvent(name, encodePayload: nil)
  }

  /// Dispatches the event with the given name and payload. The payload is encoded later, in each runtime that reads the
  /// event, so it's `sending`, like the payload of `EventEmitter.emit`: the caller can't use it after the call.
  @inlinable
  public func dispatch<Payload: JavaScriptEncodable>(_ name: String, _ payload: sending Payload) {
    dispatch(name) { runtime in
      return try Payload.encode(payload, in: runtime)
    }
  }

  /// Dispatches the event with the payload that `encode` returns in each runtime that reads the event. Not generic, so
  /// the generic `dispatch` that each payload type specializes doesn't include it.
  @usableFromInline
  internal func dispatch(
    _ name: String,
    encode: @escaping @JavaScriptActor (JavaScriptRuntime) throws -> JavaScriptValue
  ) {
    connectedView?.dispatchEvent(name) { runtimePointer, write in
      guard let runtime = JavaScriptRuntime.for(unsafePointer: runtimePointer) else {
        log.warn("Can't send the payload of the '\(name)' event: no JavaScriptRuntime wraps the runtime of the event")
        return
      }
      let payload: JavaScriptValue? = JavaScriptActor.assumeIsolated {
        do {
          return try encode(runtime)
        } catch {
          log.warn("Can't encode the payload of the '\(name)' event, so it's an empty object: \(error)")
          return nil
        }
      }
      switch consume payload {
      case .some(let payload):
        payload.withUnsafePointee(write)
      case .none:
        break
      }
    }
  }

  /// Connects the view that sends the events. The view calls it on the main thread when it mounts props that are
  /// bound to this dispatcher.
  @usableFromInline
  internal func connect(_ view: any ViewEventEmitting) {
    connection.withLock { $0.view = view }
  }

  private var connectedView: (any ViewEventEmitting)? {
    connection.withLock { $0.view }
  }
}

private struct WeakViewEventEmitting {
  weak var view: (any ViewEventEmitting)?
}

/// Returns `Props()` with the event props bound to a new dispatcher, and the dispatcher. Without event props,
/// returns no dispatcher.
@inlinable
internal func initialViewProps<Props: AnyViewProps>(
  _ propsType: Props.Type
) -> (props: Props, events: ViewEventDispatcher?) {
  var props = Props()
  if Props._eventNames.isEmpty {
    return (props, nil)
  }
  let events = ViewEventDispatcher()
  props._bindEvents(to: events)
  return (props, events)
}
