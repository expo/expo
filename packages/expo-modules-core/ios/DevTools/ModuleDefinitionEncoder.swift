class ModuleDefinitionEncoder: Encodable {
  private let definition: ModuleDefinition

  init(_ definition: ModuleDefinition) {
    self.definition = definition
  }

  enum CodingKeys: String, CodingKey {
    case name
    case functions
    case properties
    case constants
    case views
  }

  func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(definition.name, forKey: .name)
    try container.encode(definition.legacyConstants.map({ LegacyConstantsDefinitionEncoder($0) }), forKey: .constants)
    try container.encode(definition.properties.values.map({ PropertyDefinitionEncoder($0) }), forKey: .properties)
    try container.encode(definition.functions.values.map({ FunctionDefinitionEncoder($0) }), forKey: .functions)
    try container.encode(definition.views.values.map({ ViewDefinitionEncoder($0) }), forKey: .views)
  }
}

public class ModuleRegistryEncoder: Encodable {
  private let registry: ModuleRegistry

  public init(_ registry: ModuleRegistry) {
    self.registry = registry
  }

  public func encode(to encoder: Encoder) throws {
    var container = encoder.unkeyedContainer()
    registry.getModuleNames().forEach {
      guard let definition = registry.get(moduleWithName: $0)?.definition() else {
        return
      }
      try? container.encode(ModuleDefinitionEncoder(definition))
    }
  }
}

class FunctionDefinitionEncoder: Encodable {
  private let definition: any AnyFunctionDefinition

  init(_ definition: any AnyFunctionDefinition) {
    self.definition = definition
  }

  enum CodingKeys: String, CodingKey {
    case name
    case argumentsCount
  }

  func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(definition.name, forKey: .name)
    try container.encode(definition.argumentsCount, forKey: .argumentsCount)
  }
}

class ViewDefinitionEncoder: Encodable {
  private let definition: any AnyViewDefinition

  init(_ definition: any AnyViewDefinition) {
    self.definition = definition
  }

  enum CodingKeys: String, CodingKey {
    case name
    case props
  }

  func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(definition.name, forKey: .name)
    try container.encode(definition.props.map({ ViewPropEncoder($0) }), forKey: .props)
  }
}

class ViewPropEncoder: Encodable {
  private let definition: AnyViewProp

  init(_ definition: AnyViewProp) {
    self.definition = definition
  }

  enum CodingKeys: String, CodingKey {
    case name
  }

  func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(definition.name, forKey: .name)
  }
}

class ConstantEncoder: Encodable {
  private let key: String
  private let value: Any?

  init(_ key: String, value: Any?) {
    self.key = key
    self.value = value
  }

  enum CodingKeys: String, CodingKey {
    case name
    case value
    case type
  }

  func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(key, forKey: .name)
    switch value {
    case let value as String:
      try container.encode(value, forKey: .value)
      try container.encode("string", forKey: .type)
    case let value as Bool:
      try container.encode(value, forKey: .value)
      try container.encode("boolean", forKey: .type)
    case let value as Int:
      try container.encode(value, forKey: .value)
      try container.encode("number", forKey: .type)
    case let value as Double:
      try container.encode(value, forKey: .value)
      try container.encode("number", forKey: .type)
    case nil:
      try container.encodeNil(forKey: .value)
      try container.encode("null", forKey: .type)
    case let value as Dictionary<String, Any>:
      try container.encodeNil(forKey: .value)
      try container.encode("object", forKey: .type)
    case let value as Array<Any>:
      try container.encodeNil(forKey: .value)
      try container.encode("array", forKey: .type)
    default:
      try container.encodeNil(forKey: .value)
      try container.encode("unknown", forKey: .type)
    }
  }
}

class LegacyConstantsDefinitionEncoder: Encodable {
  private let definition: ConstantsDefinition

  init(_ definition: ConstantsDefinition) {
    self.definition = definition
  }

  enum CodingKeys: String, CodingKey {
    case name
    case value
  }

  func encode(to encoder: Encoder) throws {
    var container = encoder.unkeyedContainer()
    let constants = definition.body()
    for (key, value) in constants {
      try container.encode(ConstantEncoder(key, value: value))
    }
  }
}

class PropertyDefinitionEncoder: Encodable {
  private let definition: any AnyPropertyDefinition

  init(_ definition: any AnyPropertyDefinition) {
    self.definition = definition
  }

  enum CodingKeys: String, CodingKey {
    case name
  }

  func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(definition.name, forKey: .name)
  }
}
