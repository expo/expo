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
      return view
    }

    func updateNSView(_ nsView: NSView, context: Context) {
        // Nothing to do here
    }
    #endif

    func makeUIView(context: Context) -> UIView {
      return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
      // Nothing to do here
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
