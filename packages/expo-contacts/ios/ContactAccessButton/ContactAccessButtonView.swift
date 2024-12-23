// Copyright 2024-present 650 Industries. All rights reserved.

import ContactsUI
import SwiftUI
import ExpoModulesCore

private extension View {
  /**
   Applies the given transform if the given condition evaluates to `true`.
   - Parameters:
     - condition: The condition to evaluate.
     - transform: The transform to apply to the source `View`.
   - Returns: Either the original `View` or the modified `View` if the condition is `true`.
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
   Applies the given transform if the given condition evaluates to `true`.
   - Parameters:
    - value: The condition to evaluate.
    - transform: The transform to apply to the source `View`.
   - Returns: Either the original `View` or the modified `View` if the condition is `true`.
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

internal struct ExpoContactAccessButton: ExpoSwiftUI.View {
  @EnvironmentObject
  internal var props: ContactAccessButtonProps

  @State
  private var isPickerPresented = false

  var body: some View {
    if #available(iOS 18.0, *) {
      ContactAccessButton(
        queryString: props.query ?? "",
        ignoredEmails: Set(props.ignoredEmails ?? []),
        ignoredPhoneNumbers: Set(props.ignoredPhoneNumbers ?? []),
        approvalCallback: { _ in
          // TODO: Emit an event to JS when it becomes supported on SwiftUI views
        }
      )
      .contactAccessButtonCaption(props.caption?.toContactAccessButtonCaption() ?? .defaultText)
      .padding(.all, props.padding)
      .tint(props.tintColor)
      .let(props.backgroundColor) { view, color in
        view
          .background(color)
          .backgroundStyle(color)
      }
      .let(props.textColor) { view, color in
        view.foregroundStyle(color)
      }
    }
  }
}
