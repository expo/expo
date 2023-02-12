// Copyright 2021-present 650 Industries. All rights reserved.

/**
 A protocol for classes/structs accepted as an argument of functions.
 */
public protocol AnyArgument {}

// Extend the optional type - this is required to support optional arguments.
extension Optional: AnyArgument where Wrapped: AnyArgument {}

// Extend the primitive types — these may come from React Native bridge.
extension Bool: AnyArgument {}

extension Int: AnyArgument {}
extension Int8: AnyArgument {}
extension Int16: AnyArgument {}
extension Int32: AnyArgument {}
extension Int64: AnyArgument {}

extension UInt: AnyArgument {}
extension UInt8: AnyArgument {}
extension UInt16: AnyArgument {}
extension UInt32: AnyArgument {}
extension UInt64: AnyArgument {}

extension Float32: AnyArgument {}
extension Double: AnyArgument {}

extension String: AnyArgument {}
extension Array: AnyArgument {}
extension Dictionary: AnyArgument {}

