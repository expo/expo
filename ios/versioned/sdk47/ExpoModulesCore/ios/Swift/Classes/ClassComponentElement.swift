// Copyright 2022-present 650 Industries. All rights reserved.

/**
 A type-erased protocol that must be implemented by the components passed as ``ClassComponent`` elements.
 */
public protocol AnyClassComponentElement: AnyDefinition {}

/**
 Class component element with an associated owner type. The `OwnerType` should refer to
 the type that the parent `Class` component is associated with (e.g. the shared object type).
 */
public protocol ClassComponentElement: AnyClassComponentElement {
  associatedtype OwnerType
}

// MARK: - Conformance
// Allow some other components to be used as the class component elements.

extension SyncFunctionComponent: ClassComponentElement {
  public typealias OwnerType = FirstArgType
}

extension AsyncFunctionComponent: ClassComponentElement {
  public typealias OwnerType = FirstArgType
}

extension PropertyComponent: ClassComponentElement {
  public typealias OwnerType = Void
}

extension ConstantsDefinition: ClassComponentElement {
  public typealias OwnerType = Void
}
