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
}
#endif
