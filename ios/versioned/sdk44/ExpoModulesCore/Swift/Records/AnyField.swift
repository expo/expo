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

  func set(_ newValue: Any?) throws
}
