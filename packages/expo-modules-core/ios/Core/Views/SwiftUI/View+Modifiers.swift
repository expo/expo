// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI

/**
 Public extension to SwiftUI's `View` struct that adds some custom useful modifiers.
 */
public extension View {
  /**
   Applies the given transform if the given condition evaluates to `true`.
   - Parameters:
   - condition: The condition to evaluate.
   - transform: The transform to apply to the source view, receiving a view as an argument.
   - Returns: Either the original view or the modified view if the condition is `true`.
   */
  @ViewBuilder
  func `if`<Content: View>(_ condition: @autoclosure () -> Bool, _ transform: (Self) -> Content) -> some View {
    if condition() {
      transform(self)
    } else {
      self
    }
  }

  /**
   Applies the given transform if the given value can be safely unwrapped, i.e. is not `nil`.
   - Parameters:
   - value: The value to unwrap.
   - transform: The transform to apply to the source view, receiving a view and an unwrapped value as arguments.
   - Returns: Either the original view or the modified view if the value is not `nil`.
   */
  @ViewBuilder
  func `let`<Value, Content: View>(_ value: Value?, _ transform: (Self, Value) -> Content) -> some View {
    if let value {
      transform(self, value)
    } else {
      self
    }
  }
}
