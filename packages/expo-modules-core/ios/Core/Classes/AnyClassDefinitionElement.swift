// Copyright 2022-present 650 Industries. All rights reserved.

/**
 A type-erased protocol that must be implemented by the definitions passed as ``ClassDefinition`` elements.
 */
public protocol AnyClassDefinitionElement: AnyDefinition {}

/**
 Class definition element with an associated owner type. The `OwnerType` should refer to
 the type that the parent `Class` definition is associated with (e.g. the shared object type).
 */
public protocol ClassDefinitionElement: AnyClassDefinitionElement {
  associatedtype OwnerType
}

// MARK: - Conformance
// Allow some other definitions to be used as the class definition elements.

extension SyncFunctionDefinition: ClassDefinitionElement {
  public typealias OwnerType = FirstArgType
}

extension AsyncFunctionDefinition: ClassDefinitionElement {
  public typealias OwnerType = FirstArgType
}

extension ConcurrentFunctionDefinition: ClassDefinitionElement {
  public typealias OwnerType = FirstArgType
}

extension PropertyDefinition: ClassDefinitionElement {
  // It already has the `OwnerType`
}

extension ConstantsDefinition: ClassDefinitionElement {
  public typealias OwnerType = Void
}
