// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI

extension ExpoSwiftUI {
  public struct AxisSet: OptionSet {
    public init(rawValue: Int) {
      self.rawValue = rawValue
    }
    public let rawValue: Int

    public static let horizontal = AxisSet(rawValue: 1 << 0)
    public static let vertical = AxisSet(rawValue: 1 << 1)

    public static let both: AxisSet = [.horizontal, .vertical]
  }

  public struct AutoSizingStack<Content: SwiftUI.View>: SwiftUI.View {
    let content: Content
    let viewUtils: ViewUtils
    let axis: AxisSet

    public init(viewUtils: ViewUtils, axis: AxisSet = .both, @ViewBuilder _ content: () -> Content) {
      self.viewUtils = viewUtils
      self.content = content()
      self.axis = axis
    }

    public var body: some SwiftUI.View {
      if #available(iOS 16.0, *) {
        content.fixedSize(horizontal: axis.contains(.horizontal), vertical: axis.contains(.vertical))
        .onGeometryChange(for: CGSize.self) { proxy in
          proxy.size
        } action: {
          let size = CGSize(width: axis.contains(.horizontal) ? $0.width : -1, height: axis.contains(.vertical) ? $0.height : -1)
          viewUtils.setViewSize?(size)
        }
      } else {
        // TODO: throw a warning
        content.onAppear(perform: {
          log.warn("AutoSizingStack is not supported on iOS < 16.0")
        })
      }
    }
  }
}
