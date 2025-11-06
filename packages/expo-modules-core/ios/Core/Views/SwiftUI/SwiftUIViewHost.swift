// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI

extension ExpoSwiftUI {
  /**
   SwiftUI view that embeds an UIKit-based view.
   */
  public struct UIViewHost: UIViewRepresentable, AnyChild {
    public let view: UIView

    // MARK: - UIViewRepresentable implementations

    #if os(macOS)
    public func makeNSView(context: Context) -> NSView {
      context.coordinator.originalAutoresizingMask = view.autoresizingMask
      return view
    }

    public func updateNSView(_ nsView: NSView, context: Context) {
        // Nothing to do here
    }
    #endif

    public func makeUIView(context: Context) -> UIView {
      context.coordinator.originalAutoresizingMask = view.autoresizingMask
      return view
    }

    public func updateUIView(_ uiView: UIView, context: Context) {
      // Nothing to do here
    }

    public static func dismantleUIView(_ uiView: UIView, coordinator: Coordinator) {
      // https://github.com/expo/expo/issues/40604
      // UIViewRepresentable attaches autoresizingMask w+h to the hosted UIView
      // This causes issues for RN views when they are recycled.
      // So we restore the original autoresizingMask to avoid issues.
      uiView.autoresizingMask = coordinator.originalAutoresizingMask
    }

    public func makeCoordinator() -> Coordinator {
      Coordinator()
    }

    public class Coordinator {
      var originalAutoresizingMask: UIView.AutoresizingMask = []
    }

    // MARK: - AnyChild implementations

    public var childView: some SwiftUI.View {
      self
    }

    public var id: ObjectIdentifier {
      ObjectIdentifier(view)
    }
  }
}
