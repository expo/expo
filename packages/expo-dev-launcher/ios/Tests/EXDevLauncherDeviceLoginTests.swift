// Copyright 2015-present 650 Industries. All rights reserved.

import Testing

@testable import EXDevLauncher

@Suite("EXDevLauncherDeviceLogin")
struct EXDevLauncherDeviceLoginTests {
  // The parameter names are spelled out: these are the literals Expo CLI and Expo Orbit send.
  @Test("reads the device code, match value and client ID next to a project URL")
  func validRequest() {
    let url = URL(string: "exp+app://?__expo_url=http%3A%2F%2Flocalhost%3A8081&__expo_device_code=abc&__expo_device_match=42&__expo_device_client=expo-go")!

    #expect(DeviceLoginRequest.parse(url) == DeviceLoginRequest(deviceCode: "abc", matchValue: "42", clientId: "expo-go"))
  }

  @Test(
    "rejects a URL with a missing or empty param",
    arguments: [
      "exp+app://?__expo_url=http%3A%2F%2Flocalhost%3A8081",
      "exp+app://?__expo_device_match=42&__expo_device_client=expo-go",
      "exp+app://?__expo_device_code=abc&__expo_device_client=expo-go",
      "exp+app://?__expo_device_code=abc&__expo_device_match=42",
      "exp+app://?__expo_device_code=&__expo_device_match=42&__expo_device_client=expo-go"
    ]
  )
  func incompleteRequest(_ url: String) {
    #expect(DeviceLoginRequest.parse(URL(string: url)!) == nil)
  }
}
