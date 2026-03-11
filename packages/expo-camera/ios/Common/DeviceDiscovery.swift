import AVFoundation
import Foundation

protocol DeviceDiscoveryDelegate: AnyObject {
  func deviceDiscovery(_ discovery: DeviceDiscovery, didUpdateDevices devices: [AVCaptureDevice])
}

class DeviceDiscovery {
  private let frontCameraDiscoverySession: AVCaptureDevice.DiscoverySession
  private let backCameraDiscoverySession: AVCaptureDevice.DiscoverySession

  weak var delegate: DeviceDiscoveryDelegate?

  private var frontDevicesObservation: NSKeyValueObservation?
  private var backDevicesObservation: NSKeyValueObservation?

  private static var allDeviceTypes: [AVCaptureDevice.DeviceType] {
    var types: [AVCaptureDevice.DeviceType] = [
      // Primary camera - suitable for general-purpose use
      .builtInWideAngleCamera,
      // Longer focal length than wide angle camera
      .builtInTelephotoCamera,
      // Shorter focal length than wide angle camera
      .builtInUltraWideCamera,
      // TrueDepth camera for Face ID devices
      .builtInTrueDepthCamera,
      // Virtual cameras - these combine multiple physical cameras
      // Triple camera (ultrawide + wide + telephoto)
      .builtInTripleCamera,
      // Dual camera (wide + telephoto)
      .builtInDualCamera,
      // Dual wide camera (ultrawide + wide)
      .builtInDualWideCamera
    ]

    if #available(iOS 15.4, *) {
      // LiDAR camera provides high-quality, high-accuracy depth information by measuring the round trip of an artificial light signal that a laser emits.
      types.append(.builtInLiDARDepthCamera)
    }

    return types
  }

  init() {
    backCameraDiscoverySession = AVCaptureDevice.DiscoverySession(
      deviceTypes: Self.allDeviceTypes,
      mediaType: .video,
      position: .back)
    frontCameraDiscoverySession = AVCaptureDevice.DiscoverySession(
      deviceTypes: Self.allDeviceTypes,
      mediaType: .video,
      position: .front)

    setupDeviceObservation()

    if #available(iOS 17.0, *) {
      if AVCaptureDevice.systemPreferredCamera == nil {
        AVCaptureDevice.userPreferredCamera = backCameraDiscoverySession.devices.first
      }
    }
  }

  deinit {
    frontDevicesObservation?.invalidate()
    backDevicesObservation?.invalidate()
  }

  private func setupDeviceObservation() {
    backDevicesObservation = backCameraDiscoverySession.observe(\.devices, options: [.new]) { [weak self] _, _ in
      self?.notifyDevicesChanged()
    }

    frontDevicesObservation = frontCameraDiscoverySession.observe(\.devices, options: [.new]) { [weak self] _, _ in
      self?.notifyDevicesChanged()
    }
  }

  private func notifyDevicesChanged() {
    delegate?.deviceDiscovery(self, didUpdateDevices: cameras)
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

    var seen = Set<String>()
    return cameras.filter { seen.insert($0.uniqueID).inserted }
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
    if let standardBack = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) {
      if self.backCameraLenses.contains(standardBack) {
        return standardBack
      }
    }

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
