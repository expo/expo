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
    @State private var lastMeasuredSize: CGSize = .zero

    public init(shadowNodeProxy: ShadowNodeProxy, axis: AxisSet = .both, @ViewBuilder _ content: () -> Content) {
      self.proxy = shadowNodeProxy
      self.content = content()
      self.axis = axis
    }

    public var body: some SwiftUI.View {
      if #available(iOS 16.0, tvOS 16.0, *) {
        content
          .if(proxy !== ShadowNodeProxy.SHADOW_NODE_MOCK_PROXY, { view in
            view
              .frame(
                idealWidth: axis.contains(.horizontal) ? lastMeasuredSize.width : nil,
                idealHeight: axis.contains(.vertical) ? lastMeasuredSize.height : nil
              )
              .onGeometryChange(for: CGSize.self) { proxy in
                proxy.size
              } action: {
                let width = axis.contains(.horizontal) ? $0.width : ShadowNodeProxy.UNDEFINED_SIZE
                let height = axis.contains(.vertical) ? $0.height : ShadowNodeProxy.UNDEFINED_SIZE
                let size = CGSize(width: width, height: height)
                if lastMeasuredSize != size {
                  lastMeasuredSize = size
                  proxy.setViewSize?(size)
                }
              }
          })
      } else {
        // TODO: throw a warning
        content.onAppear(perform: {
          log.warn("AutoSizingStack is not supported on iOS/tvOS < 16.0")
        })
      }
    }
  }
}
