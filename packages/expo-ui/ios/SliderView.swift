// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class SliderProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var value: Float?
  @Field var steps: Int = 0
  @Field var min: Float = 0.0
  @Field var max: Float = 1.0
  @Field var color: Color?
  var onValueChanged = EventDispatcher()
}

func getStep(_ min: Float, _ max: Float, _ steps: Int) -> Float {
  if steps == 0 {
    // Continous (no steps)
    return 0.00001
  }
  // Matching Jetpack Compose where steps is the number of discreete points
  return (max - min) / Float(steps + 1)
}

struct SliderView: ExpoSwiftUI.View {
  @ObservedObject var props: SliderProps
  @State var value: Float = 0.0

  init(props: SliderProps) {
    self.props = props
  }

  var body: some View {
    #if !os(tvOS)
    Slider(value: $value, in: props.min...props.max, step: getStep(props.min, props.max, props.steps) )
    .modifier(CommonViewModifiers(props: props))
    .onChange(of: value, perform: { newValue in
      if props.value == newValue {
        return
      }
      // TODO: onChange(of: Float) action tried to update multiple times per frame.
      props.onValueChanged([
        "value": newValue
      ])
    })
    .tint(props.color)
    .onReceive(props.value.publisher, perform: { newValue in
      var sliderValue = newValue
      sliderValue = max(sliderValue, props.min)
      sliderValue = min(sliderValue, props.max)
      value = sliderValue
    })
    #else
    Text("Slider is not supported on tvOS")
    #endif
  }
}
