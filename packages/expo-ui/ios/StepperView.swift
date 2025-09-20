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
  @Field var value: Int
  var onIncrement = EventDispatcher()
  var onDecrement = EventDispatcher()
}

struct StepperView: ExpoSwiftUI.View {
  @ObservedObject var props: StepperProps

  var body: some View {
    #if !os(tvOS)
    Stepper(
      props.label,
      onIncrement: {
        props.onIncrement(([
          "value": props.value
        ]))
      },
      onDecrement: {
        props.onDecrement(([
          "value": props.value
        ]))
      }
    )
    .modifier(CommonViewModifiers(props: props))
    #else
    Text("Stepper is not supported on tvOS")
    #endif
  }
}
