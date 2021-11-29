// Copyright 2021-present 650 Industries. All rights reserved.

/**
 A protocol for classes/structs accepted as an argument of functions.
 */
public protocol AnyArgument {}

// Extend the primitive types — these may come from React Native bridge.
extension Bool: AnyArgument {}
extension Int: AnyArgument {}
extension Double: AnyArgument {}
extension String: AnyArgument {}
extension Array: AnyArgument {}
extension Dictionary: AnyArgument {}
