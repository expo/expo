// Copyright 2024-present 650 Industries. All rights reserved.

// Re-export Combine so that consumers building ExpoModulesCore as a framework
// don't need to explicitly import Combine when using ObservableObject types.
@_exported import Combine

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

  /**
   Protocol for virtual views that can resign the first responder anywhere within their subtree,
   not just on the view itself. Unlike `FocusableView`, this walks nested children so a focused
   field wrapped in a container (e.g. a `TextField` inside an `HStack` or `LabeledContent`) is
   also blurred on unmount, which `FocusableView` alone would miss.
   See https://github.com/expo/expo/issues/47682
   */
  internal protocol FocusableViewContainer {
    @MainActor
    func resignFirstResponderInSubtree()
  }

  /**
   Protocol for wrapper views (e.g., UIBaseView) that wrap an inner view.
   Used by DynamicSwiftUIViewType to resolve the underlying view through wrapper layers.
   */
  public protocol ViewWrapper {
    func getWrappedView() -> Any
  }
}
