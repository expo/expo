// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

@testable import ExpoModulesCore

@Record
private struct MoveEvent {
  var x: Double = 0
  var y: Double = 0
}

@ViewProps
private struct TapProps {
  var title = "Untitled"
  var onTap: () -> Void
  var onMove: (MoveEvent) -> Void
}

@ViewProps
private struct NoEventsProps {
  var title = "Untitled"
}

/// Records the events in place of Fabric's event emitter.
@ExpoView<TapProps>
private final class RecordingTapView: ExpoNativeView {
  nonisolated(unsafe) var events: [(name: String, encodePayload: ViewEventPayloadEncoder?)] = []

  nonisolated override func dispatchEvent(_ name: String, encodePayload: ViewEventPayloadEncoder?) {
    events.append((name, encodePayload))
  }

  /// Applies decoded props the way `ExpoNativeViewObjC` does in `finalizeUpdates:`, as an unretained pointer.
  func update(_ decodedProps: AnyObject?) {
    withExtendedLifetime(decodedProps) {
      updateDecodedProps(decodedProps.map { UnsafeRawPointer(Unmanaged.passUnretained($0).toOpaque()) })
    }
  }
}

/// Binds the event props of decoded props and dispatches the events through the view that mounts them.
@Suite
@MainActor
struct ViewEventDispatcherTests {
  let runtime = JavaScriptRuntime()
  private let view = RecordingTapView(frame: .zero)

  private func decode<Props: AnyViewProps>(
    _ source: String,
    previous: DecodedViewProps<Props>? = nil
  ) throws -> DecodedViewProps<Props>? {
    let decoder = ViewPropsDecoder<Props>(viewName: "TapView")
    let runtime = runtime
    return try JavaScriptActor.assumeIsolated {
      let props = try runtime.eval("(\(source))")
      return runtime.withUnsafePointee { runtimePointer in
        props.withUnsafePointee { propsPointer in
          decoder.decode(propsPointer: propsPointer, runtimePointer: runtimePointer, previous: previous)
        }
      }
    }
  }

  /// Runs the encoder of a recorded event like the event emitter does on the JavaScript thread, and returns the
  /// payload as JSON.
  private func payloadJSON(of encodePayload: ViewEventPayloadEncoder) throws -> String {
    let runtime = runtime
    var json: String?
    runtime.withUnsafePointee { runtimePointer in
      encodePayload(runtimePointer) { valuePointer in
        // Valid only during this call, which runs the closure below synchronously.
        nonisolated(unsafe) let valuePointer = valuePointer
        json = JavaScriptActor.assumeIsolated {
          let payload = JavaScriptUnownedValue(runtime, unsafeValuePointer: valuePointer).copied(in: runtime)
          runtime.global().setProperty("payload", value: payload)
          return try? runtime.eval("JSON.stringify(payload)").asString()
        }
      }
    }
    return try #require(json)
  }

  @Test
  func `event props dispatch through the view that mounted them`() throws {
    let decoded: DecodedViewProps<TapProps> = try #require(try decode("{ title: 'Card' }"))
    view.update(decoded)

    view.props.onTap()

    #expect(view.events.map(\.name) == ["onTap"])
    #expect(view.events[0].encodePayload == nil)
  }

  @Test
  func `payload is encoded when the event emitter asks for it`() throws {
    let decoded: DecodedViewProps<TapProps> = try #require(try decode("{ title: 'Card' }"))
    view.update(decoded)

    view.props.onMove(MoveEvent(x: 1, y: 2))

    #expect(view.events.map(\.name) == ["onMove"])
    let encodePayload = try #require(view.events[0].encodePayload)
    #expect(try payloadJSON(of: encodePayload) == #"{"x":1,"y":2}"#)
  }

  @Test
  func `events before the view mounts the props are dropped`() throws {
    let decoded: DecodedViewProps<TapProps> = try #require(try decode("{ title: 'Card' }"))

    decoded.props.onTap()
    view.update(decoded)

    #expect(view.events.isEmpty)
  }

  @Test
  func `later decodes keep the events bound to the mounted view`() throws {
    let created: DecodedViewProps<TapProps> = try #require(try decode("{ title: 'Card' }"))
    view.update(created)
    let updated = try #require(try decode("{ title: 'New card' }", previous: created))
    view.update(updated)

    view.props.onTap()

    #expect(updated.events === created.events)
    #expect(view.props.title == "New card")
    #expect(view.events.map(\.name) == ["onTap"])
  }

  @Test
  func `default props dispatch events too`() {
    view.update(nil)

    view.props.onTap()

    #expect(view.events.map(\.name) == ["onTap"])
  }

  @Test
  func `props from a new lineage connect their own dispatcher`() throws {
    view.update(nil)
    let decoded: DecodedViewProps<TapProps> = try #require(try decode("{ title: 'Card' }"))
    view.update(decoded)

    decoded.props.onTap()

    #expect(view.events.map(\.name) == ["onTap"])
  }

  @Test
  func `props without events have no dispatcher`() throws {
    let decoded: DecodedViewProps<NoEventsProps> = try #require(try decode("{ title: 'Card' }"))

    #expect(decoded.events == nil)
  }
}
