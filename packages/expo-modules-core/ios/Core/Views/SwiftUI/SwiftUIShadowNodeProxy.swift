// Copyright 2025-present 650 Industries. All rights reserved.
extension ExpoSwiftUI {
  open class ShadowNodeProxy: ObservableObject, Record {
    public required init() {}

    // We use Double.nan to mark a dimension as unset. This value is passed to https://github.com/facebook/yoga/blob/49ee855f99fb67079c24d507a4ea1b6d80fa2ebf/yoga/style/StyleLength.h#L33
    static let UNDEFINED_SIZE = Double.nan

    // Used for nested SwiftUI views
    static let SHADOW_NODE_MOCK_PROXY = ShadowNodeProxy()

    public var setViewSize: ((CGSize) -> Void)?
    public var setStyleSize: ((NSNumber?, NSNumber?) -> Void)?
  }
}
