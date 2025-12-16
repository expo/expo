// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

struct ValueOptions: Record {
  @Field var value: Double
  @Field var label: String?
  @Field var color: Color?
}

enum GaugeStyle: String, Enumerable {
  case `default`
  case circular
  case circularCapacity
  case linear
  case linearCapacity
}

final class GaugeProps: UIBaseViewProps {
  @Field var label: String?
  @Field var labelColor: Color?
  @Field var current: ValueOptions
  @Field var min: ValueOptions?
  @Field var max: ValueOptions?
  @Field var type: GaugeStyle = .default
  @Field var color: [Color] = []
}

struct GaugeView: ExpoSwiftUI.View {
  @ObservedObject var props: GaugeProps

  var body: some View {
#if !os(tvOS)
    if #available(iOS 16.0, *) {
      let range = (props.min?.value ?? 0.0)...(props.max?.value ?? 1.0)
      Gauge(value: props.current.value, in: range) {
        if let label = props.label {
          Text(label).let(props.labelColor) { $0.foregroundColor($1) }
        }
      } currentValueLabel: {
        optionalLabelFor(props.current)
      } minimumValueLabel: {
        optionalLabelFor(props.min)
      } maximumValueLabel: {
        optionalLabelFor(props.max)
      }
      .if(props.type == .default) { $0.gaugeStyle(.automatic) }
      .if(props.type == .circular) { $0.gaugeStyle(.accessoryCircular) }
      .if(props.type == .circularCapacity) { $0.gaugeStyle(.accessoryCircularCapacity) }
      .if(props.type == .linear) { $0.gaugeStyle(.accessoryLinear) }
      .if(props.type == .linearCapacity) { $0.gaugeStyle(.accessoryLinearCapacity) }
      .if(!props.color.isEmpty) { $0.tint(Gradient(colors: props.color)) }
    }
#else
    EmptyView()
#endif
  }

  @ViewBuilder
  private func optionalLabelFor(_ options: ValueOptions?) -> some View {
    if let label = options?.label {
      Text(label).let(options?.color) { $0.foregroundColor($1) }
    }
  }
}
