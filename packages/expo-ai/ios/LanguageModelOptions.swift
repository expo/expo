import Foundation

/// A sendable JSON tree. Schemas arriving through the bridge remain runtime data.
internal enum LanguageModelJSON: Sendable, Decodable {
  case object([String: LanguageModelJSON])
  case array([LanguageModelJSON])
  case string(String)
  case number(Double)
  case bool(Bool)
  case null

  init(from decoder: Decoder) throws {
    let value = try decoder.singleValueContainer()
    if value.decodeNil() {
      self = .null
    } else if let boolean = try? value.decode(Bool.self) {
      self = .bool(boolean)
    } else if let number = try? value.decode(Double.self) {
      self = .number(number)
    } else if let string = try? value.decode(String.self) {
      self = .string(string)
    } else if let array = try? value.decode([LanguageModelJSON].self) {
      self = .array(array)
    } else {
      self = .object(try value.decode([String: LanguageModelJSON].self))
    }
  }

  var object: [String: LanguageModelJSON]? {
    if case .object(let value) = self { return value }
    return nil
  }

  var string: String? {
    if case .string(let value) = self { return value }
    return nil
  }

  static func decode(_ json: String) throws -> LanguageModelJSON {
    do {
      return try JSONDecoder().decode(LanguageModelJSON.self, from: Data(json.utf8))
    } catch {
      throw LanguageModelException.invalid("Expected valid JSON: \(error.localizedDescription)")
    }
  }
}

internal struct LanguageModelToolDefinition: Sendable {
  let name: String
  let description: String
  let schema: LanguageModelJSON
  let builtin: LanguageModelBuiltinTool?
}

internal struct LanguageModelSessionOptions: Sendable {
  let instructions: String?
  let tools: [LanguageModelToolDefinition]

  init(json: String) throws {
    guard let object = try LanguageModelJSON.decode(json).object else {
      throw LanguageModelException.invalid("Session options must be an object.")
    }
    try validateKeys(object, allowed: ["instructions", "tools"])
    instructions = try optionalString(object["instructions"], name: "instructions")
    let values: [LanguageModelJSON]
    if let tools = object["tools"] {
      guard case .array(let entries) = tools else {
        throw LanguageModelException.invalid("tools must be an array.")
      }
      values = entries
    } else {
      values = []
    }
    var names = Set<String>()
    tools = try values.map { value in
      guard let tool = value.object, let name = tool["name"]?.string,
        !name.isEmpty, name.utf8.count <= 64,
        name.range(of: "^[A-Za-z_][A-Za-z0-9_]*$", options: .regularExpression) != nil,
        let description = tool["description"]?.string, !description.isEmpty,
        let schema = tool["inputSchema"], schema.object?["type"]?.string == "object",
        names.insert(name).inserted
      else {
        throw LanguageModelException.invalid("Each tool needs a unique name, description, and object inputSchema.")
      }
      try validateKeys(tool, allowed: ["name", "description", "inputSchema", "builtin"])
      let builtin: LanguageModelBuiltinTool?
      if let value = tool["builtin"] {
        guard let name = value.string, let kind = LanguageModelBuiltinTool(rawValue: name) else {
          throw LanguageModelException.invalid("Unknown Apple built-in tool.")
        }
        builtin = kind
      } else {
        builtin = nil
      }
      return LanguageModelToolDefinition(name: name, description: description, schema: schema, builtin: builtin)
    }
  }
}

internal struct LanguageModelRequestOptions: Sendable {
  let schema: LanguageModelJSON?
  let stream: Bool
  let maximumOutputTokens: Int?
  let maximumToolCalls: Int
  let images: [LanguageModelImage]

  init(json: String) throws {
    guard let object = try LanguageModelJSON.decode(json).object else {
      throw LanguageModelException.invalid("Request options must be an object.")
    }
    try validateKeys(object, allowed: ["schema", "stream", "maximumOutputTokens", "maximumToolCalls", "images"])
    schema = object["schema"]
    if let value = object["images"] {
      guard case .array(let values) = value, values.count <= 8 else {
        throw LanguageModelException.invalid("images must be an array containing at most eight images.")
      }
      var labels = Set<String>()
      images = try values.map { value in
        guard let image = value.object else {
          throw LanguageModelException.invalid("Each image must be an object.")
        }
        try validateKeys(image, allowed: ["uri", "label"])
        guard let uri = image["uri"]?.string, let url = URL(string: uri),
          url.isFileURL, (url.host?.isEmpty ?? true) || url.host == "localhost",
          url.query == nil, url.fragment == nil, !url.path.isEmpty,
          uri.range(of: "%00", options: .caseInsensitive) == nil,
          url.path.rangeOfCharacter(from: .controlCharacters) == nil,
          let label = image["label"]?.string, !label.isEmpty, label.utf16.count <= 128,
          label.rangeOfCharacter(from: .controlCharacters) == nil, labels.insert(label).inserted
        else {
          throw LanguageModelException.invalid("Images need local file URLs and unique labels of 1–128 characters without control characters.")
        }
        return LanguageModelImage(url: url, label: label)
      }
    } else {
      images = []
    }
    if let raw = object["stream"] {
      guard case .bool(let value) = raw else { throw LanguageModelException.invalid("stream must be a boolean.") }
      stream = value
    } else {
      stream = false
    }
    maximumOutputTokens = try optionalInteger(object["maximumOutputTokens"], name: "maximumOutputTokens", minimum: 1)
    maximumToolCalls = try optionalInteger(object["maximumToolCalls"], name: "maximumToolCalls", minimum: 0) ?? 0
    guard maximumToolCalls <= 16 else {
      throw LanguageModelException.invalid("maximumToolCalls must not exceed 16.")
    }
  }
}

private func validateKeys(_ object: [String: LanguageModelJSON], allowed: Set<String>) throws {
  let unknown = Set(object.keys).subtracting(allowed)
  guard unknown.isEmpty else {
    throw LanguageModelException.invalid("Unsupported options: \(unknown.sorted().joined(separator: ", ")).")
  }
}

private func optionalString(_ value: LanguageModelJSON?, name: String) throws -> String? {
  guard let value else { return nil }
  guard let string = value.string else { throw LanguageModelException.invalid("\(name) must be a string.") }
  return string
}

internal func optionalInteger(_ value: LanguageModelJSON?, name: String, minimum: Int) throws -> Int? {
  guard let value else { return nil }
  guard case .number(let number) = value, number.isFinite,
    number.rounded() == number, number >= Double(minimum), number < Double(Int.max)
  else { throw LanguageModelException.invalid("\(name) must be an integer of at least \(minimum).") }
  return Int(number)
}

internal struct LanguageModelImage: Sendable {
  let url: URL
  let label: String
}

internal struct LanguageModelUsage: Sendable, Encodable {
  var inputTokens: Int?
  var outputTokens: Int?
  var cachedInputTokens: Int?
  var reasoningTokens: Int?
  var contextTokens: Int?

  init(
    inputTokens: Int? = nil,
    outputTokens: Int? = nil,
    cachedInputTokens: Int? = nil,
    reasoningTokens: Int? = nil,
    contextTokens: Int? = nil
  ) {
    self.inputTokens = inputTokens
    self.outputTokens = outputTokens
    self.cachedInputTokens = cachedInputTokens
    self.reasoningTokens = reasoningTokens
    self.contextTokens = contextTokens
  }

  // Unknown response counts must survive JSON encoding as null, rather than zero.
  func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(inputTokens, forKey: .inputTokens)
    try container.encode(outputTokens, forKey: .outputTokens)
    try container.encodeIfPresent(cachedInputTokens, forKey: .cachedInputTokens)
    try container.encodeIfPresent(reasoningTokens, forKey: .reasoningTokens)
    try container.encodeIfPresent(contextTokens, forKey: .contextTokens)
  }

  private enum CodingKeys: String, CodingKey {
    case inputTokens, outputTokens, cachedInputTokens, reasoningTokens, contextTokens
  }
}
