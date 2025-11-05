// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI

extension ExpoSwiftUI {
  /**
   SwiftUI view that embeds an UIKit-based view.
   */
  struct UIViewHost: UIViewRepresentable, AnyChild {
    let view: UIView

    // MARK: - UIViewRepresentable implementations

    #if os(macOS)
    func makeNSView(context: Context) -> NSView {
      context.coordinator.originalAutoresizingMask = view.autoresizingMask
      return view
    }

    func updateNSView(_ nsView: NSView, context: Context) {
        // Nothing to do here
    }
    #endif

    func makeUIView(context: Context) -> UIView {
      context.coordinator.originalAutoresizingMask = view.autoresizingMask
      return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
      // Nothing to do here
    }

    static func dismantleUIView(_ uiView: UIView, coordinator: Coordinator) {
      // https://github.com/expo/expo/issues/40604
      // UIViewRepresentable attaches autoresizingMask w+h to the hosted UIView
      // This causes issues for RN views when they are recycled.
      // So we restore the original autoresizingMask to avoid issues.
      uiView.autoresizingMask = coordinator.originalAutoresizingMask
    }

    func makeCoordinator() -> Coordinator {
      Coordinator()
    }

    class Coordinator {
      var originalAutoresizingMask: UIView.AutoresizingMask = []
    }

    // MARK: - AnyChild implementations

    var childView: some SwiftUI.View {
      self
    }

    var id: ObjectIdentifier {
      ObjectIdentifier(view)
    }
  }
}

// SwiftUIHost 
//   SwiftUI

// SwiftUIHost position and dimension is set by yoga layout system initially. SwiftUI updates the dimension if matchContents is true.


// RNHost
//   RNComponent

// RNHost position and dimension are set by SwiftUI layout system initially. Yoga updates the dimension