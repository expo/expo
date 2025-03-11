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
    let proxy: ShadowNodeProxy
    let axis: AxisSet

    public init(shadowNodeProxy: ShadowNodeProxy, axis: AxisSet = .both, @ViewBuilder _ content: () -> Content) {
      self.proxy = shadowNodeProxy
      self.content = content()
      self.axis = axis
    }

    public var body: some SwiftUI.View {
      if #available(iOS 16.0, tvOS 16.0, macOS 13.0, *) {
        if proxy !== ShadowNodeProxy.SHADOW_NODE_MOCK_PROXY {
          content.overlay {
            content.fixedSize(horizontal: axis.contains(.horizontal), vertical: axis.contains(.vertical))
              .hidden()
              .onGeometryChange(for: CGSize.self, of: { proxy in proxy.size }, action: { size in
                var size = size
                size.width = axis.contains(.horizontal) ? size.width : ShadowNodeProxy.UNDEFINED_SIZE
                size.height = axis.contains(.vertical) ? size.height : ShadowNodeProxy.UNDEFINED_SIZE
                proxy.setViewSize?(size)
              })
          }
        } else {
          content
        }
      } else {
        // TODO: throw a warning
        content.onAppear(perform: {
          log.warn("AutoSizingStack is not supported on iOS/tvOS < 16.0")
        })
      }
    }
  }
}
