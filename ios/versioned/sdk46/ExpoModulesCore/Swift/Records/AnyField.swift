/**
 Protocol for type-erased record fields.
 */
public protocol AnyField {
  func get() -> Any
}

/**
 Internal-only additions to `AnyField` protocol.
 */
internal protocol AnyFieldInternal: AnyField {
  var key: String? { get }
  var options: Set<FieldOption> { get set }

  /**
   Whether the value for this field must be explicitly provided.
   The record throws an error when the source dictionary is missing a required value.
   Note that it's NOT the opposite to `isOptional`.
   */
  var isRequired: Bool { get }

  func set(_ newValue: Any?) throws
}
