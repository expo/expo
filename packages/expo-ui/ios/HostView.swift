// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal enum ExpoColorScheme: String, Enumerable {
  case light
  case dark

  func toColorScheme() -> ColorScheme {
    switch self {
    case .light:
      return .light
    case .dark:
      return .dark
    }
  }
}

internal final class HostViewProps: ExpoSwiftUI.ViewProps {
  @Field var useViewportSizeMeasurement: Bool = false
  @Field var colorScheme: ExpoColorScheme?
  @Field var matchContentsHorizontal = false
  @Field var matchContentsVertical = false
  var onLayoutContent = EventDispatcher()
}

struct HostView: ExpoSwiftUI.View, ExpoSwiftUI.WithHostingView {
  @ObservedObject var props: HostViewProps

  var body: some View {
    var useViewportSizeMeasurement: Bool = props.useViewportSizeMeasurement
    if #available(iOS 16.0, tvOS 16.0, macOS 13.0, *) {
      useViewportSizeMeasurement = props.useViewportSizeMeasurement
    } else {
      log.warn("useViewportSizeMeasurement is not supported on iOS/tvOS < 16.0")
      useViewportSizeMeasurement = false
    }

    if #available(iOS 16.0, tvOS 16.0, macOS 13.0, *) {
      // swiftlint:disable:next identifier_name
      let HostLayout = useViewportSizeMeasurement
        ? AnyLayout(ViewportSizeMeasurementLayout())
        : AnyLayout(ZStackLayout(alignment: .topLeading))
      return HostLayout {
        Children()
      }
      .modifier(ColorSchemeModifier(colorScheme: props.colorScheme?.toColorScheme()))
      .modifier(GeometryChangeModifier(props: props))
    }

    return ZStack(alignment: .topLeading) {
      Children()
    }
    .modifier(ColorSchemeModifier(colorScheme: props.colorScheme?.toColorScheme()))
    .modifier(GeometryChangeModifier(props: props))
  }

  private func safeAreaSize() -> CGSize {
    let safeSize = UIApplication
      .shared
      .connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow }?
      .safeAreaLayoutGuide
      .layoutFrame
      .size
      ?? UIScreen.main.bounds.size

    let width = safeSize.width > 0 ? safeSize.width : UIScreen.main.bounds.width
    let height = safeSize.height > 0 ? safeSize.height : UIScreen.main.bounds.height
    return CGSize(width: width, height: height)
  }
}

/**
 A Layout designed for the `useViewportSizeMeasurement` behavior.
 If parent's proposedViewSize is zero or nil, it will try to use the viewport size to expand it's children size.
 */
@available(iOS 16.0, tvOS 16.0, macOS 13.0, *)
private struct ViewportSizeMeasurementLayout: Layout {
  func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
    let maxSize = safeAreaSize()
    let proposalWidth = proposal.width ?? 0
    let proposalHeight = proposal.height ?? 0
    let availableWidth = proposalWidth > 0 ? proposalWidth : maxSize.width
    let availableHeight = proposalHeight > 0 ? proposalHeight : maxSize.height

    var resultWidth: CGFloat = 0
    var resultHeight: CGFloat = 0
    for view in subviews {
      let size = view.dimensions(in: ProposedViewSize(width: availableWidth, height: availableHeight))
      resultWidth = max(resultWidth, size.width)
      resultHeight = max(resultHeight, size.height)
    }
    return CGSize(width: resultWidth, height: resultHeight)
  }

  func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
    for subview in subviews {
      subview.place(
        at: bounds.origin,
        proposal: ProposedViewSize(bounds.size)
      )
    }
  }

  private func safeAreaSize() -> CGSize {
    let screenSize = UIScreen.main.bounds.size
    let safeSize = UIApplication
      .shared
      .connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow }?
      .safeAreaLayoutGuide
      .layoutFrame
      .size
      ?? screenSize

    let width = safeSize.width > 0 ? safeSize.width : screenSize.width
    let height = safeSize.height > 0 ? safeSize.height : screenSize.height
    return CGSize(width: width, height: height)
  }
}

/**
 A ViewModifier that listens for view size change the dispatch the `onLayoutContent` event
 */
private struct GeometryChangeModifier: ViewModifier {
  let props: HostViewProps
  @EnvironmentObject var shadowNodeProxy: ExpoSwiftUI.ShadowNodeProxy

  private func dispatchOnLayoutContent(_ size: CGSize) {
    if (props.matchContentsHorizontal || props.matchContentsVertical) {
      let styleWidth = props.matchContentsHorizontal ? NSNumber(value: Float(size.width)) : nil
      let styleHeight = props.matchContentsVertical ? NSNumber(value: Float(size.height)) : nil
      shadowNodeProxy.setStyleSize?(styleWidth, styleHeight)
    }
    
    props.onLayoutContent([
      "width": size.width,
      "height": size.height
    ])
  }

  func body(content: Content) -> some View {
    if #available(iOS 16.0, tvOS 16.0, macOS 13.0, *) {
      content.onGeometryChange(for: CGSize.self, of: { proxy in proxy.size }, action: {
        dispatchOnLayoutContent($0)
      })
    } else {
      content.overlay {
        GeometryReader { geometry in
          Color.clear
            .hidden()
            .onAppear {
              dispatchOnLayoutContent(geometry.size)
            }
            .onChange(of: geometry.size) { dispatchOnLayoutContent($0) }
        }
      }
    }
  }
}

private struct ColorSchemeModifier: ViewModifier {
  let colorScheme: ColorScheme?

  func body(content: Content) -> some View {
    if let colorScheme {
      content.environment(\.colorScheme, colorScheme)
    } else {
      content
    }
  }
}
