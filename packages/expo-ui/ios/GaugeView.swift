// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public final class GaugeProps: UIBaseViewProps {
  @Field var value: Double = 0
  @Field var min: Double?
  @Field var max: Double?
}

public struct GaugeView: ExpoSwiftUI.View {
  @ObservedObject public var props: GaugeProps

  public init(props: GaugeProps) {
    self.props = props
  }

  public var body: some View {
#if !os(tvOS)
    if #available(iOS 16.0, *) {
      gaugeContent
    }
#else
    EmptyView()
#endif
  }

#if !os(tvOS)
  @available(iOS 16.0, *)
  @ViewBuilder
  private var gaugeContent: some View {
    let range = (props.min ?? 0.0)...(props.max ?? 1.0)
    let label = props.children?.compactMap { $0.childView as? GaugeLabelView }
      .first { $0.props.kind == .label }
    let currentValueLabel = props.children?.compactMap { $0.childView as? GaugeLabelView }
      .first { $0.props.kind == .currentValue }
    let minimumValueLabel = props.children?.compactMap { $0.childView as? GaugeLabelView }
      .first { $0.props.kind == .minimumValue }
    let maximumValueLabel = props.children?.compactMap { $0.childView as? GaugeLabelView }
      .first { $0.props.kind == .maximumValue }

    Gauge(value: props.value, in: range) {
      label
    } currentValueLabel: {
      currentValueLabel
    } minimumValueLabel: {
      minimumValueLabel
    } maximumValueLabel: {
      maximumValueLabel
    }
  }
#endif
}

internal enum GaugeLabelKind: String, Enumerable {
  case label
  case currentValue
  case minimumValue
  case maximumValue
}

internal final class GaugeLabelProps: ExpoSwiftUI.ViewProps {
  @Field var kind: GaugeLabelKind = .label
}

internal struct GaugeLabelView: ExpoSwiftUI.View {
  @ObservedObject var props: GaugeLabelProps

  var body: some View {
    Children()
  }
}
