// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// Codec for the Engine.IO v4 / Socket.IO packet framing used by Snackpub.
/// Parsing only inspects prefixes; unknown or malformed input is `.ignored`.
enum SnackpubFrame {
  enum Incoming {
    case open                               // "0..."  Engine.IO OPEN
    case ping                               // "2"     Engine.IO PING (server-initiated; reply with pongPacket)
    case connectAck(sid: String?)           // "40..." Socket.IO CONNECT ack
    case event(name: String, payload: Any?) // "42[...]" Socket.IO EVENT
    case ignored
  }

  static let connectPacket = "40"
  static let pongPacket = "3"

  static func parse(_ text: String) -> Incoming {
    guard let first = text.first else { return .ignored }
    switch first {
    case "0":
      return .open
    case "2":
      return text == "2" ? .ping : .ignored
    case "4":
      return parseSocketIO(String(text.dropFirst()))
    default:
      return .ignored
    }
  }

  private static func parseSocketIO(_ text: String) -> Incoming {
    guard let first = text.first else { return .ignored }
    switch first {
    case "0":
      let json = (try? JSONSerialization.jsonObject(with: Data(text.dropFirst().utf8))) as? [String: Any]
      return .connectAck(sid: json?["sid"] as? String)
    case "2":
      guard let array = (try? JSONSerialization.jsonObject(with: Data(text.dropFirst().utf8))) as? [Any],
            let name = array.first as? String else {
        return .ignored
      }
      return .event(name: name, payload: array.count > 1 ? array[1] : nil)
    default:
      return .ignored
    }
  }

  static func eventPacket(_ event: String, data: Any) -> String? {
    guard let jsonData = try? JSONSerialization.data(withJSONObject: [event, data]),
          let jsonString = String(data: jsonData, encoding: .utf8) else {
      return nil
    }
    return "42\(jsonString)"
  }
}
