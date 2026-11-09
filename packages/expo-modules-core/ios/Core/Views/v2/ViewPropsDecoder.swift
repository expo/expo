// Copyright 2026-present 650 Industries. All rights reserved.

@_spi(Internal) import ExpoModulesJSI

/// Decodes the props that React sends to the views of one type into their `@ViewProps` struct. The
/// component descriptor of the view type calls it from `cloneProps`, on the thread that commits the
/// props, which for JavaScript props objects is the runtime's JavaScript thread.
public final class ViewPropsDecoder<Props: AnyViewProps>: @unchecked Sendable {
  /// The name of the view type, for the logs.
  @usableFromInline
  internal let viewName: String

  /// Whether props from a runtime that no `JavaScriptRuntime` wraps were already reported. Reanimated's
  /// layout animations send props from its UI runtime on every frame, so it's reported only once.
  private let reportedUnknownRuntime = Mutex(false)

  /// The props that were skipped and already reported, to report each one only once.
  private let reportedSkippedProps = Mutex<Set<String>>([])

  public init(viewName: String) {
    self.viewName = viewName
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
      var props = previous?.props ?? Props()
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
      return DecodedViewProps(props: props, changedProps: changedProps, previous: previous)
    }
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
      log.warn(
        "The \(newlySkipped) props of '\(viewName)' weren't applied: props that don't come from React, for example from Reanimated or setNativeProps, aren't supported yet"
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
