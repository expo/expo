// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal final class MenuProps: UIBaseViewProps {
  @Field var label: String?
  @Field var systemImage: String?
  @Field var hasPrimaryAction: Bool = false
  var onPrimaryAction = EventDispatcher()
}

internal final class MenuLabelProps: ExpoSwiftUI.ViewProps {}
