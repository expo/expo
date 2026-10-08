// Copyright 2026-present 650 Industries. All rights reserved.

import Testing
import CoreMotion
import ExpoModulesCore

@testable import ExpoSensors

@Suite("MotionPermissionRequester")
struct MotionPermissionRequesterTests {
  @Test(arguments: [
    CMAuthorizationStatus.authorized,
    .denied,
    .restricted,
    .notDetermined,
  ])
  func `reports denied when the usage description is missing`(authorizationStatus: CMAuthorizationStatus) {
    let permissions = MotionPermissionRequester.permissions(
      authorizationStatus: authorizationStatus,
      usageDescription: nil
    )

    #expect(permissions["status"] as? UInt32 == EXPermissionStatusDenied.rawValue)
  }

  @Test
  func `does not read the authorization status when the usage description is missing`() {
    let authorizationStatus = AuthorizationStatusSpy()

    let permissions = MotionPermissionRequester.permissions(
      authorizationStatus: authorizationStatus.read(),
      usageDescription: nil
    )

    #expect(authorizationStatus.reads == 0)
    #expect(permissions["status"] as? UInt32 == EXPermissionStatusDenied.rawValue)
  }

  @Test(arguments: [
    (CMAuthorizationStatus.authorized, EXPermissionStatusGranted),
    (.denied, EXPermissionStatusDenied),
    (.restricted, EXPermissionStatusDenied),
    (.notDetermined, EXPermissionStatusUndetermined),
  ] as [(CMAuthorizationStatus, EXPermissionStatus)])
  func `maps the CoreMotion authorization status when the usage description is present`(
    authorizationStatus: CMAuthorizationStatus,
    expected: EXPermissionStatus
  ) {
    let permissions = MotionPermissionRequester.permissions(
      authorizationStatus: authorizationStatus,
      usageDescription: "Allow $(PRODUCT_NAME) to access your device motion"
    )

    #expect(permissions["status"] as? UInt32 == expected.rawValue)
  }

  @Test
  func `resolves denied when the usage description is missing`() {
    let requester = MotionPermissionRequester()
    var resolved: [AnyHashable: Any]?

    requester.requestPermissions(usageDescription: nil) { result in
      resolved = result as? [AnyHashable: Any]
    } rejecter: { _, _, _ in
      Issue.record("requestPermissions rejected instead of resolving")
    }

    #expect(resolved?["status"] as? UInt32 == EXPermissionStatusDenied.rawValue)
  }

  @Test
  func `getPermissions maps the status when NSMotionUsageDescription is present`() {
    let infoDictionary = InfoDictionarySpy(["NSMotionUsageDescription": "Allow $(PRODUCT_NAME) to access your device motion"])
    let requester = MotionPermissionRequester(
      infoDictionaryValue: infoDictionary.value(forKey:),
      authorizationStatus: { .authorized }
    )

    let permissions = requester.getPermissions()

    #expect(infoDictionary.requestedKeys == ["NSMotionUsageDescription"])
    #expect(permissions["status"] as? UInt32 == EXPermissionStatusGranted.rawValue)
  }

  @Test
  func `getPermissions reports denied without reading the status when NSMotionUsageDescription is missing`() {
    let infoDictionary = InfoDictionarySpy([:])
    let authorizationStatus = AuthorizationStatusSpy()
    let requester = MotionPermissionRequester(
      infoDictionaryValue: infoDictionary.value(forKey:),
      authorizationStatus: authorizationStatus.read
    )

    let permissions = requester.getPermissions()

    #expect(infoDictionary.requestedKeys == ["NSMotionUsageDescription"])
    #expect(authorizationStatus.reads == 0)
    #expect(permissions["status"] as? UInt32 == EXPermissionStatusDenied.rawValue)
  }

  @Test
  func `requestPermissions resolves denied without reading the status when NSMotionUsageDescription is missing`() {
    let infoDictionary = InfoDictionarySpy([:])
    let authorizationStatus = AuthorizationStatusSpy()
    let requester = MotionPermissionRequester(
      infoDictionaryValue: infoDictionary.value(forKey:),
      authorizationStatus: authorizationStatus.read
    )
    var resolved: [AnyHashable: Any]?

    requester.requestPermissions { result in
      resolved = result as? [AnyHashable: Any]
    } rejecter: { _, _, _ in
      Issue.record("requestPermissions rejected instead of resolving")
    }

    #expect(infoDictionary.requestedKeys == ["NSMotionUsageDescription"])
    #expect(authorizationStatus.reads == 0)
    #expect(resolved?["status"] as? UInt32 == EXPermissionStatusDenied.rawValue)
  }

  @Test
  func `registers under the motion permission type`() {
    #expect(MotionPermissionRequester.permissionType() == "motion")
  }
}

private final class AuthorizationStatusSpy {
  private let status: CMAuthorizationStatus
  private(set) var reads = 0

  init(_ status: CMAuthorizationStatus = .authorized) {
    self.status = status
  }

  func read() -> CMAuthorizationStatus {
    reads += 1
    return status
  }
}

private final class InfoDictionarySpy {
  private let values: [String: Any]
  private(set) var requestedKeys: [String] = []

  init(_ values: [String: Any]) {
    self.values = values
  }

  func value(forKey key: String) -> Any? {
    requestedKeys.append(key)
    return values[key]
  }
}
