// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class ColorPickerProps: UIBaseViewProps {
  @Field var selection: Color = .clear
  @Field var label: String?
  @Field var supportsOpacity: Bool = true
  var onValueChanged = EventDispatcher()
}

struct ColorPickerView: ExpoSwiftUI.View {
  @ObservedObject var props: ColorPickerProps
  @State private var previousHex: String = ""
  @State private var selection: Color = .clear

  init(props: ColorPickerProps) {
    self.props = props
    _selection = State(initialValue: props.selection)
    _previousHex = State(initialValue: Self.colorToHex(props.selection, supportsOpacity: props.supportsOpacity))
  }

  var body: some View {
#if !os(tvOS)
    ColorPicker(props.label ?? "", selection: $selection, supportsOpacity: props.supportsOpacity)
      .onChange(of: selection) { newValue in
        let newHex = Self.colorToHex(newValue, supportsOpacity: props.supportsOpacity)
        if newHex != previousHex {
          previousHex = newHex
          let payload = ["value": newHex]
          props.onValueChanged(payload)
        }
      }
#else
    EmptyView()
#endif
  }

  private static func colorToHex(_ color: Color, supportsOpacity: Bool) -> String {
    let newColor = UIColor(color)
    guard let components = newColor.cgColor.components else {
      return ""
    }

    let rgba = [
      components[0],
      components.count > 1 ? components[1] : components[0],
      components.count > 2 ? components[2] : components[0],
      newColor.cgColor.alpha
    ].map { Int(max(0, min(255, $0 * 255))) }

    let format = supportsOpacity ? "#%02X%02X%02X%02X" : "#%02X%02X%02X"
    return String(format: format, rgba[0], rgba[1], rgba[2], supportsOpacity ? rgba[3] : 255)
  }
}
