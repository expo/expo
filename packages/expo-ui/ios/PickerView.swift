// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

class PickerProps: ExpoSwiftUI.ViewProps {
  @Field var options: [String] = []
  @Field var selectedIndex: Int?
  @Field var variant: String?
  @Field var label: String?
  var onOptionSelected = EventDispatcher()
}

struct PickerView: ExpoSwiftUI.View {
  @State var selection: Int?
  @State var prevSelectedIndex: Int?
  @EnvironmentObject var props: PickerProps

  var body: some View {
    if #available(iOS 17.0, *) {
      Picker(props.label ?? "", selection: $selection) {
        ForEach(Array(props.options.enumerated()), id: \.element) { index, option in
          Text(option).tag(index)
        }
      }
      .if(props.variant == "wheel", { $0.pickerStyle(.wheel) })
      .if(props.variant == "segmented", { $0.pickerStyle(.segmented) })
      .if(props.variant == "menu", { $0.pickerStyle(.menu) })
      .onChange(of: selection, perform: { newValue in
        if props.selectedIndex == newValue {
          return
        }
        props.onOptionSelected([
          "index": newValue ?? 0,
          "label": props.options[newValue ?? 0]
        ])
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
