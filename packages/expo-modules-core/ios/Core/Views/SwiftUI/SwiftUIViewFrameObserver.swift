// Copyright 2024-present 650 Industries. All rights reserved.

extension ExpoSwiftUI {
  /**
   Observes for view frame changes, usually applied by React Native.
   */
  internal class UIViewFrameObserver {
    private let view: UIView
    private var observer: NSKeyValueObservation?

    init(view: UIView) {
      self.view = view
    }

    func observe(_ callback: @escaping (CGRect) -> Void) {
      // When React Native lays out views, it sets `center` and `bounds` properties to control the `frame`.
      // You can find this implementation in `updateLayoutMetrics:oldLayoutMetrics:` in `UIView+ComponentViewProtocol.mm`.
      // We observe changes on `bounds` because:
      // - It's being changed after `center`, so the origin is already up-to-date.
      // - `frame` changes much more often, it seems that SwiftUI does it as well.
      observer = view.observe(\.bounds, options: [.old, .new]) { view, change in
        guard let newValue = change.newValue else {
          return
        }

        // Update layout metrics of the `Child` view. The `origin` needs to be frame's origin,
        // as `bounds` refers to coordinates relative to view's own space (instead of the parent's space).
        callback(CGRect(origin: view.frame.origin, size: newValue.size))
      }
    }
  }
}
