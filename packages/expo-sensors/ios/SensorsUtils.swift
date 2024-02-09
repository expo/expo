// Copyright 2023-present 650 Industries. All rights reserved.

import CoreMotion

internal func getAttitudeReferenceFrame() -> CMAttitudeReferenceFrame {
  let referenceFrames = CMMotionManager.availableAttitudeReferenceFrames()
  return referenceFrames.contains(.xMagneticNorthZVertical) ? .xMagneticNorthZVertical : .xArbitraryCorrectedZVertical
}

internal func getDeviceOrientationRotation() -> Int {
  let orientation = UIDevice.current.orientation

  switch orientation {
  case .portrait:
    return 0
  case .landscapeLeft:
    return -90
  case .landscapeRight:
    return 90
  case .portraitUpsideDown:
    return 180
  default:
    return 0
  }
}

internal func radiansToDegrees(_ radians: Double) -> Double {
  return radians * 180 / Double.pi
}
