// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class PickerProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var options: [String] = []
  @Field var selectedIndex: Int?
  @Field var variant: String?
  @Field var label: String?
  @Field var color: Color?
  var onOptionSelected = EventDispatcher()
}

struct PickerView: ExpoSwiftUI.View {
  @State var selection: Int = 0
  @State var prevSelectedIndex: Int?
  @ObservedObject var props: PickerProps

  init(props: PickerProps) {
    self.props = props
  }

  var body: some View {
    if #available(iOS 17.0, tvOS 17.0, *) {
      Picker(props.label ?? "", selection: $selection) {
        ForEach(Array(props.options.enumerated()), id: \.0) { index, option in
          Text(option).tag(index)
        }
      }
      .tint(props.color)
      .modifier(CommonViewModifiers(props: props))
#if !os(tvOS)
      .if(props.variant == "wheel", { $0.pickerStyle(.wheel) })
      .if(props.variant == "palette", { $0.pickerStyle(.palette) })
#endif
      .if(props.variant == "segmented", { $0.pickerStyle(.segmented) })
      .if(props.variant == "inline", { $0.pickerStyle(.inline) })
      .if(props.variant == "menu", { $0.pickerStyle(.menu) })
      .onChange(of: selection, perform: { newValue in
        if props.selectedIndex == newValue {
          return
        }
        let payload = [
          "index": newValue,
          "label": props.options[newValue]
        ]
        props.onOptionSelected(payload)
      })
      .onReceive(props.selectedIndex.publisher, perform: { newValue in
        if prevSelectedIndex == newValue {
          return
        }
        selection = newValue
        prevSelectedIndex = newValue
      })
    }
  }
}
