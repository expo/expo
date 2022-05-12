// Copyright 2022-present 650 Industries. All rights reserved.

/**
 A protocol that must be implemented by the components passed as ``ClassComponent`` elements.
 */
public protocol ClassComponentElement: AnyDefinition {}

// Allow some other components to be used as the class component elements.
extension SyncFunctionComponent: ClassComponentElement {}
extension AsyncFunctionComponent: ClassComponentElement {}
extension PropertyComponent: ClassComponentElement {}
extension ConstantsDefinition: ClassComponentElement {}
