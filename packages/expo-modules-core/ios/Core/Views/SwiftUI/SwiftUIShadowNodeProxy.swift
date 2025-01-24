// Copyright 2025-present 650 Industries. All rights reserved.
extension ExpoSwiftUI {
  open class ShadowNodeProxy: ObservableObject, Record {
    public required init() {}

    public var setViewSize: ((CGSize) -> Void)?
  }
}
