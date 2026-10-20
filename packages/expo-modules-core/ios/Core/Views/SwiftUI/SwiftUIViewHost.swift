// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI

extension ExpoSwiftUI {
  /**
   SwiftUI view that embeds a UIKit-based view.
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

    @ViewBuilder
    var childView: some SwiftUI.View {
      if let hostingView = view as? AnyHostingView {
        // A nested `Host` that matches its contents takes the content size, like other SwiftUI views.
        MatchedContentSizeFrame(size: hostingView.matchedContentSize) { self }
      } else {
        self
      }
    }

    var id: ObjectIdentifier {
      ObjectIdentifier(view)
    }

    var uiView: UIView? {
      view
    }
  }

  /**
   Content size of a hosting view on the axes it matches; `nil` on the other axes.
   */
  internal final class MatchedContentSize: ObservableObject {
    @Published private(set) var width: CGFloat?
    @Published private(set) var height: CGFloat?

    func update(width: NSNumber?, height: NSNumber?) {
      let newWidth = width.map { CGFloat($0.doubleValue) }
      let newHeight = height.map { CGFloat($0.doubleValue) }
      if self.width != newWidth {
        self.width = newWidth
      }
      if self.height != newHeight {
        self.height = newHeight
      }
    }
  }

  private struct MatchedContentSizeFrame<Content: SwiftUI.View>: SwiftUI.View {
    @ObservedObject var size: MatchedContentSize
    @ViewBuilder let content: () -> Content

    var body: some SwiftUI.View {
      content().frame(width: size.width, height: size.height)
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
