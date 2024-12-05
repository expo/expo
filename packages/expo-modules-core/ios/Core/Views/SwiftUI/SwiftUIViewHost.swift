// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI

extension ExpoSwiftUI {
  /**
   SwiftUI view that embeds an UIKit-based view.
   */
  struct UIViewHost: UIViewRepresentable {
    let view: UIView

    func makeUIView(context: Context) -> UIView {
      return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
      // Nothing to do here
    }
  }
}
