//  Copyright © 2022-present 650 Industries. All rights reserved.

import Foundation

@objc(EXUpdatesControllerRegistry)
@objcMembers
public final class UpdatesControllerRegistry: NSObject {
  public weak var controller: UpdatesExternalInterface?

  public static let sharedInstance = UpdatesControllerRegistry()
}
