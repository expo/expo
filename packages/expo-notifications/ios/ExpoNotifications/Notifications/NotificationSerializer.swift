//  Copyright © 2024 650 Industries. All rights reserved.

internal class NotificationSerializer {

  // declared separately from NotificationTriggerRecord to avoid
  // "Use of 'type' refers to instance method rather than global function 'type(of:)' in module 'Swift'"
  static func ClassName(of: Any) -> String {
    return String(describing: type(of: of))
  }
}
