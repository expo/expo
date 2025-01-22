// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI

extension ExpoSwiftUI {
  /**
   SwiftUI view that embeds an UIKit-based view.
   */
  struct UIViewHost: UIViewRepresentable {
    let view: UIView

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
  }
}
