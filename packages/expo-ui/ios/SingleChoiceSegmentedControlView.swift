// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

struct SingleChoiceSegmentedControlView: ExpoSwiftUI.View {
  @State var selection: Int? = nil
  @EnvironmentObject var props: SingleChoiceSegmentedControlProps
  var body: some View {
    Picker("", selection: $selection) {
      ForEach(Array(props.options.enumerated()), id: \.element) { (index, option)  in
        Text(option).tag(index)
      }
    }.pickerStyle(SegmentedPickerStyle())
      .onChange(of: selection, perform: {
      newValue in
        if(props.selectedIndex == newValue) {
          return
        }
        props.onOptionSelected([
          "index": newValue ?? 0,
          "label": props.options[newValue ?? 0]
        ]);
      })
    .onReceive(props.selectedIndex.publisher, perform: {
      newVal in selection = newVal
    })
  }
}
