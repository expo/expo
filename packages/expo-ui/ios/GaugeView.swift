// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

class GaugeProps: ExpoSwiftUI.ViewProps {
    @Field var minValue: CGFloat = 100
    @Field var maxValue: CGFloat = 0
    @Field var currentValue: CGFloat = 0
    @Field var minLabelColor: Color?
    @Field var tintColor: Color?
    @Field var maxLabelColor: Color?
    @Field var currentValueColor: Color?
    @Field var valueExtension: String?
    @Field var gaugeStyle: String?
}

struct GaugeView: ExpoSwiftUI.View {
    @EnvironmentObject var props: GaugeProps

    var body: some View {
        if #available(iOS 16.0, *) {
            Gauge(value: props.currentValue, in: props.minValue ... props.maxValue) {
                Children()
            } currentValueLabel: {
                Text("\(Int(props.currentValue))\(props.valueExtension ?? "")")
                    .foregroundStyle(props.currentValueColor ?? Color.green)
            } minimumValueLabel: {
                Text("\(Int(props.minValue))\(props.valueExtension ?? "")")
                    .foregroundStyle(props.minLabelColor ?? Color.green)
            } maximumValueLabel: {
                Text("\(Int(props.maxValue))\(props.valueExtension ?? "")")
                    .foregroundStyle(props.maxLabelColor ?? Color.red)
            }
            .tint(props.tintColor)
            .if(props.gaugeStyle == "linearCapacity") { $0.gaugeStyle(.linearCapacity) }
            .if(props.gaugeStyle == "linear") { $0.gaugeStyle(.linearCapacity) }
            .if(props.gaugeStyle == "accessoryLinear") { $0.gaugeStyle(.accessoryLinear) }
            .if(props.gaugeStyle == "accessoryCircular") { $0.gaugeStyle(.accessoryCircular) }
            .if(props.gaugeStyle == "accessoryCircularCapacity") { $0.gaugeStyle(.accessoryCircularCapacity) }
            .if(props.gaugeStyle == "automatic") { $0.gaugeStyle(.automatic) }

        } else {
            // Simple fallback for iOS versions older then 16.0 using a progress view.
            ProgressView(value: props.currentValue, total: props.maxValue)
                .progressViewStyle(LinearProgressViewStyle())
                .tint(props.tintColor)
        }
    }
}
