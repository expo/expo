// Copyright 2026-present 650 Industries. All rights reserved.

import Darwin

/// Contains utils that read the role the system assigned to the current task (process).
internal struct TaskRole {
  /// Returns whether the system runs the app as a background application, for example when it was launched
  /// to handle a background fetch or a silent push notification.
  ///
  /// `UIApplication.applicationState` can't tell this apart in `didFinishLaunching`, because apps using
  /// the scene-based life cycle report `.background` there even when the user launches them from the home screen.
  static func isBackgroundApplication() -> Bool {
    var policy = task_category_policy_data_t()
    var count = mach_msg_type_number_t(MemoryLayout<task_category_policy_data_t>.size / MemoryLayout<integer_t>.size)
    var getDefault: boolean_t = 0
    let result = withUnsafeMutablePointer(to: &policy) { pointer in
      pointer.withMemoryRebound(to: integer_t.self, capacity: Int(count)) { policyPointer in
        task_policy_get(mach_task_self_, task_policy_flavor_t(TASK_CATEGORY_POLICY), policyPointer, &count, &getDefault)
      }
    }

    guard result == KERN_SUCCESS else {
      // Unknown role, assume the app is in the foreground so the startup metrics are not lost
      return false
    }
    return policy.role == TASK_BACKGROUND_APPLICATION
  }
}
