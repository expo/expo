#if !os(tvOS)
import Testing
import AVFoundation
import ExpoModulesCore

@testable import ExpoAudio

@Suite("AudioRecordingRequester.permissions")
struct AudioRecordingRequesterTests {
  @Test
  func `reports denied when the usage description is missing`() {
    let permissions = AudioRecordingRequester.permissions(systemStatus: .granted, usageDescription: nil)

    #expect(permissions["status"] as? UInt32 == EXPermissionStatusDenied.rawValue)
  }

  @Test(arguments: [
    (AVAudioSession.RecordPermission.granted, EXPermissionStatusGranted),
    (.denied, EXPermissionStatusDenied),
    (.undetermined, EXPermissionStatusUndetermined),
  ] as [(AVAudioSession.RecordPermission, EXPermissionStatus)])
  func `maps the system status when the usage description is present`(
    systemStatus: AVAudioSession.RecordPermission,
    expected: EXPermissionStatus
  ) {
    let permissions = AudioRecordingRequester.permissions(
      systemStatus: systemStatus,
      usageDescription: "Allow $(PRODUCT_NAME) to access your microphone"
    )

    #expect(permissions["status"] as? UInt32 == expected.rawValue)
  }

  @Test
  func `resolves denied without a system request when the usage description is missing`() {
    let requester = AudioRecordingRequester()
    var resolved: [AnyHashable: Any]?

    requester.requestPermissions(usageDescription: nil) { result in
      resolved = result as? [AnyHashable: Any]
    } rejecter: { _, _, _ in
      Issue.record("requestPermissions rejected instead of resolving")
    }

    #expect(resolved?["status"] as? UInt32 == EXPermissionStatusDenied.rawValue)
  }

  @Test
  func `requireUsageDescription throws when the usage description is missing`() {
    #expect(throws: MicrophoneUsageDescriptionException.self) {
      try AudioRecordingRequester.requireUsageDescription(nil)
    }
  }

  @Test
  func `requireUsageDescription accepts a present usage description`() throws {
    try AudioRecordingRequester.requireUsageDescription("Allow $(PRODUCT_NAME) to access your microphone")
  }
}
#endif
