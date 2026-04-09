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

internal enum ExpoLayoutDirection: String, Enumerable {
  case leftToRight
  case rightToLeft

  func toLayoutDirection() -> LayoutDirection {
    switch self {
    case .leftToRight:
      return .leftToRight
    case .rightToLeft:
      return .rightToLeft
    }
  }
}

internal final class HostViewProps: ExpoSwiftUI.ViewProps, ExpoSwiftUI.SafeAreaControllable {
  @Field var useViewportSizeMeasurement: Bool = false
  @Field var colorScheme: ExpoColorScheme?
  @Field var layoutDirection: ExpoLayoutDirection = .leftToRight
  @Field var matchContentsHorizontal = false
  @Field var matchContentsVertical = false
  @Field var ignoreSafeArea: ExpoSwiftUI.IgnoreSafeArea?
  var onLayoutContent = EventDispatcher()
}

struct HostView: ExpoSwiftUI.View, ExpoSwiftUI.WithHostingView {
  @ObservedObject var props: HostViewProps

  var body: some View {
    var useViewportSizeMeasurement = props.useViewportSizeMeasurement
    var matchContentsHorizontal = props.matchContentsHorizontal
    var matchContentsVertical = props.matchContentsVertical
    if #unavailable(iOS 16.0, tvOS 16.0, macOS 13.0) {
      if useViewportSizeMeasurement || matchContentsHorizontal || matchContentsVertical {
        log.warn("useViewportSizeMeasurement and matchContents require iOS/tvOS 16.0+")
      }
      useViewportSizeMeasurement = false
      matchContentsHorizontal = false
      matchContentsVertical = false
    }
    let needsCustomLayout = useViewportSizeMeasurement || matchContentsHorizontal || matchContentsVertical

    let layoutDirection = props.layoutDirection.toLayoutDirection()
    let alignment: Alignment = layoutDirection == .rightToLeft ? .topTrailing : .topLeading

    if #available(iOS 16.0, tvOS 16.0, macOS 13.0, *) {
      // swiftlint:disable:next identifier_name
      let HostLayout = needsCustomLayout
        ? AnyLayout(HostContentLayout(
            layoutDirection: layoutDirection,
            matchContentsHorizontal: matchContentsHorizontal,
            matchContentsVertical: matchContentsVertical,
            useViewportFallback: useViewportSizeMeasurement
          ))
        : AnyLayout(ZStackLayout(alignment: alignment))
      return HostLayout {
        Children()
      }
      .modifier(LayoutDirectionModifier(layoutDirection: layoutDirection))
      .modifier(ColorSchemeModifier(colorScheme: props.colorScheme?.toColorScheme()))
      .modifier(GeometryChangeModifier(props: props))
    }

    return ZStack(alignment: alignment) {
      Children()
    }
    .modifier(LayoutDirectionModifier(layoutDirection: layoutDirection))
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
 Custom layout for `Host` content.
 - `matchContents` - proposes `nil` so children report their intrinsic size
 - `useViewportFallback` - substitutes viewport safe-area size when RN layout size is zero.
 - Neither — passes the Host's RN layout size through as-is.
 */
@available(iOS 16.0, tvOS 16.0, macOS 13.0, *)
private struct HostContentLayout: Layout {
  let layoutDirection: LayoutDirection
  let matchContentsHorizontal: Bool
  let matchContentsVertical: Bool
  let useViewportFallback: Bool

  func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
    let maxSize = safeAreaSize()

    let availableWidth: CGFloat? = resolveProposal(
      matchContents: matchContentsHorizontal,
      proposal: proposal.width,
      viewportFallback: maxSize.width
    )
    let availableHeight: CGFloat? = resolveProposal(
      matchContents: matchContentsVertical,
      proposal: proposal.height,
      viewportFallback: maxSize.height
    )

    var resultWidth: CGFloat = 0
    var resultHeight: CGFloat = 0
    for view in subviews {
      let size = view.dimensions(in: ProposedViewSize(width: availableWidth, height: availableHeight))
      resultWidth = max(resultWidth, size.width)
      resultHeight = max(resultHeight, size.height)
    }
    return CGSize(width: resultWidth, height: resultHeight)
  }

  private func resolveProposal(matchContents: Bool, proposal: CGFloat?, viewportFallback: CGFloat) -> CGFloat? {
    if matchContents {
      return nil
    }
    if useViewportFallback {
      let value = proposal ?? 0
      return value > 0 ? proposal : viewportFallback
    }
    return proposal
  }

  func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
    let isRTL = layoutDirection == .rightToLeft
    for subview in subviews {
      let origin: CGPoint
      if isRTL {
        let size = subview.dimensions(in: ProposedViewSize(bounds.size))
        origin = CGPoint(x: bounds.maxX - size.width, y: bounds.minY)
      } else {
        origin = bounds.origin
      }
      subview.place(
        at: origin,
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

  private func dispatchOnLayoutContent(_ size: CGSize) {
    if props.matchContentsHorizontal || props.matchContentsVertical {
      let styleWidth = props.matchContentsHorizontal ? NSNumber(value: Float(size.width)) : nil
      let styleHeight = props.matchContentsVertical ? NSNumber(value: Float(size.height)) : nil
      props.shadowNodeProxy.setStyleSize?(styleWidth, styleHeight)
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

private struct LayoutDirectionModifier: ViewModifier {
  let layoutDirection: LayoutDirection?

  func body(content: Content) -> some View {
    if let layoutDirection {
      content.environment(\.layoutDirection, layoutDirection)
    } else {
      content
    }
  }
}
