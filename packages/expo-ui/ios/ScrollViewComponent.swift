// Copyright 2026-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public final class ScrollViewComponentProps: UIBaseViewProps {
  @Field var axes: AxisOptions = .vertical
  @Field var showsIndicators: Bool = true
  @Field var scrollPositionAnchor: UnitPointOptions?
  @Field var scrollToID: String?
  @Field var scrollToEdge: String?
  @Field var scrollToPoint: [Double]?
  var onScrollPositionChange = EventDispatcher()
}

public struct ScrollViewComponent: ExpoSwiftUI.View {
  @ObservedObject public var props: ScrollViewComponentProps
  @State private var scrolledID: AnyHashable?

  public init(props: ScrollViewComponentProps) {
    self.props = props
  }

  public var body: some View {
    if #available(iOS 18.0, tvOS 18.0, macOS 15.0, *) {
      ScrollViewWithPosition(props: props)
    } else if #available(iOS 17.0, tvOS 17.0, macOS 14.0, *) {
      ScrollView(props.axes.toAxis(), showsIndicators: props.showsIndicators) {
        Children()
      }
      .scrollPosition(id: $scrolledID, anchor: props.scrollPositionAnchor?.toUnitPoint)
      .onChange(of: scrolledID) { _, newValue in
        props.onScrollPositionChange([
          "viewID": newValue.map { "\($0)" } as Any
        ])
      }
      .onChange(of: props.scrollToID) { _, newValue in
        guard let newValue else { return }
        scrolledID = AnyHashable(newValue)
      }
    } else {
      ScrollView(props.axes.toAxis(), showsIndicators: props.showsIndicators) {
        Children()
      }
    }
  }
}

@available(iOS 18.0, tvOS 18.0, macOS 15.0, *)
private struct ScrollViewWithPosition: ExpoSwiftUI.View {
  @ObservedObject var props: ScrollViewComponentProps
  @State private var scrollPosition = ScrollPosition(idType: AnyHashable.self)
  @State private var isUserScrolling = false

  init(props: ScrollViewComponentProps) {
    self.props = props
  }

  private func dispatchPositionEvent() {
    var event: [String: Any] = [
      "isPositionedByUser": isUserScrolling
    ]
    if let viewID = scrollPosition.viewID {
      event["viewID"] = "\(viewID)"
    }
    if let edge = scrollPosition.edge {
      switch edge {
      case .top: event["edge"] = "top"
      case .bottom: event["edge"] = "bottom"
      case .leading: event["edge"] = "leading"
      case .trailing: event["edge"] = "trailing"
      }
    }
    if let point = scrollPosition.point {
      event["point"] = ["x": point.x, "y": point.y]
    }
    if #available(iOS 26.0, tvOS 26.0, macOS 26.0, *) {
      if let x = scrollPosition.x { event["x"] = x }
      if let y = scrollPosition.y { event["y"] = y }
    }
    props.onScrollPositionChange(event)
  }

  var body: some View {
    ScrollView(props.axes.toAxis(), showsIndicators: props.showsIndicators) {
      Children()
    }
    .scrollPosition($scrollPosition, anchor: props.scrollPositionAnchor?.toUnitPoint)
    .onScrollPhaseChange { _, newPhase in
      switch newPhase {
      case .interacting, .tracking, .decelerating:
        isUserScrolling = true
      case .idle:
        dispatchPositionEvent()
        isUserScrolling = false
      default:
        break
      }
    }
    .onChange(of: scrollPosition) { _, _ in
      dispatchPositionEvent()
    }
    .onChange(of: props.scrollToID) { _, newValue in
      guard let newValue else { return }
      isUserScrolling = false
      scrollPosition.scrollTo(id: AnyHashable(newValue))
    }
    .onChange(of: props.scrollToEdge) { _, newValue in
      guard let newValue else { return }
      isUserScrolling = false
      switch newValue {
      case "top": scrollPosition.scrollTo(edge: .top)
      case "bottom": scrollPosition.scrollTo(edge: .bottom)
      case "leading": scrollPosition.scrollTo(edge: .leading)
      case "trailing": scrollPosition.scrollTo(edge: .trailing)
      default: break
      }
    }
    .onChange(of: props.scrollToPoint) { _, newValue in
      guard let newValue, newValue.count == 2 else { return }
      isUserScrolling = false
      scrollPosition.scrollTo(point: CGPoint(x: newValue[0], y: newValue[1]))
    }
  }
}
