// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

struct SliderView: ExpoSwiftUI.View {
  @ObservedObject var props: SliderProps
  @State var value: Float = 0.0
  @State private var eventCount: Int = 0

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
        // A prop JS produced before our newest change is a stale echo of a drag that has
        // since moved on, so applying it would pull the thumb back from under the finger.
        if let seenCount = props.mostRecentEventCount, seenCount < eventCount {
          return
        }
        value = clamp(newValue ?? 0.0)
      }
      .onChange(of: value) { newValue in
        if props.value != newValue {
          eventCount += 1
          props.onValueChanged([
            "value": newValue,
            "eventCount": eventCount
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
    let hasAnyLabel = label != nil || minimumValueLabel != nil || maximumValueLabel != nil

    let handleEditingChanged: (Bool) -> Void = { isEditing in
      props.onEditingChanged(["isEditing": isEditing])
    }

    if let min = props.min, let max = props.max, let step = props.step {
      if hasAnyLabel {
        Slider(
          value: clampedBinding,
          in: min...max,
          step: step,
          label: { label },
          minimumValueLabel: { minimumValueLabel },
          maximumValueLabel: { maximumValueLabel },
          onEditingChanged: handleEditingChanged
        )
      } else {
        Slider(
          value: clampedBinding,
          in: min...max,
          step: step,
          onEditingChanged: handleEditingChanged
        )
      }
    } else if let min = props.min, let max = props.max {
      if hasAnyLabel {
        Slider(
          value: clampedBinding,
          in: min...max,
          label: { label },
          minimumValueLabel: { minimumValueLabel },
          maximumValueLabel: { maximumValueLabel },
          onEditingChanged: handleEditingChanged
        )
      } else {
        Slider(
          value: clampedBinding,
          in: min...max,
          onEditingChanged: handleEditingChanged
        )
      }
    } else if let step = props.step {
      if hasAnyLabel {
        Slider(
          value: clampedBinding,
          in: 0...1,
          step: step,
          label: { label },
          minimumValueLabel: { minimumValueLabel },
          maximumValueLabel: { maximumValueLabel },
          onEditingChanged: handleEditingChanged
        )
      } else {
        Slider(
          value: clampedBinding,
          in: 0...1,
          step: step,
          onEditingChanged: handleEditingChanged
        )
      }
    } else {
      if hasAnyLabel {
        Slider(
          value: clampedBinding,
          label: { label },
          minimumValueLabel: { minimumValueLabel },
          maximumValueLabel: { maximumValueLabel },
          onEditingChanged: handleEditingChanged
        )
      } else {
        Slider(
          value: clampedBinding,
          onEditingChanged: handleEditingChanged
        )
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
  @Field var mostRecentEventCount: Int?
  var onValueChanged = EventDispatcher()
  var onEditingChanged = EventDispatcher()
}

