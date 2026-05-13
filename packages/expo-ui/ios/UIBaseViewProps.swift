// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

/**
 Base view props for all SwiftUI view props in expo-ui.
 Contains common modifiers that are shared across most views.
 */
open class UIBaseViewProps: ExpoSwiftUI.ViewProps {
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  /**
   The default alignment for frame modifiers. Views can override this in their props class.
   */
  internal var defaultFrameAlignment: Alignment { .center }

  public required init() {
    super.init()
  }

  public required init(rawProps: [String: Any], context: AppContext) throws {
    try super.init(rawProps: rawProps, context: context)
  }
}
