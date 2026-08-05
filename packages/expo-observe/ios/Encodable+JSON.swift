// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

extension Encodable {
  func toJSONData(_ formatting: JSONEncoder.OutputFormatting = []) throws -> Data {
    let encoder = JSONEncoder()
    encoder.outputFormatting = formatting
    return try encoder.encode(self)
  }

  func toJSONString(_ formatting: JSONEncoder.OutputFormatting = []) throws -> String {
    let data = try toJSONData(formatting)
    return String(data: data, encoding: .utf8) ?? ""
  }
}
