// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI

extension ExpoSwiftUI {
  /**
   View that renders an UIKit-based React child view and manages its layout by synchronizing `UIView.frame` with the SwiftUI system.

   React Native sets `center` and `bounds` properties during the layout, but as per Apple docs, this is not recommended and may result
   in undefined behavior (read more in ``UIViewRepresentable`` docs). To fix it, we're observing for changes in `bounds` and then
   pass the new frame to SwiftUI so it can update its layout metrics and then set UIView's origin to zero (so it doesn't affect SwiftUI's layout in any way).
   */
  public struct Child: SwiftUI.View, Identifiable {
    public let id: Int
    public let view: UIView

    @ObservedObject
    private var layoutMetrics: LayoutMetrics

    private let viewFrameObserver: UIViewFrameObserver

    init(view: UIView) {
      self.id = ObjectIdentifier(view).hashValue
      self.view = view
      self.layoutMetrics = LayoutMetrics(frame: view.frame)
      self.viewFrameObserver = UIViewFrameObserver(view: view)

      // Observe for layout changes made by React.
      viewFrameObserver.observe { [weak view, layoutMetrics] frame in
        // Update layout metrics for the SwiftUI view. This will trigger a re-render as it changes the observed object.
        layoutMetrics.frame = frame

        // Reset UIKit's origin to zero so it's fully controlled by `.offset(x:y:)` in SwiftUI.
        // SwiftUI may reset it anyway, but we want this to be explicit.
        view?.frame = CGRect(origin: .zero, size: frame.size)
      }
    }

    public var body: some SwiftUI.View {
      return UIViewHost(view: view)
        .frame(width: layoutMetrics.width, height: layoutMetrics.height, alignment: .topLeading)
        .offset(x: layoutMetrics.x, y: layoutMetrics.y)
    }
  }
}
