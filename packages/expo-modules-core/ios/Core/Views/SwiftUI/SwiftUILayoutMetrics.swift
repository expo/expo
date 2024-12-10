// Copyright 2024-present 650 Industries. All rights reserved.

extension ExpoSwiftUI {
  /**
   Represents layout metrics to apply on SwiftUI view, i.e. its size and offset.
   */
  class LayoutMetrics: ObservableObject {
    @Published
    var frame: CGRect = .zero

    init(frame: CGRect) {
      self.frame = frame
    }

    var width: CGFloat {
      return frame.width
    }

    var height: CGFloat {
      return frame.height
    }

    var x: CGFloat {
      return frame.minX
    }

    var y: CGFloat {
      return frame.minY
    }
  }
}
