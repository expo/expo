import ExpoModulesJSI

/**
 Type-erased protocol for view props classes.
 */
public protocol AnyViewProp: AnyViewDefinitionElement {
  /**
   Name of the view prop that JavaScript refers to.
   */
  var name: String { get }

  /**
   Function that sets the underlying prop value for given view.
   */
  func set(value: Any, onView: UIView, appContext: AppContext) throws

  /// Decodes the given JavaScript value into the prop's native representation, without touching
  /// the view. Runs on the JavaScript thread. The returned value is detached from the runtime and
  /// safe to hand to `applyDecoded(value:onView:appContext:)` on the main thread.
  ///
  /// Only reached for views that opt into JavaScript-thread decoding
  /// (`ExpoFabricView.receivesDecodedProps`). The default throws, so a conformer that doesn't
  /// implement it keeps compiling and simply can't be used on that path.
  @JavaScriptActor
  func decode(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any

  /// Applies an already-decoded value (produced by `decode(jsValue:appContext:)`) to the view.
  /// Runs on the main thread. Defaults to `set(value:onView:appContext:)`.
  @MainActor
  func applyDecoded(value: Any, onView: UIView, appContext: AppContext) throws
}

extension AnyViewProp {
  @JavaScriptActor
  public func decode(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
    throw PropDecodingUnsupportedException(name)
  }

  @MainActor
  public func applyDecoded(value: Any, onView: UIView, appContext: AppContext) throws {
    try set(value: value, onView: onView, appContext: appContext)
  }
}

/// Thrown by the default `AnyViewProp.decode(jsValue:appContext:)` when a prop type provides no
/// JavaScript-thread decoding of its own.
internal final class PropDecodingUnsupportedException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Prop '\(param)' cannot be decoded on the JavaScript thread because its type does not implement `decode(jsValue:appContext:)`. Keep the view on the dictionary path (`receivesDecodedProps` returning `false`) or implement decoding for this prop type"
  }
}
