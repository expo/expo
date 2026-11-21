// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

@ViewProps(extending: ExpoUIViewProps.self)
public struct StepperProps {
  var label = ""
  var value = 0
  var min = 0
  var max = 100
  var step = 1
  var onValueChange: (StepperValueChange) -> Void
}

@Record
struct StepperValueChange {
  var value: Int = 0
}

@ExpoView<StepperProps>
public struct StepperView: View {
  @State private var value: Int = 0

  public var body: some View {
    stepper.applyExpoUIViewProps(props.base, appContext: appContext)
  }

  @ViewBuilder
  private var stepper: some View {
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
          props.onValueChange(StepperValueChange(value: newValue))
        }
      }
#else
    EmptyView()
#endif
  }
}
