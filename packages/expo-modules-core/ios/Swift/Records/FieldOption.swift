/**
 Enum-like struct representing field options that for example can specify if the field
 is required and so it must be provided by the dictionary from which the field is created.
 */
public struct FieldOption: Equatable, Hashable, ExpressibleByIntegerLiteral, ExpressibleByStringLiteral {
  public let rawValue: Int
  public var key: String?

  public init(_ rawValue: Int) {
    self.rawValue = rawValue
  }

  // MARK: `Equatable`

  /**
   Field options are equal when their raw values and parameters are equal.
   */
  public static func ==(lhs: Self, rhs: Self) -> Bool {
    return lhs.rawValue == rhs.rawValue && lhs.key == rhs.key
  }

  // MARK: `Hashable`

  /**
   The options can be stored in `Set` which uses `hashValue` as a unique identifier.
   */
  public func hash(into hasher: inout Hasher) {
    hasher.combine(rawValue)
  }

  // MARK: `ExpressibleByIntegerLiteral`

  /**
   Initializer that allows to create an instance from int literal.
   */
  public init(integerLiteral value: Int) {
    self.rawValue = value
  }

  // MARK: `ExpressibleByStringLiteral`

  /**
   Initializer that allows to create an instance from string literal.
   */
  public init(stringLiteral value: String) {
    self.rawValue = 0
    self.key = value
  }
}

public extension FieldOption {
  /**
   Field option setting its key to given string. Raw value equals to `0`.
   This option can also be initialized with string literal.
   */
  static func keyed(_ key: String) -> FieldOption { FieldOption(stringLiteral: key) }

  /**
   The field must be explicitly provided by the dictionary. Raw value equals to `1`.
   */
  static let required: FieldOption = 1
}
