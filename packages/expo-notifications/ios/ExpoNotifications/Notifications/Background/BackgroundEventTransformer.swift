// Copyright 2023-present 650 Industries. All rights reserved.

import Foundation

/// Transforms background notification payloads into a format expected by the JavaScript layer.
/// see BackgroundEventTransformerSpec
public class BackgroundEventTransformer {
  public static func transform(_ data: [AnyHashable: Any]?) -> [String: Any] {
    guard let payload = data else {
      return [:]
    }

    var result: [String: Any] = [
      "data": payload.filter { $0.key as? String != "aps" },
      "notification": NSNull()
    ]

    // the payload is emitted as a JSON string for alignment with Android
    let jsonData: String? = {
      guard let body = payload["body"] else {
        return nil
      }
      // Primitive string bodies are used directly; JSONSerialization only accepts
      // NSDictionary / NSArray at the top level and throws NSException otherwise.
      if let bodyString = body as? String {
        return bodyString
      }
      guard JSONSerialization.isValidJSONObject(body) else {
        return nil
      }
      do {
        let data = try JSONSerialization.data(withJSONObject: body, options: [])
        return String(data: data, encoding: .utf8)
      } catch {
        return nil
      }
    }()

    if var data = result["data"] as? [String: Any] {
      data["dataString"] = jsonData
      result["data"] = data
    }

    if let aps = payload["aps"] as? [String: Any] {
      result["aps"] = aps
      result["notification"] = aps["alert"] ?? NSNull()
      if let category = aps["category"] as? String, var data = result["data"] as? [String: Any] {
        data["categoryId"] = category
        result["data"] = data
      }
    }

    return result
  }
}
