// Copyright 2026-present 650 Industries. All rights reserved.

/// A view type of Expo Modules v2: a UIKit view (``AnyNativeUIKitView``) or a SwiftUI view
/// (``AnyNativeSwiftUIView``). `@ExpoView<Props>` conforms the type to one of them, and its `Props` typealias names
/// the `@ViewProps` type. Modules and packages list their views as this type.
@MainActor
public protocol AnyNativeView {
  associatedtype Props: AnyViewProps

  /// Creates the decoder of the view's props, which the component descriptor of the view type calls.
  /// Framework-internal (leading underscore). It's a requirement, so the default implementation is
  /// specialized in the module that declares the view, where the props type is known.
  nonisolated static func _makePropsDecoder(viewName: String) -> ViewPropsDecoderAdapter

  /// The name that the module registers the view under. The `@ExpoView<Props>("CustomName")` macro
  /// overrides it; it's the unqualified type name by default.
  nonisolated static var _jsName: String { get }

  /// The class that the Fabric component views of the view type are based on: the view type itself for a UIKit
  /// view, or the class that renders a SwiftUI view. Core registers a subclass of it for each component.
  /// Framework-internal (leading underscore). `AnyNativeUIKitView` and `AnyNativeSwiftUIView` implement it, so core
  /// gets the class without a dynamic cast, which would look up the conformance of the view type at launch.
  static var _componentViewBaseClass: AnyClass { get }
}

extension AnyNativeView {
  @inlinable
  public nonisolated static func _makePropsDecoder(viewName: String) -> ViewPropsDecoderAdapter {
    return ViewPropsDecoderAdapter(makeViewPropsDecoder(Props.self, viewName: viewName))
  }

  public nonisolated static var _jsName: String {
    return unqualifiedTypeName(self)
  }

  /// The names of the view's props, for the view config in JavaScript.
  nonisolated internal static var propNames: [String] {
    // A closure, not `\.rawValue`: in generic code, a key path finds its type from a mangled name, which looks up
    // the conformance of `Props`.
    return Props.PropName.allCases.map { $0.rawValue }
  }

  /// The names of the view's events, for the view config in JavaScript.
  nonisolated internal static var eventNames: [String] {
    return Props._eventNames
  }
}

/// A UIKit view of Expo Modules v2. `@ExpoView<Props>` conforms an `ExpoNativeView` subclass to it.
///
/// It's constrained to `AnyObject`, not to `ExpoNativeView`: with the superclass in the protocol, the
/// Swift compiler sometimes crashes when it deserializes the protocol in a module that imports
/// `RCTComponentViewProtocol` on macOS. The `@ExpoView` macro applies only to `ExpoNativeView`
/// subclasses, so the extension below treats `self` as one.
@MainActor
public protocol AnyNativeUIKitView: AnyNativeView, AnyObject {
  /// Called when the view gets new props, with what changed since the props it had. The first call
  /// has all props, also when React sets none of them. When it had none, the next call has all props too.
  func didUpdateProps(_ diff: PropsDiff<Props>)

  /// Applies decoded props that Fabric mounts to the given view of this type. Framework-internal
  /// (leading underscore). It's a requirement, so the default implementation is specialized in the
  /// module that declares the view.
  nonisolated static func _applyDecodedProps(_ object: AnyObject?, to view: ExpoNativeView)
}

extension AnyNativeUIKitView {
  public func didUpdateProps(_ diff: PropsDiff<Props>) {}

  public static var _componentViewBaseClass: AnyClass {
    return self
  }

  /// The current props of the view. Before the first `didUpdateProps(_:)`, they are `Props()`.
  /// `@inlinable`, so the access is specialized for `Props` in the module that declares the view.
  @inlinable
  public var props: Props {
    _read {
      // Lends the stored props for the length of the access instead of returning a copy, so
      // `props.title` doesn't copy the whole struct with a retain for each of its references.
      if let decodedProps = unsafeDowncast(self, to: ExpoNativeView.self).decodedProps {
        yield unsafeDowncast(decodedProps, to: DecodedViewProps<Props>.self).props
      } else {
        yield Props()
      }
    }
  }

  /// Applies decoded props that Fabric mounts on the main thread, given as `DecodedViewProps<Props>`, or
  /// `nil` when no props of the view were decoded.
  ///
  /// It's nonisolated and calls the main actor function below without Swift's runtime check of the main
  /// actor: an isolated witness checks the current executor on each call, which costs more than the rest
  /// of an update. `ExpoNativeView.updateDecodedProps(_:)`, its only caller, runs on the main thread.
  @inlinable
  public nonisolated static func _applyDecodedProps(_ object: AnyObject?, to nativeView: ExpoNativeView) {
    typealias IsolatedApply = @MainActor (AnyObject?, ExpoNativeView, Self.Type) -> Void
    typealias NonisolatedApply = (AnyObject?, ExpoNativeView, Self.Type) -> Void

    let apply = unsafeBitCast(applyDecodedProps as IsolatedApply, to: NonisolatedApply.self)
    apply(object, nativeView, Self.self)
  }
}

/// Applies decoded props to a view of the given type. A plain main actor function, not a closure or a
/// witness, so Swift doesn't check the current executor when `AnyNativeView._applyDecodedProps` calls it.
@MainActor
@inlinable
internal func applyDecodedProps<View: AnyNativeUIKitView>(
  _ object: AnyObject?,
  to nativeView: ExpoNativeView,
  as viewType: View.Type
) {
  // `if let` rather than `Optional.map`: Swift checks the main actor in an isolated closure that it passes
  // to a nonisolated function, on each call.
  let old: DecodedViewProps<View.Props>?
  if let decodedProps = nativeView.decodedProps {
    old = unsafeDowncast(decodedProps, to: DecodedViewProps<View.Props>.self)
  } else {
    old = nil
  }
  let new: DecodedViewProps<View.Props>

  if let object {
    new = unsafeDowncast(object, to: DecodedViewProps<View.Props>.self)
  } else if old == nil {
    // React set none of the props, so the view gets the defaults.
    let (props, events) = initialViewProps(View.Props.self)
    new = DecodedViewProps(props: props, changedProps: [], previous: nil, events: events)
  } else {
    return
  }
  if new === old {
    return
  }
  // New props from another lineage come with their own dispatcher. It's connected before `didUpdateProps`, which
  // can dispatch events.
  if let events = new.events, events !== old?.events {
    events.connect(nativeView)
  }
  nativeView.decodedProps = new
  unsafeDowncast(nativeView, to: View.self).didUpdateProps(
    PropsDiff(old: old, new: new, changedProps: new.changedProps(since: old))
  )
}
