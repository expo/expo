// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class PickerProps: UIBaseViewProps {
  @Field var label: String?
  @Field var systemImage: String?
  @Field var selection: String?
  var onSelectionChange = EventDispatcher()
}

internal struct PickerView: ExpoSwiftUI.View {
  @State var selection: String?
  @State var prevSelectedIndex: String?
  @ObservedObject var props: PickerProps

  init(props: PickerProps) {
    self.props = props
  }

  @ViewBuilder
  private func makePicker() -> some View {
    let content = (props.children?
      .compactMap { $0.childView as? PickerContentView }
      .first)

    let labelContent = props.children?
      .compactMap { $0.childView as? PickerLabelView }
      .first
    
    if let systemImage = props.systemImage, let label = props.label {
      Picker(label, systemImage: systemImage, selection: $selection) { content }
    } else if let labelContent {
      Picker(selection: $selection) { content } label: { labelContent }
    } else if let label = props.label {
      Picker(label, selection: $selection, content: { content })
    }
  }
  
  var body: some View {
    let picker = makePicker()
   
    picker.onChange(of: selection, perform: { newValue in
      guard let newValue else { return }
      if props.selection == newValue { return }
      let payload = [
        "selection": newValue,
      ]
      props.onSelectionChange(payload)
    })
    .onReceive(props.selection.publisher, perform: { newValue in
      if prevSelectedIndex == newValue { return }
      selection = newValue
      prevSelectedIndex = newValue
    })
  }
}
