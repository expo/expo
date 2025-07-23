import AVFoundation
import Foundation

class DeviceDiscovery {
  private let frontCameraDiscoverySession: AVCaptureDevice.DiscoverySession
  private let backCameraDiscoverySession: AVCaptureDevice.DiscoverySession

  private var allDeviceTypes: [AVCaptureDevice.DeviceType] = [
    // Suitable for general-purpose use.
    .builtInWideAngleCamera,
    // Longer focal length than wide angle camera
    .builtInTelephotoCamera,
    // Shorter focal length than wide angle camera
    .builtInUltraWideCamera,
    // Infrared camera provides high-quality depth information that’s synchronized and perspective corrected to the frame the YUV camera produces.
    .builtInTrueDepthCamera,
    // Virtual cameras
    // Type that consists of a wide-angle and telephoto camera.
    .builtInDualCamera,
    // Type that consists of two cameras of fixed focal length, one ultrawide angle and one wide angle.
    .builtInDualWideCamera,
    // Type that consists of three cameras of fixed focal length, one ultrawide angle, one wide angle, and one telephoto.
    .builtInTripleCamera
  ]

  init() {
    if #available(iOS 17, *) {
      allDeviceTypes.append(.continuityCamera)
    }
    if #available(iOS 15.4, *) {
      // LiDAR camera provides high-quality, high-accuracy depth information by measuring the round trip of an artificial light signal that a laser emits.
      allDeviceTypes.append(.builtInLiDARDepthCamera)
    }

    backCameraDiscoverySession = AVCaptureDevice.DiscoverySession(
      deviceTypes: allDeviceTypes,
      mediaType: .video,
      position: .back)
    frontCameraDiscoverySession = AVCaptureDevice.DiscoverySession(
      deviceTypes: allDeviceTypes,
      mediaType: .video,
      position: .front)

    if #available(iOS 17.0, *) {
      if AVCaptureDevice.systemPreferredCamera == nil {
        AVCaptureDevice.userPreferredCamera = backCameraDiscoverySession.devices.first
      }
    }
  }

  private var cameras: [AVCaptureDevice] {
    var cameras: [AVCaptureDevice] = []
    cameras.append(contentsOf: backCameraDiscoverySession.devices)
    cameras.append(contentsOf: frontCameraDiscoverySession.devices)

#if !targetEnvironment(simulator)
    if cameras.isEmpty {
      return []
    }
#endif

    return Array(Set(cameras))
  }

  var frontCameraLenses: [AVCaptureDevice] {
    return cameras.filter { camera in
      camera.position == .front
    }
  }

  var backCameraLenses: [AVCaptureDevice] {
    return cameras.filter { camera in
      camera.position == .back
    }
  }

  var defaultBackCamera: AVCaptureDevice? {
    // iOS 17+: Check system preferred camera
    if #available(iOS 17.0, *) {
      if let preferred = AVCaptureDevice.systemPreferredCamera, preferred.position == .back {
        if self.backCameraLenses.contains(preferred) {
          return preferred
        }
      }
    }

    // Check standard default video device
    if let standardDefault = AVCaptureDevice.default(for: .video), standardDefault.position == .back {
      if self.backCameraLenses.contains(standardDefault) {
        return standardDefault
      }
    }

    // Fallback: Return the first device found by the back discovery session.
    // Devices are ordered by their position in the `allDeviceTypes` array.
    // The first device is likely the default.
    if let first = self.backCameraDiscoverySession.devices.first {
      return first
    }

    // The device has no available rear cameras
    return nil
  }

  var defaultFrontCamera: AVCaptureDevice? {
    // Check specifically for the default built-in wide-angle front camera.
    // Most common front camera
    if let standardFront = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front) {
      if self.frontCameraLenses.contains(standardFront) {
        return standardFront
      }
    }

    // iOS 17+: Check system preferred camera, this is unlikely to be the front camera
    if #available(iOS 17.0, *) {
      if let preferred = AVCaptureDevice.systemPreferredCamera, preferred.position == .front {
        if self.frontCameraLenses.contains(preferred) {
          return preferred
        }
      }
    }

    // Fallback: Return the first device found by the front discovery session.
    // Devices are ordered by their position in the `allDeviceTypes` array.
    // The first device is likely the default.
    if let firstFront = self.frontCameraDiscoverySession.devices.first {
      return firstFront
    }

    // The device has no available front cameras
    return nil
  }
}
