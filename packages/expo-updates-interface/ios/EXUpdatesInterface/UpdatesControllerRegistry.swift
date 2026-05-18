//  Copyright © 2022-present 650 Industries. All rights reserved.

import Foundation

public final class UpdatesControllerRegistry: NSObject {
  public weak var controller: UpdatesInterface?

  public static let sharedInstance = UpdatesControllerRegistry()
}
