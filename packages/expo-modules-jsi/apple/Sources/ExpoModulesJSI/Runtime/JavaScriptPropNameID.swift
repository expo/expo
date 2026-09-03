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
    self.pointee = string.toJSIPropNameID(in: runtime.pointee)
  }

  /// Copies the contents of the PropNameID into a string.
  public func utf8() -> String {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    // Property names are almost always short ASCII identifiers, and the engine's own `utf8()` is the
    // fastest way to read those: the `std::string` stays inline and so does the resulting Swift
    // string. Reading the internal representation through `getPropNameIdData`, as `String(jsiString:in:)`
    // does for regular strings, measured about 40% slower for this case.
    return String(pointee.utf8(runtime.pointee))
  }

  /// Copies the contents of the PropNameID into a string. Same result as ``utf8()``.
  public func utf16() -> String {
    // The engine's `utf16()` builds a `std::u16string` that Swift then has to transcode, which is
    // several times slower than going through UTF-8 for the same result.
    return utf8()
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
