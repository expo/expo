// Copyright 2022-present 650 Industries. All rights reserved.

internal protocol AnyPermissionDefinition: AnyDefinition {
  var name: String { get }
  var checker: AnyPermissionCheckerDefinition? { get }
  var requester: AnyPermissionRequesterDefinition? { get }
  func decorate(object: JavaScriptObject, appContext: AppContext) throws
}

public class PermissionCheckerDefinition<Args, FirstArgType, ReturnType>: SyncFunctionDefinition<Args, FirstArgType, ReturnType>, AnyPermissionCheckerDefinition {
  init(firstArgType: FirstArgType.Type, dynamicArgumentTypes: [any AnyDynamicType], returnType: any AnyDynamicType = ~ReturnType.self, _ body: @escaping SyncFunctionDefinition<Args, FirstArgType, ReturnType>.ClosureType) {
    super.init("check", firstArgType: firstArgType, dynamicArgumentTypes: dynamicArgumentTypes, returnType: returnType, body)
  }
}

public class PermissionRequesterDefinition<Args, FirstArgType, ReturnType>: ConcurrentFunctionDefinition<Args, FirstArgType, ReturnType>, AnyPermissionRequesterDefinition {
  
  init(firstArgType: FirstArgType.Type, dynamicArgumentTypes: [any AnyDynamicType], _ body: @escaping ConcurrentFunctionDefinition<Args, FirstArgType, ReturnType>.ClosureType) {
    super.init("request", firstArgType: firstArgType, dynamicArgumentTypes: dynamicArgumentTypes, body)
  }
}

internal protocol AnyPermissionCheckerDefinition: AnySyncFunctionDefinition, AnyPermissionDefinitionElement {
 
}


internal protocol AnyPermissionRequesterDefinition: AnyFunctionDefinition, AnyPermissionDefinitionElement {
 
}

/**
 A definition representing the native permission to export to React.
 */
public class PermissionDefinition: AnyPermissionDefinition {
  var checker: AnyPermissionCheckerDefinition?
  
  var requester: AnyPermissionRequesterDefinition?
  
  /**
   Name of the permission.
   */
  public var name: String
  
  
  /**
   Default initializer receiving children definitions from the result builder.
   */
  init(_ name: String, elements: [AnyPermissionDefinitionElement]) {
    
    
    self.name = name
    self.checker = elements.compactMap { $0 as? AnyPermissionCheckerDefinition }.first
    self.requester = elements.compactMap { $0 as? AnyPermissionRequesterDefinition }.first
    
  }
  
  
  
  public func decorate(object: JavaScriptObject, appContext: AppContext) throws {
    let permissionObject = try appContext.runtime.createObject()
    
    if let checker = checker {
      permissionObject.setProperty("check", value: try checker.build(appContext: appContext))
      
    }
    if let requester = requester {
      permissionObject.setProperty("request", value: try requester.build(appContext: appContext))
    }
    object.setProperty(name, value: permissionObject)
    appContext.permissionRegistry.register(permission: self)
  }
}

// MARK: - AnyViewDefinitionElement

public protocol AnyPermissionDefinitionElement: AnyDefinition {}

