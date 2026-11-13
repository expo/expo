// Copyright 2026-present 650 Industries. All rights reserved.

/// A view of Expo Modules v2. `@ExpoView<Props>` conforms an `ExpoNativeView` subclass to it,
/// and its `Props` typealias names the `@ViewProps` type.
///
/// It's constrained to `AnyObject`, not to `ExpoNativeView`: with the superclass in the protocol, the
/// Swift compiler sometimes crashes when it deserializes the protocol in a module that imports
/// `RCTComponentViewProtocol` on macOS. The `@ExpoView` macro applies only to `ExpoNativeView`
/// subclasses, so the extension below treats `self` as one.
@MainActor
public protocol AnyNativeView: AnyObject {
  associatedtype Props: AnyViewProps

  /// Called when the view gets new props, with what changed since the props it had. The first call
  /// has all props, also when React sets none of them. When it had none, the next call has all props too.
  func didUpdateProps(_ diff: PropsDiff<Props>)

  /// Creates the decoder of the view's props, which the component descriptor of the view type calls.
  /// Framework-internal (leading underscore). It's a requirement, so the default implementation is
  /// specialized in the module that declares the view, where the props type is known.
  nonisolated static func _makePropsDecoder(viewName: String) -> ViewPropsDecoderAdapter
}

extension AnyNativeView {
  public func didUpdateProps(_ diff: PropsDiff<Props>) {}

  /// The current props of the view. Before the first `didUpdateProps(_:)`, they are `Props()`.
  public var props: Props {
    _read {
      // Lends the stored props for the length of the access instead of returning a copy, so
      // `props.title` doesn't copy the whole struct with a retain for each of its references.
      if let decodedProps = nativeView.decodedProps {
        yield unsafeDowncast(decodedProps, to: DecodedViewProps<Props>.self).props
      } else {
        yield Props()
      }
    }
  }

  /// Applies decoded props that Fabric mounts, given as `DecodedViewProps<Props>`, or `nil` when no
  /// props of the view were decoded.
  internal func applyDecodedProps(_ object: AnyObject?) {
    let nativeView = nativeView
    let old = nativeView.decodedProps.map { unsafeDowncast($0, to: DecodedViewProps<Props>.self) }
    let new: DecodedViewProps<Props>

    if let object {
      new = unsafeDowncast(object, to: DecodedViewProps<Props>.self)
    } else if old == nil {
      // React set none of the props, so the view gets the defaults.
      new = DecodedViewProps(props: Props(), changedProps: [], previous: nil)
    } else {
      return
    }
    if new === old {
      return
    }
    nativeView.decodedProps = new
    didUpdateProps(PropsDiff(old: old, new: new))
  }

  /// The view as the `ExpoNativeView` that it is. `unsafeDowncast` checks it in debug builds.
  private var nativeView: ExpoNativeView {
    return unsafeDowncast(self, to: ExpoNativeView.self)
  }

  @inlinable
  public nonisolated static func _makePropsDecoder(viewName: String) -> ViewPropsDecoderAdapter {
    return ViewPropsDecoderAdapter(ViewPropsDecoder<Props>(viewName: viewName))
  }

  /// The names of the view's props, for the view config in JavaScript.
  nonisolated internal static var propNames: [String] {
    return Props.PropName.allCases.map(\.rawValue)
  }

  /// The names of the view's events, for the view config in JavaScript.
  nonisolated internal static var eventNames: [String] {
    return Props._eventNames
  }
}
