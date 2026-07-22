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
  @Field var seedColor: Color?
  @Field var layoutDirection: ExpoLayoutDirection = .leftToRight
  @Field var matchContentsHorizontal = false
  @Field var matchContentsVertical = false
  @Field var ignoreSafeArea: ExpoSwiftUI.IgnoreSafeArea?
  @Field var modifiers: ModifierArray?
  var onLayoutContent = EventDispatcher()
}

struct HostView: ExpoSwiftUI.View, ExpoSwiftUI.WithHostingView {
  @ObservedObject var props: HostViewProps

  var body: some View {
    let layoutDirection = props.layoutDirection.toLayoutDirection()
    let alignment: Alignment = layoutDirection == .rightToLeft ? .topTrailing : .topLeading
    let fillHorizontal = !props.useViewportSizeMeasurement && !props.matchContentsHorizontal
    let fillVertical = !props.useViewportSizeMeasurement && !props.matchContentsVertical

    if #available(iOS 16.0, tvOS 16.0, macOS 13.0, *) {
      // swiftlint:disable:next identifier_name
      let HostLayout = props.useViewportSizeMeasurement
        ? AnyLayout(ViewportSizeMeasurementLayout(layoutDirection: layoutDirection))
        : AnyLayout(ZStackLayout(alignment: alignment))
      HostLayout {
        Children()
      }
      .fixedSize(horizontal: props.matchContentsHorizontal, vertical: props.matchContentsVertical)
      .modifier(LayoutDirectionModifier(layoutDirection: layoutDirection))
      .modifier(ColorSchemeModifier(colorScheme: props.colorScheme?.toColorScheme()))
      .modifier(SeedColorModifier(seedColor: props.seedColor))
      .applyModifiers(
        props.modifiers,
        appContext: props.appContext,
        globalEventDispatcher: props.globalEventDispatcher
      )
      .modifier(GeometryChangeModifier(props: props))
      .modifier(FillAlignmentModifier(alignment: alignment, fillHorizontal: fillHorizontal, fillVertical: fillVertical))
    } else {
      ZStack(alignment: alignment) {
        Children()
      }
      .fixedSize(horizontal: props.matchContentsHorizontal, vertical: props.matchContentsVertical)
      .modifier(LayoutDirectionModifier(layoutDirection: layoutDirection))
      .modifier(ColorSchemeModifier(colorScheme: props.colorScheme?.toColorScheme()))
      .modifier(SeedColorModifier(seedColor: props.seedColor))
      .applyModifiers(
        props.modifiers,
        appContext: props.appContext,
        globalEventDispatcher: props.globalEventDispatcher
      )
      .modifier(GeometryChangeModifier(props: props))
      .modifier(FillAlignmentModifier(alignment: alignment, fillHorizontal: fillHorizontal, fillVertical: fillVertical))
    }
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
 If parent's proposedViewSize is zero or nil, it will try to use the viewport size to expand its children size.
 */
@available(iOS 16.0, tvOS 16.0, macOS 13.0, *)
private struct ViewportSizeMeasurementLayout: Layout {
  let layoutDirection: LayoutDirection

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
 A ViewModifier that listens for view size changes and dispatches the `onLayoutContent` event
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

private struct FillAlignmentModifier: ViewModifier {
  let alignment: Alignment
  let fillHorizontal: Bool
  let fillVertical: Bool

  func body(content: Content) -> some View {
    if fillHorizontal || fillVertical {
      content.frame(
        maxWidth: fillHorizontal ? .infinity : nil,
        maxHeight: fillVertical ? .infinity : nil,
        alignment: alignment
      )
    } else {
      // Leave the view untouched (e.g. useViewportSizeMeasurement / full matchContents) so the
      // layout proposal reaches the content's own layout unmodified.
      content
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

private struct SeedColorModifier: ViewModifier {
  let seedColor: Color?

  func body(content: Content) -> some View {
    if let seedColor {
      content.tint(seedColor)
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
