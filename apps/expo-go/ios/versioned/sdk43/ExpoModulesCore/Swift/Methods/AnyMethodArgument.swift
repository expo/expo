
/**
 A protocol for classes/structs accepted as an argument of exported methods.
 */
public protocol AnyMethodArgument {}

// Extend the primitive types — these may come from ABI43_0_0React Native bridge.
extension Bool: AnyMethodArgument {}
extension Int: AnyMethodArgument {}
extension Double: AnyMethodArgument {}
extension String: AnyMethodArgument {}
extension Array: AnyMethodArgument {}
extension Dictionary: AnyMethodArgument {}
