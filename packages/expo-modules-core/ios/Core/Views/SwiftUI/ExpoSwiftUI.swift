// Copyright 2024-present 650 Industries. All rights reserved.

/**
 A namespace for Expo APIs that deal with SwiftUI.
 */
public struct ExpoSwiftUI {}

extension ExpoSwiftUI {
  /**
  Protocol for SwiftUI views that can receive focus (e.g., TextField, SecureField)
  Used to resign first responder before view recycling to prevent first responder resign crash
  */
  // https://github.com/expo/expo/issues/40354
  public protocol FocusableView {
    func forceResignFirstResponder()
  }
}
