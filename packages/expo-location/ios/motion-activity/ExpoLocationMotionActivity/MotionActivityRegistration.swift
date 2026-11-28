// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoLocation
import Foundation

@objc(EXLocationMotionActivityRegistration)
public final class MotionActivityRegistration: NSObject {
  @objc
  public static func registerProvider() {
    MotionActivityRegistry.provider = CoreMotionActivityProvider()
  }
}
