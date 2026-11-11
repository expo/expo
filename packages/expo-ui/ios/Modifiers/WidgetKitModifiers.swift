// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

/**
 * The parts of SwiftUI that are declared in WidgetKit. expo-widgets sets
 * `ViewModifierRegistry.widgetKit`, so ExpoUI does not link WidgetKit.
 */
public protocol WidgetKitModifiers {
  func containerBackground(_ view: AnyView, style: AnyShapeStyle) -> AnyView
  func widgetAccentedRenderingMode(_ image: Image, params: [String: Any], appContext: AppContext) -> AnyView?
}
