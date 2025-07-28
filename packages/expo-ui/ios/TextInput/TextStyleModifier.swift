//
//  TextStyleModifier.swift
//  Pods
//
//  Created by Joao Morais on 28/07/25.
//

import SwiftUI

private struct TextStyleModifier: ViewModifier {
  let style: TextStyleProps?
  
  func body(content: Content) -> some View {
    var view = AnyView(content)
    
    guard let ts = style else {
      return view
    }
    if let color = ts.color{
        view = AnyView(view.foregroundColor(Color.convert(color)))
    }
    if let letterSpacing = ts.letterSpacing{
        if #available(iOS 16.0, *) {
          view = AnyView(view.tracking(CGFloat(letterSpacing)))
        }
    }
    let fontSize = CGFloat(ts.size ?? 15)
    if let fontFamily = ts.fontFamily {
        view = AnyView(view.font(.custom(fontFamily, size: fontSize)))
    } else {
        view = AnyView(view.font(.system(size: fontSize)))
    }
    if let weight = ts.fontWeight{
        if #available(iOS 16.0, *) {
            view = AnyView(view.fontWeight(getFontWeight(weight)))
        }
    }
    if let height = ts.lineHeight {
      view = AnyView(view.lineSpacing(CGFloat(height)))
    }
    return view
  }
}

extension View {
  func applyTextStyle(_ style: TextStyleProps?) -> some View {
    self.modifier(TextStyleModifier(style: style))
  }
}
