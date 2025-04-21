// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

class StepperProps: ExpoSwiftUI.ViewProps {
  @Field var value: Float = 0
  @Field var step: Float = 1
  @Field var label: String = ""
  @Field var min: Float?
  @Field var max: Float?
  var onValueChanged = EventDispatcher()
}

struct StepperView: ExpoSwiftUI.View, ExpoSwiftUI.WithHostingView {
  @ObservedObject var props: StepperProps
  @EnvironmentObject var shadowNodeProxy: ExpoSwiftUI.ShadowNodeProxy

  init(props: StepperProps) {
    self.props = props
  }

  private var value: Binding<Float> {
    .init(
      get: { self.props.value },
      set: {
        if props.value != $0 {
          self.props.onValueChanged(["value": $0])
        }
      }
    )
  }

  private var range: ClosedRange<Float> {
    (props.min ?? -.infinity)...(props.max ?? .infinity)
  }

  var body: some View {
    #if os(tvOS)
    Text("Stepper not supported on tvOS")
    #else
    ExpoSwiftUI.AutoSizingStack(shadowNodeProxy: shadowNodeProxy) {
      Stepper(props.label, value: value, in: range, step: props.step)
    }
    #endif
  }
}
