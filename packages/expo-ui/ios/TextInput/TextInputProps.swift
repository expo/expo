//
//  TextInputProps.swift
//  Pods
//
//  Created by Joao Morais on 23/07/25.
//

import ExpoModulesCore

final class TextStyleProps: ExpoSwiftUI.ViewProps{
  @Field var color: String?
  @Field var size: Int?
  @Field var lineHeight: Int?
  @Field var letterSpacing: Int?
  @Field var height: Int?
  @Field var fontFamily: String?
  @Field var fontWeight: String?
}

final class TextInputProps: ExpoSwiftUI.ViewProps {
  @Field var defaultValue: String = ""
  @Field var multiline: Bool = false
  @Field var numberOfLines: Int?
  @Field var keyboardType: String = "default"
  @Field var autocorrection: Bool = true
  @Field var placeholder: String = ""
  @Field var editable: Bool = true
  @Field var testID: String = ""
  @Field var style: TextStyleProps?
  @Field var secureEntry: Bool = false
  @Field var mask: String?

  var onValueChanged = EventDispatcher()
  var onTextFieldFocus = EventDispatcher()
  var onTextFieldBlur = EventDispatcher()
}
