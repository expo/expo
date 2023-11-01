// Copyright 2022-present 650 Industries. All rights reserved.

/**
 A protocol for all typed arrays.
 */
internal protocol AnyTypedArray: AnyArgument {
  /**
   Initializes a typed array from the given JavaScript representation.
   */
  init(_ jsTypedArray: JavaScriptTypedArray)
}
