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
      ViewSizeWrapper(viewHost: self)
    }

    var id: ObjectIdentifier {
      ObjectIdentifier(view)
    }
  }

  public protocol RNHostViewProtocol {
    var matchContents: Bool { get set }
  }
}

// ViewSizeWrapper attaches an observer to the view's bounds and updates the frame modifier of the view host.
// This allows us to respect RN layout styling in SwiftUI realm
// .e.g. <View style={{ width: 100, height: 100 }} />
private struct ViewSizeWrapper: View {
  let viewHost: ExpoSwiftUI.UIViewHost
  @StateObject private var viewSizeModel: ViewSizeModel

  init(viewHost: ExpoSwiftUI.UIViewHost) {
    self.viewHost = viewHost
    _viewSizeModel = StateObject(wrappedValue: ViewSizeModel(viewHost: viewHost))
  }

  var body: some View {
    if let rnHostView = viewHost.view as? ExpoSwiftUI.RNHostViewProtocol, rnHostView.matchContents {
      viewHost
        .frame(width: viewSizeModel.viewFrame.width, height: viewSizeModel.viewFrame.height)
    } else {
      viewHost
    }
  }
}

@MainActor
private class ViewSizeModel: ObservableObject {
  @Published var viewFrame: CGSize
  private var observer: NSKeyValueObservation?

  init(viewHost: ExpoSwiftUI.UIViewHost) {
    let view = viewHost.view
    self.viewFrame = view.bounds.size
    observer = view.observe(\.bounds) { [weak self] view, _ in
      MainActor.assumeIsolated {
        self?.viewFrame = view.bounds.size
      }
    }
  }

  deinit {
    observer?.invalidate()
  }
}
