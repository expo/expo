import Foundation

internal import jsi

@objc(JavaScriptRuntimeProvider)
public protocol JavaScriptRuntimeProvider {
  // Apparently it doesn't get included in the `.swiftinterface` file, even though it's public.
  func consume() -> facebook.jsi.Runtime
}
