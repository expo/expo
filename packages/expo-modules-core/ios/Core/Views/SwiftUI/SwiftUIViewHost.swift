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
      #if os(macOS)
      return view
      #else
      // SwiftUI mutates the view it hosts (autoresizingMask, frame, visibility), sometimes
      // asynchronously after teardown, corrupting unmounted or recycled React views.
      // Hand it a disposable container instead. Fixes expo/expo#47706; supersedes the #40604 mitigation.
      let container = ReactViewIsolationContainer()
      container.hostedView = view
      container.addSubview(view)
      return container
      #endif
    }

    func updateUIView(_ uiView: UIView, context: Context) {
      // Nothing to do here
    }

    static func dismantleUIView(_ uiView: UIView, coordinator: Coordinator) {
      // Nothing to restore — SwiftUI only ever touched the container.
    }

    func makeCoordinator() -> Coordinator {
      Coordinator()
    }

    class Coordinator {
      init() {}
    }

    // MARK: - AnyChild implementations

    var childView: some SwiftUI.View {
      self
    }

    var id: ObjectIdentifier {
      ObjectIdentifier(view)
    }

    var uiView: UIView? {
      view
    }
  }

  #if !os(macOS)
  /**
   Disposable UIView handed to SwiftUI in place of the React-managed view —
   see `UIViewHost.makeUIView`.
   */
  private final class ReactViewIsolationContainer: UIView {
    weak var hostedView: UIView?

    override func layoutSubviews() {
      super.layoutSubviews()
      // Ignore transient zero bounds (initial layout, teardown) — never propagate them.
      guard let hostedView, hostedView.superview === self, !bounds.isEmpty else {
        return
      }
      if hostedView.frame != bounds {
        hostedView.frame = bounds
      }
    }
  }
  #endif
}
