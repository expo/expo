// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class StepperProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var label: String
  @Field var defaultValue: Int?
  @Field var min: Int = 0
  @Field var max: Int = 100
  @Field var step: Int = 1
  var onValueChanged = EventDispatcher()
}

struct StepperView: ExpoSwiftUI.View {
  @ObservedObject var props: StepperProps
  @State var value: Int

  init(props: StepperProps) {
    self.props = props
    let initialValue = props.defaultValue ?? 0
    let clampedValue = max(props.min, min(props.max, initialValue))
    self._value = State(initialValue: clampedValue)
  }

  var body: some View {
    Stepper(props.label, value: $value, in: props.min...props.max, step: props.step)
      .onChange(of: value, perform: { newValue in
        props.onValueChanged(([
          "value": Int(newValue)
        ]))
      })
      .onAppear {
        // Ensure the value is set correctly when the view appears
        if let defaultValue = props.defaultValue {
          let clampedValue = max(props.min, min(props.max, defaultValue))
          value = clampedValue
        }
      }
      .modifier(CommonViewModifiers(props: props))
  }
}
