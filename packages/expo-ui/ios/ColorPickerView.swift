// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class ColorPickerProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var selection: Color = .clear
  @Field var label: String?
  @Field var supportsOpacity: Bool = true
  var onValueChanged = EventDispatcher()
}

struct ColorPickerView: ExpoSwiftUI.View {
  @ObservedObject var props: ColorPickerProps
  @State private var previousHex: String = ""
  @State private var selection: Color = .clear

  var body: some View {
#if !os(tvOS)
    ColorPicker(props.label ?? "", selection: $selection, supportsOpacity: props.supportsOpacity)
      .modifier(CommonViewModifiers(props: props))
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
    guard let components = newColor.cgColor.components else {
      return ""
    }

    let rgba = [
      components[0],
      components.count > 1 ? components[1] : components[0],
      components.count > 2 ? components[2] : components[0],
      newColor.cgColor.alpha
    ].map { Int(max(0, min(255, $0 * 255))) }

    let format = props.supportsOpacity ? "#%02X%02X%02X%02X" : "#%02X%02X%02X"
    return String(format: format, rgba[0], rgba[1], rgba[2], props.supportsOpacity ? rgba[3] : 255)
  }
}
