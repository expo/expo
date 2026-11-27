#if canImport(FoundationModels)
import Foundation
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
internal enum LanguageModelSchema {
  static func compile(_ schema: LanguageModelJSON, name: String) throws -> GenerationSchema {
    var compiler = Compiler(prefix: name)
    return try GenerationSchema(root: compiler.visit(schema, depth: 0), dependencies: [])
  }

  private struct Compiler {
    let prefix: String
    var nextType = 0

    mutating func visit(_ value: LanguageModelJSON, depth: Int) throws -> DynamicGenerationSchema {
      guard depth <= 32, nextType < 1024, let object = value.object,
        let type = object["type"]?.string
      else { throw unsupported("Expected a schema object within the depth and size limits.") }
      // Names never depend on property strings; e.g. a_b and a.b cannot collide.
      let name = "\(prefix)_\(nextType)"
      nextType += 1
      let specific: Set<String>
      switch type {
      case "string": specific = ["enum"]
      case "number", "integer": specific = ["minimum", "maximum"]
      case "boolean": specific = []
      case "array": specific = ["items", "minItems", "maxItems"]
      case "object": specific = ["properties", "required", "additionalProperties"]
      default: throw unsupported("Unsupported schema type: \(type).")
      }
      let unknown = Set(object.keys).subtracting(specific.union(["type", "description"]))
      guard unknown.isEmpty else {
        throw unsupported("Unsupported schema keywords: \(unknown.sorted().joined(separator: ", ")).")
      }
      if let description = object["description"], description.string == nil {
        throw unsupported("Schema descriptions must be strings.")
      }
      switch type {
      case "string":
        if let rawEnum = object["enum"] {
          guard case .array(let values) = rawEnum else { throw unsupported("enum must be an array.") }
          let choices = values.compactMap(\.string)
          guard !choices.isEmpty, choices.count == values.count, Set(choices).count == choices.count else {
            throw unsupported("enum must contain distinct strings.")
          }
          return DynamicGenerationSchema(name: name, anyOf: choices)
        }
        return DynamicGenerationSchema(type: String.self)
      case "number":
        let minimum = try number(object["minimum"], name: "minimum")
        let maximum = try number(object["maximum"], name: "maximum")
        guard minimum == nil || maximum == nil || minimum! <= maximum! else {
          throw unsupported("minimum exceeds maximum.")
        }
        return DynamicGenerationSchema(type: Double.self, guides: doubleGuides(minimum, maximum))
      case "integer":
        let minimum = try safeInteger(object["minimum"], name: "minimum")
        let maximum = try safeInteger(object["maximum"], name: "maximum")
        guard minimum == nil || maximum == nil || minimum! <= maximum! else {
          throw unsupported("minimum exceeds maximum.")
        }
        return DynamicGenerationSchema(type: Int.self, guides: integerGuides(minimum, maximum))
      case "boolean": return DynamicGenerationSchema(type: Bool.self)
      case "array":
        guard let items = object["items"] else { throw unsupported("Array schemas need items.") }
        let minimum = try count(object["minItems"], name: "minItems")
        let maximum = try count(object["maxItems"], name: "maxItems")
        if let minimum, let maximum, minimum > maximum { throw unsupported("minItems exceeds maxItems.") }
        return DynamicGenerationSchema(
          arrayOf: try visit(items, depth: depth + 1), minimumElements: minimum, maximumElements: maximum)
      default:
        guard let properties = object["properties"]?.object,
          case .bool(false) = object["additionalProperties"]
        else { throw unsupported("Object schemas need properties and additionalProperties: false.") }
        let required: [String]
        if let raw = object["required"] {
          guard case .array(let values) = raw else { throw unsupported("required must be an array.") }
          required = values.compactMap(\.string)
          guard required.count == values.count,
            Set(required).count == required.count,
            Set(required).isSubset(of: Set(properties.keys))
          else { throw unsupported("required must contain distinct declared property names.") }
        } else { required = [] }
        // A stable field order is required for reproducible generation schemas.
        let fields = try properties.keys.sorted().map { key in
          DynamicGenerationSchema.Property(
            name: key, description: properties[key]?.object?["description"]?.string,
            schema: try visit(properties[key]!, depth: depth + 1), isOptional: !required.contains(key))
        }
        return DynamicGenerationSchema(name: name, description: object["description"]?.string, properties: fields)
      }
    }

    private func count(_ value: LanguageModelJSON?, name: String) throws -> Int? {
      do { return try optionalInteger(value, name: name, minimum: 0) }
      catch { throw unsupported("\(name) must be a nonnegative integer.") }
    }

    private func number(_ value: LanguageModelJSON?, name: String) throws -> Double? {
      guard let value else { return nil }
      guard case .number(let number) = value, number.isFinite else {
        throw unsupported("\(name) must be a finite number.")
      }
      return number
    }

    private func safeInteger(_ value: LanguageModelJSON?, name: String) throws -> Int? {
      guard let number = try number(value, name: name) else { return nil }
      guard number.rounded() == number, abs(number) <= 9_007_199_254_740_991 else {
        throw unsupported("\(name) must be a safe integer.")
      }
      return Int(number)
    }

    private func doubleGuides(_ minimum: Double?, _ maximum: Double?) -> [GenerationGuide<Double>] {
      if let minimum, let maximum { return [.range(minimum...maximum)] }
      if let minimum { return [.minimum(minimum)] }
      if let maximum { return [.maximum(maximum)] }
      return []
    }

    private func integerGuides(_ minimum: Int?, _ maximum: Int?) -> [GenerationGuide<Int>] {
      if let minimum, let maximum { return [.range(minimum...maximum)] }
      if let minimum { return [.minimum(minimum)] }
      if let maximum { return [.maximum(maximum)] }
      return []
    }

    private func unsupported(_ message: String) -> LanguageModelException {
      LanguageModelException("ERR_SCHEMA_UNSUPPORTED", message)
    }
  }
}
#endif
