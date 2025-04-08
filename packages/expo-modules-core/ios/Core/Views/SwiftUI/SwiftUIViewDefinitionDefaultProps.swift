// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI

/**
 An empty class that conforms to ExpoSwiftUI.ViewProps.
 */
public class ExpoSwiftUIDefaultProps: ExpoSwiftUI.ViewProps {}

/**
 Fallback to ExpoSwiftUIDefaultProps when Props are not declared.
 */
public extension ExpoSwiftUIView {
  var props: ExpoSwiftUIDefaultProps {
    ExpoSwiftUIDefaultProps()
  }
}
