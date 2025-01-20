// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

class SliderProps: ExpoSwiftUI.ViewProps {
  @Field var value: Float?
  @Field var steps: Int = 0
  @Field var min: Float = 0.0
  @Field var max: Float = 1.0

  var onValueChanged = EventDispatcher()
}

func getStep(_ min: Float, _ max: Float, _ steps: Int) -> Float {
  if(steps == 0) {
    // Continous (no steps)
    return 0.00001
  }
  // Matching Jetpack Compose where steps is the number of discreete points
  return (max - min) / Float(steps + 1)
}

struct SliderView: ExpoSwiftUI.View {
  @EnvironmentObject var props: SliderProps
  @State var value: Float = 0.0
  
  var body: some View {
    Slider(value: $value, in: props.min...props.max, step: getStep(props.min, props.max, props.steps) )
    .onChange(of: value, perform: { newValue in
      if props.value == newValue {
        return
      }
      // onChange(of: Float) action tried to update multiple times per frame.
      props.onValueChanged([
        "value": newValue
      ])
    })
    .onReceive(props.value.publisher, perform: { newValue in
      var sliderValue = newValue
      sliderValue = max(sliderValue, props.min)
      sliderValue = min(sliderValue, props.max)
      value = sliderValue
    })
  }
}
