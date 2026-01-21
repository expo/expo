// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class SharedObjectTesterProps: UIBaseViewProps {
  @Field var sharedObject: DummySharedObject?
  var onValueChange = EventDispatcher()
}
