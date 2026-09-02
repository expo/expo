internal import ExpoModulesJSI_Cxx
internal import jsi

/// Represents something that can be a JS property key.
public final class JavaScriptPropNameID: JavaScriptType {
  private weak let runtime: JavaScriptRuntime?
  internal let pointee: facebook.jsi.PropNameID

  /// Creates a PropNameID from existing `facebook.jsi.PropNameID`.
  internal init(_ runtime: JavaScriptRuntime, _ pointee: consuming facebook.jsi.PropNameID) {
    self.runtime = runtime
    self.pointee = pointee
  }

  /// Creates a PropNameID from the string.
  public init(_ runtime: JavaScriptRuntime, string: String) {
    self.runtime = runtime
    // Use the `std::string` overload rather than the `(pointer, length)` one: the latter needs a
    // UTF-8 *byte* count, but `String.count` is the grapheme-cluster count, which truncates any
    // non-ASCII key (e.g. `"café"` reports 4 for 5 UTF-8 bytes). `std.string` carries the full
    // UTF-8 bytes and their exact length.
    self.pointee = facebook.jsi.PropNameID.forUtf8(runtime.pointee, std.string(string))
  }

  /// Copies the data in a PropNameID as UTF8 into a string.
  public func utf8() -> String {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    return String(pointee.utf8(runtime.pointee))
  }

  /// Copies the data in a PropNameID as UTF16 into a string.
  public func utf16() -> String {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    return String(pointee.utf16(runtime.pointee))
  }

  // MARK: - JavaScriptType

  public func asValue() -> JavaScriptValue {
    FatalError.unimplemented()
  }

  // MARK: - Caching

  @JavaScriptActor
  public static func cached(_ runtime: JavaScriptRuntime, _ string: String) -> JavaScriptPropNameID {
    if let propName = runtime.propNameIdsRegistry[string] {
      return propName
    }
    let propName = JavaScriptPropNameID(runtime, string: string)
    runtime.propNameIdsRegistry[string] = propName
    return propName
  }
}
