// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

class ColorPickerProps: ExpoSwiftUI.ViewProps {
  @Field var selection: UIColor = .clear
  @Field var label: String?
  @Field var supportsOpacity: Bool = true
  
  var onValueChanged = EventDispatcher()
}

struct ColorPickerView: ExpoSwiftUI.View {
  @EnvironmentObject var props: ColorPickerProps
  @State var color: Color = .clear
  @State private var previousHex: String = ""
  
  var body: some View {
    ColorPicker(props.label ?? "", selection: $color, supportsOpacity: props.supportsOpacity)
      .onAppear {
        color = Color(props.selection)
        previousHex = colorToHex(props.selection)
      }
      .onChange(of: color) { newValue in
        let newHex = colorToHex(UIColor(newValue))
        
        if newHex != previousHex {
          previousHex = newHex
          let payload = ["hex": newHex]
          props.onValueChanged(payload)
        }
      }
  }
  
  private func colorToHex(_ color: UIColor) -> String {
    var red: CGFloat = 0, green: CGFloat = 0, blue: CGFloat = 0, alpha: CGFloat = 0
    color.getRed(&red, green: &green, blue: &blue, alpha: &alpha)
    
    let components = [red, green, blue, alpha].map { Int($0 * 255) }
    let format = props.supportsOpacity ? "#%02X%02X%02X%02X" : "#%02X%02X%02X"
    
    return props.supportsOpacity 
      ? String(format: format, components[0], components[1], components[2], components[3])
      : String(format: format, components[0], components[1], components[2])
  }
}

