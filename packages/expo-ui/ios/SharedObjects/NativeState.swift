// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI
import Combine

open class NativeStateBase: SharedObject, ObservableObject {}

public final class NativeStateString: NativeStateBase {
  @Published public var value: String = ""
}

public final class NativeStateDouble: NativeStateBase {
  @Published public var value: Double = 0.0
}

public final class NativeStateBool: NativeStateBase {
  @Published public var value: Bool = false
}
