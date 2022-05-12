// Copyright 2022-present 650 Industries. All rights reserved.

#if swift(>=5.4)
/**
 A result builder that captures the ``ClassComponent`` elements such as functions, constants and properties.
 */
@resultBuilder
public struct ClassComponentElementsBuilder {
  public static func buildBlock(_ elements: ClassComponentElement...) -> [ClassComponentElement] {
    return elements
  }
}
#endif
