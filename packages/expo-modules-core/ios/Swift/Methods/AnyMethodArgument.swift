
/**
 A protocol for classes/structs accepted as an argument of exported methods.
 */
public protocol AnyMethodArgument {}

public protocol JavaScriptPrimitive: AnyMethodArgument {}

// Extend the primitive types — these may come from React Native bridge.
extension Bool: JavaScriptPrimitive {}
extension Int: JavaScriptPrimitive {}
extension Double: JavaScriptPrimitive {}
extension String: JavaScriptPrimitive {}

// Extend object types.
extension Dictionary: AnyMethodArgument where Value: AnyMethodArgument {}
extension Array: AnyMethodArgument where Element: AnyMethodArgument {}
