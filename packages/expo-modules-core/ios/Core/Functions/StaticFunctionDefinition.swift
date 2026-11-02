// Copyright 2025-present 650 Industries. All rights reserved.

/**
 Represents a static function that can only be called synchronously.
 */
public final class StaticSyncFunctionDefinition<Args, FirstArgType, ReturnType>:
  SyncFunctionDefinition<Args, FirstArgType, ReturnType>, @unchecked Sendable {
  public override var _definitionClassification: DefinitionClassification {
    return DefinitionClassification(kind: .staticFunction(self))
  }
}

/**
 Represents a static function that can only be called asynchronously, thus its JavaScript equivalent returns a Promise.
 */
public final class StaticAsyncFunctionDefinition<Args, FirstArgType, ReturnType>:
  AsyncFunctionDefinition<Args, FirstArgType, ReturnType>, @unchecked Sendable {
  public override var _definitionClassification: DefinitionClassification {
    return DefinitionClassification(kind: .staticFunction(self))
  }
}

/**
 Represents a static function that can only be called asynchronously, thus its JavaScript equivalent returns a Promise.
 */
public final class StaticConcurrentFunctionDefinition<Args, FirstArgType, ReturnType>:
  ConcurrentFunctionDefinition<Args, FirstArgType, ReturnType>, @unchecked Sendable {
  public override var _definitionClassification: DefinitionClassification {
    return DefinitionClassification(kind: .staticFunction(self))
  }
}
