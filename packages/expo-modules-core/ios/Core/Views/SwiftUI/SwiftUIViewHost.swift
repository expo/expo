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
      // Hand SwiftUI a disposable container instead of the React-managed
      // view. SwiftUI mutates the platform view it hosts — autoresizingMask,
      // frame, visibility — and Menu/ContextMenu can do so asynchronously,
      // after the surrounding hierarchy has been torn down. When SwiftUI
      // owns the React view directly, those mutations leak into Fabric
      // rendering: dismantleUIView is not reliably called on wholesale
      // teardown (see https://github.com/expo/expo/issues/40604 for a prior
      // mitigation), and deferred mutations can land after the view has been
      // unmounted or recycled into an unrelated component, which then
      // renders zero-sized or invisible
      // (https://github.com/expo/expo/issues/47706). The container absorbs
      // all SwiftUI mutations; the React view tracks the container's bounds
      // while mounted. It keeps its Yoga-assigned frame here — the
      // matchContents sizing path observes the React view's bounds, so
      // zeroing it to the empty container would deadlock that feedback loop
      // at zero.
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
      // The isolation container is discarded along with the SwiftUI
      // hierarchy; SwiftUI never touched the React view, so there is no
      // state to restore on it (see makeUIView).
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
      // Skip empty bounds: transient zero sizes (initial layout, teardown)
      // must not propagate to the React view — see UIViewHost.makeUIView.
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
