// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation
@_spi(Internal) import ExpoModulesJSI

/// Decodes the props that React sends to the views of one type into their `@ViewProps` struct. The
/// component descriptor of the view type calls it from `cloneProps`, on the thread that commits the
/// props, which for JavaScript props objects is the runtime's JavaScript thread.
/// Creates the decoder of the given props type.
///
/// `AnyNativeView._makePropsDecoder` is specialized for a concrete props type. When specialized code creates
/// `ViewPropsDecoder<Props>`, the Swift runtime builds the type from its mangled name. A mangled name has no
/// conformances, so the runtime looks up the conformance of `Props` to `AnyViewProps`. In a large app, a lookup that
/// isn't cached yet takes much longer than the rest of registering the view.
///
/// When `_makePropsDecoder` calls this function instead, it passes the conformance as an argument, and the runtime
/// builds the type without a lookup. This works only while this function stays generic: an inlined or specialized
/// copy would build the type from its mangled name again. `@inline(never)` prevents inlining, and `@_semantics`
/// prevents specialization.
@usableFromInline
@inline(never)
@_semantics("optimize.sil.specialize.generic.never")
internal func makeViewPropsDecoder<Props: AnyViewProps>(
  _ propsType: Props.Type,
  viewName: String
) -> ViewPropsDecoder<Props> {
  return ViewPropsDecoder<Props>(viewName: viewName)
}

public final class ViewPropsDecoder<Props: AnyViewProps>: @unchecked Sendable {
  /// The name of the view type, for the logs.
  @usableFromInline
  internal let viewName: String

  /// Whether props from a runtime that no `JavaScriptRuntime` wraps were already reported. Reanimated's
  /// layout animations send props from its UI runtime on every frame, so it's reported only once.
  private let reportedUnknownRuntime = Mutex(false)

  /// The props that were skipped and already reported, to report each one only once.
  private let reportedSkippedProps = Mutex<Set<String>>([])

  /// The names of the props, in the order that
  /// ``decode(valuePointers:indexes:count:runtimePointer:previous:)`` indexes them.
  @usableFromInline
  internal let propNames: [Props.PropName]

  public init(viewName: String) {
    self.viewName = viewName
    self.propNames = Array(Props.PropName.allCases)
  }

  /// The names of the props in JavaScript, in the order that
  /// ``decode(valuePointers:indexes:count:runtimePointer:previous:)`` indexes them.
  public var propNameStrings: [String] {
    // A closure, not `\.rawValue`: in generic code, a key path finds its type from a mangled name, which looks up
    // the conformance of `Props`.
    return propNames.map { $0.rawValue }
  }

  /// Decodes the JavaScript props object at `propsPointer`, a `jsi::Value` of the `jsi::Runtime` at
  /// `runtimePointer`, into a copy of `previous`. It decodes only the keys that are props of `Props`
  /// and skips the others, such as the style props that React Native parses. Returns `previous` when
  /// no prop changes.
  ///
  /// A value that doesn't decode leaves the prop as it was and logs a warning. `null` and `undefined`
  /// reset the prop to its value in `Props()`, because React sends `null` for a removed prop.
  @inlinable
  public func decode(
    propsPointer: UnsafeRawPointer,
    runtimePointer: UnsafeRawPointer,
    previous: DecodedViewProps<Props>?
  ) -> DecodedViewProps<Props>? {
    guard let runtime = runtime(for: runtimePointer) else {
      return previous
    }
    // The props object lives only during this synchronous call, on this thread.
    nonisolated(unsafe) let propsPointer = propsPointer
    return JavaScriptActor.assumeIsolated {
      let (startProps, events) = startingProps(previous)
      var props = startProps
      var changedProps = Props.PropSet()

      let object = JavaScriptUnownedValue(runtime, unsafeValuePointer: propsPointer).getObject(in: runtime)
      object.forEachProperty { key, value in
        guard let name = Props.PropName(rawValue: key) else {
          return
        }
        do {
          try props._decode(name, from: value, in: runtime)
          changedProps.insert(Props.propSet(for: name))
        } catch {
          reportUndecodableProp(key, of: viewName, error: error)
        }
      }

      if changedProps.isEmpty, let previous {
        return previous
      }
      return DecodedViewProps(props: props, changedProps: changedProps, previous: previous, events: events)
    }
  }

  /// Decodes `count` values of the props of `Props` into a copy of `previous`. `valuePointers[i]` points
  /// to a `jsi::Value` of the `jsi::Runtime` at `runtimePointer`, and `indexes[i]` is the index of its
  /// prop name in ``propNameStrings``. The caller already picked these values out of the props object,
  /// so unlike ``decode(propsPointer:runtimePointer:previous:)`` it doesn't look up the keys. Returns
  /// `previous` when no prop changes.
  ///
  /// A value that doesn't decode leaves the prop as it was and logs a warning. `null` and `undefined`
  /// reset the prop to its value in `Props()`, because React sends `null` for a removed prop.
  @inlinable
  public func decode(
    valuePointers: UnsafePointer<UnsafeRawPointer>,
    indexes: UnsafePointer<Int>,
    count: Int,
    runtimePointer: UnsafeRawPointer,
    previous: DecodedViewProps<Props>?
  ) -> DecodedViewProps<Props>? {
    guard let runtime = runtime(for: runtimePointer) else {
      return previous
    }
    // The values live only during this synchronous call, on this thread.
    nonisolated(unsafe) let valuePointers = valuePointers
    nonisolated(unsafe) let indexes = indexes
    return JavaScriptActor.assumeIsolated {
      let (startProps, events) = startingProps(previous)
      var props = startProps
      var changedProps = Props.PropSet()

      for i in 0..<count {
        let name = propNames[indexes[i]]
        let value = JavaScriptUnownedValue(runtime, unsafeValuePointer: valuePointers[i])
        do {
          try props._decode(name, from: value, in: runtime)
          changedProps.insert(Props.propSet(for: name))
        } catch {
          reportUndecodableProp(name.rawValue, of: viewName, error: error)
        }
      }

      if changedProps.isEmpty, let previous {
        return previous
      }
      return DecodedViewProps(props: props, changedProps: changedProps, previous: previous, events: events)
    }
  }

  /// Returns the props that a decode changes: a copy of the previous props, or the initial props with the events bound
  /// to a new dispatcher.
  @inlinable
  internal func startingProps(_ previous: DecodedViewProps<Props>?) -> (props: Props, events: ViewEventDispatcher?) {
    if let previous {
      return (previous.props, previous.events)
    }
    return initialViewProps(Props.self)
  }

  /// Returns the runtime at the given address, or reports once that there is none.
  @usableFromInline
  internal func runtime(for runtimePointer: UnsafeRawPointer) -> JavaScriptRuntime? {
    if let runtime = JavaScriptRuntime.for(unsafePointer: runtimePointer) {
      return runtime
    }
    let isFirstReport = reportedUnknownRuntime.withLock { reported in
      defer { reported = true }
      return !reported
    }
    if isFirstReport {
      log.warn("Can't decode the props of '\(viewName)': no JavaScriptRuntime wraps the runtime that sent them")
    }
    return nil
  }

  /// Reports the props of `Props` among the given prop names, which came without a JavaScript runtime
  /// and weren't decoded. Reports each prop only once.
  public func didSkipProps(_ propNames: [String]) {
    let newlySkipped = reportedSkippedProps.withLock { reported in
      propNames.filter { Props.PropName(rawValue: $0) != nil && reported.insert($0).inserted }
    }
    if !newlySkipped.isEmpty {
      let thread = Thread.isMainThread ? "the main thread" : "the thread '\(Thread.current.name ?? "")'"
      log.warn(
        "The \(newlySkipped) props of '\(viewName)' weren't applied: they came from outside React, for example from Reanimated or Animated, on \(thread), which has no JavaScript runtime that can decode them. On the main thread, call `installOnUIRuntime(getUIRuntimeHolder())` once at startup, with `installOnUIRuntime` from `expo` and `getUIRuntimeHolder` from `react-native-worklets`. Otherwise, set them from React"
      )
    }
  }
}

/// Logs a prop value that doesn't decode. It's out of line and not generic, so the copy of
/// `ViewPropsDecoder.decode(propsPointer:runtimePointer:previous:)` that each props type specializes
/// doesn't include it.
@usableFromInline
internal func reportUndecodableProp(_ propName: String, of viewName: String, error: any Error) {
  log.warn("Can't decode the '\(propName)' prop of '\(viewName)', so it keeps its value: \(error)")
}
