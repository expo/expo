// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class StepperProps: UIBaseViewProps {
  @Field var label: String
  @Field var value: Int = 0
  @Field var min: Int = 0
  @Field var max: Int = 100
  @Field var step: Int = 1
  var onValueChange = EventDispatcher()
}

struct StepperView: ExpoSwiftUI.View {
  @ObservedObject var props: StepperProps
  @State var value: Int = 0
  
  init(props: StepperProps) {
    self.props = props
  }

  var body: some View {
#if !os(tvOS)
    Stepper(props.label, value: $value, in: props.min...props.max, step: props.step)
      .onAppear {
        value = max(props.min, min(props.max, props.value))
      }
      .onChange(of: props.value) { newValue in
        value = max(props.min, min(props.max, newValue))
      }
      .onChange(of: value) { newValue in
        if props.value != newValue {
          props.onValueChange(["value": Int(newValue)])
        }
      }
#else
    EmptyView()
#endif
  }
}
