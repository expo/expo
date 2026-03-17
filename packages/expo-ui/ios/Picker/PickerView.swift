// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class PickerProps: UIBaseViewProps {
  @Field var label: String?
  @Field var systemImage: String?
  @Field var selection: Either<String, Double>?
  var onSelectionChange = EventDispatcher()
}

internal struct PickerView: ExpoSwiftUI.View {
  @State var selection: AnyHashable?
  @ObservedObject var props: PickerProps
  
  init(props: PickerProps) {
    self.props = props
  }

  @ViewBuilder
  private func makePicker() -> some View {
    let content = props.children?.slot("content")

    let labelContent = props.children?.slot("label")

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

    picker
    .onChange(of: selection) { newValue in
      guard let newValue else { return }
      let currentSelection = Self.getHashableFromEither(props.selection)
      if currentSelection == newValue {
        return
      }
      let payload: [String: Any]
      if let stringValue = newValue as? String {
        payload = ["selection": stringValue]
      } else if let doubleValue = newValue as? Double {
        payload = ["selection": doubleValue]
      } else {
        return
      }
      props.onSelectionChange(payload)
    }
    .onChange(of: props.selection) { newValue in
      selection = Self.getHashableFromEither(newValue)
    }
    .onAppear {
      selection = Self.getHashableFromEither(props.selection)
    }
  }

  private static func getHashableFromEither(_ either: Either<String, Double>?) -> AnyHashable? {
    guard let either else { return nil }
    if let stringValue: String = either.get() {
      return stringValue
    }
    if let doubleValue: Double = either.get() {
      return doubleValue
    }
    return nil
  }
}
