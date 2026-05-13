// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

struct SliderView: ExpoSwiftUI.View {
  @ObservedObject var props: SliderProps
  @State var value: Float = 0.0
  @State var isEditing: Bool = false
  
  init(props: SliderProps) {
    self.props = props
  }

  var body: some View {
#if !os(tvOS)
    sliderContent
      .onAppear {
        value = clamp(props.value ?? 0.0)
      }
      .onChange(of: props.value) { newValue in
        guard !isEditing else { return }
        value = clamp(newValue ?? 0.0)
      }
      .onChange(of: value) { newValue in
        if props.value != newValue {
          props.onValueChanged([
            "value": newValue
          ])
        }
      }
#else
    Text("Slider is not supported on tvOS")
#endif
  }

#if !os(tvOS)
  private func clamp(_ raw: Float) -> Float {
    let lower = Swift.max(props.min ?? -.infinity, props.lowerLimit ?? -.infinity)
    let upper = Swift.min(props.max ?? .infinity, props.upperLimit ?? .infinity)
    return Swift.min(upper, Swift.max(lower, raw))
  }

  private var clampedBinding: Binding<Float> {
    Binding(
      get: { value },
      set: { newValue in value = clamp(newValue) }
    )
  }

  @ViewBuilder
  private var sliderContent: some View {
    let label = props.children?.slot("label")
    let minimumValueLabel = props.children?.slot("minimum")
    let maximumValueLabel = props.children?.slot("maximum")

    if let min = props.min, let max = props.max, let step = props.step {
      Slider(
        value: clampedBinding,
        in: min...max,
        step: step,
        label: { label },
        minimumValueLabel: { minimumValueLabel },
        maximumValueLabel: { maximumValueLabel }
      ) { isEditing in
        self.isEditing = isEditing
        props.onEditingChanged(["isEditing": isEditing])
      }
    } else if let min = props.min, let max = props.max {
      Slider(
        value: clampedBinding,
        in: min...max,
        label: { label },
        minimumValueLabel: { minimumValueLabel },
        maximumValueLabel: { maximumValueLabel }
      ) { isEditing in
        self.isEditing = isEditing
        props.onEditingChanged(["isEditing": isEditing])
      }
    } else if let step = props.step {
      Slider(
        value: clampedBinding,
        in: 0...1,
        step: step,
        label: { label },
        minimumValueLabel: { minimumValueLabel },
        maximumValueLabel: { maximumValueLabel }
      ) { isEditing in
        self.isEditing = isEditing
        props.onEditingChanged(["isEditing": isEditing])
      }
    } else {
      Slider(
        value: clampedBinding,
        label: { label },
        minimumValueLabel: { minimumValueLabel },
        maximumValueLabel: { maximumValueLabel }
      ) { isEditing in
        self.isEditing = isEditing
        props.onEditingChanged(["isEditing": isEditing])
      }
    }
  }
#endif
}

final class SliderProps: UIBaseViewProps {
  @Field var value: Float?
  @Field var step: Float?
  @Field var min: Float?
  @Field var max: Float?
  @Field var lowerLimit: Float?
  @Field var upperLimit: Float?
  var onValueChanged = EventDispatcher()
  var onEditingChanged = EventDispatcher()
}

