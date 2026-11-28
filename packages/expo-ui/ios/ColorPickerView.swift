// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

@ViewProps(extending: ExpoUIViewProps.self)
public struct ColorPickerProps {
  var selection: Color = .clear
  var label: String?
  var supportsOpacity: Bool = true
  var onSelectionChange: (ColorPickerChangeEvent) -> Void
}

@Record
struct ColorPickerChangeEvent {
  var value: String = ""
}

@ExpoView<ColorPickerProps>
public struct ColorPickerView: View {
  @State private var previousHex: String = ""
  @State private var selection: Color = .clear

  public var body: some View {
    colorPicker
      .applyExpoUIViewProps(props.base, appContext: appContext)
  }

  @ViewBuilder
  private var colorPicker: some View {
#if !os(tvOS)
    ColorPicker(props.label ?? "", selection: $selection, supportsOpacity: props.supportsOpacity)
      .onAppear {
        selection = props.selection
        previousHex = Self.colorToHex(props.selection, supportsOpacity: props.supportsOpacity)
      }
      .onChange(of: props.selection) { newValue in
        selection = newValue
        previousHex = Self.colorToHex(newValue, supportsOpacity: props.supportsOpacity)
      }
      .onChange(of: selection) { newValue in
        let newHex = Self.colorToHex(newValue, supportsOpacity: props.supportsOpacity)
        if newHex != previousHex {
          previousHex = newHex
          props.onSelectionChange(ColorPickerChangeEvent(value: newHex))
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
    ].map { Int(max(0, min(255, ($0 * 255).rounded()))) }

    let format = supportsOpacity ? "#%02X%02X%02X%02X" : "#%02X%02X%02X"
    return String(format: format, rgba[0], rgba[1], rgba[2], supportsOpacity ? rgba[3] : 255)
  }
}
