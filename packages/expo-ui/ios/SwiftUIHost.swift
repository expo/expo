// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class SwiftUIHostProps: ExpoSwiftUI.ViewProps {
  @Field var matchContents: Bool = false
  var onLayoutContent = EventDispatcher()
}

struct SwiftUIHost: ExpoSwiftUI.View, ExpoSwiftUI.WithHostingView {
  @ObservedObject var props: SwiftUIHostProps

  var body: some View {
    var isUsingMatchContents: Bool = props.matchContents
    if #available(iOS 16.0, tvOS 16.0, macOS 13.0, *) {
      isUsingMatchContents = props.matchContents
    } else {
      log.warn("matchContents is not supported on iOS/tvOS < 16.0")
      isUsingMatchContents = false
    }

    if #available(iOS 16.0, tvOS 16.0, macOS 13.0, *) {
      // swiftlint:disable:next identifier_name
      let HostLayout = isUsingMatchContents
        ? AnyLayout(MatchContentsLayout())
        : AnyLayout(ZStackLayout(alignment: .topLeading))
      return HostLayout {
        Children()
      }.modifier(GeometryChangeModifier(props: props))
    }

    return ZStack(alignment: .topLeading) {
      Children()
    }.modifier(GeometryChangeModifier(props: props))
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
 A Layout designed for the `matchContents` behavior.
 If parent's proposedViewSize is zero or nil, it will try to use screen size to expand it's children size.
 */
@available(iOS 16.0, tvOS 16.0, macOS 13.0, *)
private struct MatchContentsLayout: Layout {
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
  let props: SwiftUIHostProps

  private func dispatchOnLayoutContent(_ size: CGSize) {
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
