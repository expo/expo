// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import Testing

@testable import EXDevLauncher

@Suite("EXDevLauncherRemoteLogsManager")
struct EXDevLauncherRemoteLogsManagerTests {
  @Test
  func `dev server URL maps to its hot socket`() {
    let url = EXDevLauncherRemoteLogsManager.webSocketUrl(forServerUrl: URL(string: "http://192.168.1.5:8081")!)

    #expect(url?.absoluteString == "ws://192.168.1.5:8081/hot")
  }

  @Test
  func `bundle URL path and query are dropped`() {
    let url = EXDevLauncherRemoteLogsManager.webSocketUrl(
      forServerUrl: URL(string: "http://localhost:8081/index.bundle?platform=ios&dev=true")!
    )

    #expect(url?.absoluteString == "ws://localhost:8081/hot")
  }

  @Test
  func `https tunnel uses a secure socket`() {
    let url = EXDevLauncherRemoteLogsManager.webSocketUrl(forServerUrl: URL(string: "https://abc-anonymous-8081.exp.direct")!)

    #expect(url?.absoluteString == "wss://abc-anonymous-8081.exp.direct/hot")
  }

  @Test
  func `EAS Update URL has no dev server`() {
    let url = EXDevLauncherRemoteLogsManager.webSocketUrl(forServerUrl: URL(string: "https://u.expo.dev/abc?channel-name=main")!)

    #expect(url == nil)
  }

  @Test
  func `file URL has no dev server`() {
    let url = EXDevLauncherRemoteLogsManager.webSocketUrl(forServerUrl: URL(string: "file:///var/app/main.jsbundle")!)

    #expect(url == nil)
  }

  @Test
  func `payload tags the log as iOS`() {
    let payload = EXDevLauncherRemoteLogsManager.payload(message: "Failed to load app")

    #expect(payload["type"] as? String == "log")
    #expect(payload["level"] as? String == "error")
    #expect(payload["mode"] as? String == "ios")
    #expect(payload["data"] as? [String] == ["Failed to load app"])
  }
}
