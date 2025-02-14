// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

class ColorPickerProps: ExpoSwiftUI.ViewProps {
  @Field var selection: Color = .clear
  @Field var label: String?
  @Field var supportsOpacity: Bool = true
  var onValueChanged = EventDispatcher()
}

struct ColorPickerView: ExpoSwiftUI.View {
  @EnvironmentObject var props: ColorPickerProps
  @State private var previousHex: String = ""
  @State private var selection: Color = .clear

  var body: some View {
#if !os(tvOS)
    ColorPicker(props.label ?? "", selection: $selection, supportsOpacity: props.supportsOpacity)
      .onAppear {
        selection = props.selection
        previousHex = colorToHex(props.selection)
      }
      .onChange(of: selection) { newValue in
        let newHex = colorToHex(newValue)
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
  private func colorToHex(_ color: Color) -> String {
    let newColor = UIColor(color)
    var red: CGFloat = 0, green: CGFloat = 0, blue: CGFloat = 0, alpha: CGFloat = 0
    newColor.getRed(&red, green: &green, blue: &blue, alpha: &alpha)
    let components = [red, green, blue, alpha].map { Int($0 * 255) }
    let hexComponents = props.supportsOpacity ? components + [Int(alpha * 255)] : components
    let format = props.supportsOpacity ? "#%02X%02X%02X%02X" : "#%02X%02X%02X"
    return String(format: format, arguments: hexComponents)
  }
}
