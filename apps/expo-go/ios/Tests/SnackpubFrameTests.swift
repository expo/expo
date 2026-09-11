// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class SnackpubFrameTests: XCTestCase {
  func testParsesEngineIOOpen() {
    guard case .open = SnackpubFrame.parse(#"0{"sid":"abc","pingInterval":25000}"#) else {
      return XCTFail("expected .open")
    }
  }

  func testParsesEngineIOPing() {
    guard case .ping = SnackpubFrame.parse("2") else { return XCTFail("expected .ping") }
  }

  func testParsesSocketIOConnectAckWithSid() {
    guard case .connectAck(let sid) = SnackpubFrame.parse(#"40{"sid":"xyz123"}"#) else {
      return XCTFail("expected .connectAck")
    }
    XCTAssertEqual(sid, "xyz123")
  }

  func testParsesSocketIOEvent() {
    guard case .event(let name, let payload) = SnackpubFrame.parse(#"42["message",{"channel":"c1"}]"#) else {
      return XCTFail("expected .event")
    }
    XCTAssertEqual(name, "message")
    XCTAssertEqual((payload as? [String: Any])?["channel"] as? String, "c1")
  }

  func testEventWithoutPayloadParses() {
    guard case .event(let name, let payload) = SnackpubFrame.parse(#"42["joinChannel"]"#) else {
      return XCTFail("expected .event")
    }
    XCTAssertEqual(name, "joinChannel")
    XCTAssertNil(payload)
  }

  func testMalformedInputIsIgnoredNotCrashing() {
    for junk in ["", "4", "42", "42[", "42[123]", "9zzz", "23", "41"] {
      switch SnackpubFrame.parse(junk) {
      case .ignored:
        continue
      default:
        XCTFail("junk \(junk) should be ignored")
      }
    }
  }

  func testEventPacketFormat() throws {
    let packet = try XCTUnwrap(SnackpubFrame.eventPacket("subscribeChannel", data: ["channel": "c1", "sender": "s1"]))
    XCTAssertTrue(packet.hasPrefix("42["))
    XCTAssertTrue(packet.contains(#""subscribeChannel""#))
    XCTAssertTrue(packet.contains(#""channel":"c1""#) || packet.contains(#""channel" : "c1""#))
  }

  func testConstants() {
    XCTAssertEqual(SnackpubFrame.connectPacket, "40")
    XCTAssertEqual(SnackpubFrame.pongPacket, "3")
  }
}
