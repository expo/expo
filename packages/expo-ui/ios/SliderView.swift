// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

struct SliderView: ExpoSwiftUI.View {
  @ObservedObject var props: SliderProps
  @State var value: Float = 0.0

  init(props: SliderProps) {
    self.props = props
  }

  var body: some View {
    #if !os(tvOS)
    sliderContent
      .onChange(of: value) { newValue in
        if props.value != newValue {
          props.onValueChanged([
            "value": newValue
          ])
        }
      }
      .onReceive(props.value.publisher, perform: { newValue in
        var sliderValue = newValue
        if let min = props.min {
          sliderValue = max(sliderValue, min)
        }
        if let max = props.max {
          sliderValue = min(sliderValue, max)
        }
        value = sliderValue
      })
    #else
    Text("Slider is not supported on tvOS")
    #endif
  }

  @ViewBuilder
  private var sliderContent: some View {
    let label = props.children?.compactMap({ $0.childView as? SliderLabelView })
    .first(where: { $0.props.kind == .label })
    let minimumValueLabel = props.children?
      .compactMap({ $0.childView as? SliderLabelView })
      .first(where: { $0.props.kind == .minimum })
    let maximumValueLabel = props.children?
      .compactMap({ $0.childView as? SliderLabelView })
      .first(where: { $0.props.kind == .maximum })

    if let min = props.min, let max = props.max, let step = props.step {
      Slider(
        value: $value,
        in: min...max,
        step: step,
        label: { label },
        minimumValueLabel: { minimumValueLabel },
        maximumValueLabel: { maximumValueLabel }
      ) { isEditing in
        props.onEditingChanged(["isEditing": isEditing])
      }
    } else if let min = props.min, let max = props.max {
      Slider(
        value: $value,
        in: min...max,
        label: { label },
        minimumValueLabel: { minimumValueLabel },
        maximumValueLabel: { maximumValueLabel }
      ) { isEditing in
        props.onEditingChanged(["isEditing": isEditing])
      }
    } else if let step = props.step {
      Slider(
        value: $value,
        in: 0...1,
        step: step,
        label: { label },
        minimumValueLabel: { minimumValueLabel },
        maximumValueLabel: { maximumValueLabel }
      ) { isEditing in
        props.onEditingChanged(["isEditing": isEditing])
      }
    } else {
      Slider(
        value: $value,
        label: { label },
        minimumValueLabel: { minimumValueLabel },
        maximumValueLabel: { maximumValueLabel }
      ) { isEditing in
        props.onEditingChanged(["isEditing": isEditing])
      }
    }
  }
}

final class SliderProps: UIBaseViewProps {
  @Field var value: Float?
  @Field var step: Float?
  @Field var min: Float?
  @Field var max: Float?
  var onValueChanged = EventDispatcher()
  var onEditingChanged = EventDispatcher()
}

internal enum SliderLabelKind: String, Enumerable {
  case label
  case minimum
  case maximum
}

internal final class SliderLabelProps: ExpoSwiftUI.ViewProps {
  @Field var kind: SliderLabelKind = .minimum
}

internal struct SliderLabelView: ExpoSwiftUI.View {
  @ObservedObject var props: SliderLabelProps

  var body: some View {
    Children()
  }
}
