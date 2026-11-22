// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore

// MARK: - Test classes

// The classes override the hooks by hand, the way the `@SharedObject` macro does, so the tests don't depend on the
// version of the macro.

/// A class with the macro whose superclass doesn't have it.
private class ChainRoot: SharedObject {
  override class var _jsClassType: (any AnySharedObject.Type)? { ChainRoot.self }
  override class var _jsParentClassType: (any AnySharedObject.Type)? { super._jsClassType }

  @JavaScriptActor
  override class func _decorateSharedObject(prototype: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) throws {
    prototype.setProperty("rootMethod", value: runtime.createFunction("rootMethod") { _, _ in .number(1) }.asValue())
  }

  @JavaScriptActor
  override class func _decorateSharedObject(constructor: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) throws {
    constructor.setProperty("rootStatic", value: runtime.createFunction("rootStatic") { _, _ in .number(10) }.asValue())
  }
}

/// A class without the macro. It inherits all the hooks of `ChainRoot`.
private class ChainMiddle: ChainRoot {}

/// A class with the macro whose superclass doesn't have it, but a class above does.
private final class ChainLeaf: ChainMiddle {
  override class var _jsClassType: (any AnySharedObject.Type)? { ChainLeaf.self }
  override class var _jsParentClassType: (any AnySharedObject.Type)? { super._jsClassType }

  @JavaScriptActor
  override class func _decorateSharedObject(prototype: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) throws {
    prototype.setProperty("leafMethod", value: runtime.createFunction("leafMethod") { _, _ in .number(2) }.asValue())
  }

  @JavaScriptActor
  override class func _decorateSharedObject(constructor: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) throws {}

  @JavaScriptActor
  override class func _constructSharedObject(
    this: borrowing JavaScriptValue,
    arguments: borrowing JavaScriptValuesBuffer,
    in runtime: JavaScriptRuntime
  ) throws -> SharedObject? {
    return ChainLeaf()
  }
}

/// A second class with the macro that extends `ChainRoot`.
private final class ChainSibling: ChainRoot {
  override class var _jsClassType: (any AnySharedObject.Type)? { ChainSibling.self }
  override class var _jsParentClassType: (any AnySharedObject.Type)? { super._jsClassType }

  @JavaScriptActor
  override class func _decorateSharedObject(prototype: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) throws {}

  @JavaScriptActor
  override class func _decorateSharedObject(constructor: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) throws {}

  @JavaScriptActor
  override class func _constructSharedObject(
    this: borrowing JavaScriptValue,
    arguments: borrowing JavaScriptValuesBuffer,
    in runtime: JavaScriptRuntime
  ) throws -> SharedObject? {
    return ChainSibling()
  }
}

/// A `SharedRef` class with the macro.
private class ChainRefRoot: SharedRef<String> {
  override class var _jsClassType: (any AnySharedObject.Type)? { ChainRefRoot.self }
  override class var _jsParentClassType: (any AnySharedObject.Type)? { super._jsClassType }
}

/// A subclass of `ChainRefRoot` with the macro.
private final class ChainRefLeaf: ChainRefRoot {
  override class var _jsClassType: (any AnySharedObject.Type)? { ChainRefLeaf.self }
  override class var _jsParentClassType: (any AnySharedObject.Type)? { super._jsClassType }
}

/// A class without `_jsClassType`, like a class that an earlier version of the macro expands.
private final class ChainFlat: SharedObject {}

@ExpoModule(classes: [ChainLeaf.self, ChainSibling.self, ChainMiddle.self, ChainRefLeaf.self])
private final class ClassChainModule: Module {}

// MARK: - Tests

@Suite("Shared object class chain")
@JavaScriptActor
private struct SharedObjectClassChainTests {
  let appContext: TestAppContext
  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  init() {
    appContext = TestAppContext()
    appContext.moduleRegistry.register(module: ClassChainModule(appContext: appContext), name: nil)
  }

  private func evalBool(_ source: String) throws -> Bool {
    return try runtime.eval(source).asBool()
  }

  // MARK: - Parent classes

  @Test
  func `the parent of a class is its nearest superclass with the macro`() {
    #expect(ChainRoot.resolvedJSParentClassType == nil)
    #expect(ChainMiddle.resolvedJSParentClassType == ChainRoot.self)
    #expect(ChainLeaf.resolvedJSParentClassType == ChainRoot.self)
    #expect(ChainFlat.resolvedJSParentClassType == nil)
  }

  @Test
  func `only a class with the macro binds its own members`() {
    #expect(ChainRoot.bindsOwnJSMembers)
    #expect(!ChainMiddle.bindsOwnJSMembers)
    #expect(ChainLeaf.bindsOwnJSMembers)
    #expect(ChainFlat.bindsOwnJSMembers)
  }

  // MARK: - Main runtime

  @Test
  func `the class extends the class of its parent`() throws {
    #expect(try evalBool("Object.getPrototypeOf(expo.modules.ClassChainModule.ChainLeaf).name === 'ChainRoot'"))
    #expect(try evalBool(
      "Object.getPrototypeOf(Object.getPrototypeOf(expo.modules.ClassChainModule.ChainLeaf)) === expo.SharedObject"
    ))
  }

  @Test
  func `an instance is an instance of each class in the chain`() throws {
    let rootClass = try appContext.getSharedObjectClass(ChainRoot.self)
    try runtime.global().setProperty("rootClass", value: rootClass.asValue())
    try runtime.eval("leaf = new expo.modules.ClassChainModule.ChainLeaf()")
    #expect(try evalBool("leaf instanceof expo.modules.ClassChainModule.ChainLeaf"))
    #expect(try evalBool("leaf instanceof rootClass"))
    #expect(try evalBool("leaf instanceof expo.SharedObject"))
    #expect(try evalBool("leaf instanceof expo.EventEmitter"))
  }

  @Test
  func `the members of the parent are only on its prototype`() throws {
    try runtime.eval("leaf = new expo.modules.ClassChainModule.ChainLeaf()")
    #expect(try runtime.eval("leaf.rootMethod() + leaf.leafMethod()").asInt() == 3)
    #expect(try evalBool(
      "Object.prototype.hasOwnProperty.call(expo.modules.ClassChainModule.ChainLeaf.prototype, 'leafMethod')"
    ))
    #expect(try !evalBool(
      "Object.prototype.hasOwnProperty.call(expo.modules.ClassChainModule.ChainLeaf.prototype, 'rootMethod')"
    ))
  }

  @Test
  func `the class inherits the static members of its parent`() throws {
    #expect(try runtime.eval("expo.modules.ClassChainModule.ChainLeaf.rootStatic()").asInt() == 10)
    #expect(try !evalBool(
      "Object.prototype.hasOwnProperty.call(expo.modules.ClassChainModule.ChainLeaf, 'rootStatic')"
    ))
  }

  @Test
  func `classes with the same parent share its class`() throws {
    #expect(try evalBool(
      """
      Object.getPrototypeOf(expo.modules.ClassChainModule.ChainLeaf)
        === Object.getPrototypeOf(expo.modules.ClassChainModule.ChainSibling)
      """
    ))
    let rootClass = try appContext.getSharedObjectClass(ChainRoot.self)
    try runtime.global().setProperty("rootClass", value: rootClass.asValue())
    #expect(try evalBool("rootClass === Object.getPrototypeOf(expo.modules.ClassChainModule.ChainLeaf)"))
  }

  @Test
  func `a class without the macro extends the class of its parent and has no members of its own`() throws {
    #expect(try evalBool("Object.getPrototypeOf(expo.modules.ClassChainModule.ChainMiddle).name === 'ChainRoot'"))
    #expect(try !evalBool(
      "Object.prototype.hasOwnProperty.call(expo.modules.ClassChainModule.ChainMiddle.prototype, 'rootMethod')"
    ))
  }

  @Test
  func `an object of a class that no module registers gets the class`() throws {
    try runtime.global().setProperty("root", value: try ChainRoot.encode(ChainRoot(), in: runtime))
    #expect(try runtime.eval("root.rootMethod()").asInt() == 1)
  }

  @Test
  func `a chain of SharedRef classes ends at the base SharedRef class`() throws {
    #expect(try evalBool(
      "Object.getPrototypeOf(Object.getPrototypeOf(expo.modules.ClassChainModule.ChainRefLeaf)) === expo.SharedRef"
    ))
  }

  // MARK: - Attached runtimes

  @Test
  func `an instance in an attached runtime gets the same chain`() throws {
    let id = try runtime.eval(
      """
      leaf = new expo.modules.ClassChainModule.ChainLeaf()
      leaf.__expo_shared_object_id__
      """).asInt()
    let attachedRuntime = try appContext.addRuntime()
    try attachedRuntime.eval("leaf = expo.SharedObject.__resolveInWorklet(\(id))")

    #expect(try attachedRuntime.eval("leaf.rootMethod() + leaf.leafMethod()").asInt() == 3)
    #expect(try attachedRuntime.eval(
      "Object.prototype.hasOwnProperty.call(Object.getPrototypeOf(leaf), 'leafMethod')"
    ).asBool())
    #expect(try !attachedRuntime.eval(
      "Object.prototype.hasOwnProperty.call(Object.getPrototypeOf(leaf), 'rootMethod')"
    ).asBool())
    #expect(try attachedRuntime.eval(
      "Object.prototype.hasOwnProperty.call(Object.getPrototypeOf(Object.getPrototypeOf(leaf)), 'rootMethod')"
    ).asBool())
    #expect(try attachedRuntime.eval(
      "Object.getPrototypeOf(Object.getPrototypeOf(Object.getPrototypeOf(leaf))) === expo.SharedObject.prototype"
    ).asBool())
  }

  @Test
  func `classes with the same parent share its prototype in an attached runtime`() throws {
    let ids = try runtime.eval(
      """
      leaf = new expo.modules.ClassChainModule.ChainLeaf();
      sibling = new expo.modules.ClassChainModule.ChainSibling();
      [leaf.__expo_shared_object_id__, sibling.__expo_shared_object_id__]
      """).asObject().getArray()
    let leafId = try ids.getValue(at: 0).asInt()
    let siblingId = try ids.getValue(at: 1).asInt()
    let attachedRuntime = try appContext.addRuntime()

    #expect(try attachedRuntime.eval(
      """
      leafParent = Object.getPrototypeOf(Object.getPrototypeOf(expo.SharedObject.__resolveInWorklet(\(leafId))));
      siblingParent = Object.getPrototypeOf(Object.getPrototypeOf(expo.SharedObject.__resolveInWorklet(\(siblingId))));
      leafParent === siblingParent && Object.prototype.hasOwnProperty.call(leafParent, 'rootMethod')
      """
    ).asBool())
  }

  @Test
  func `an object of a class that no module registers gets the class in an attached runtime`() throws {
    let root = ChainRoot()
    try runtime.global().setProperty("root", value: try ChainRoot.encode(root, in: runtime))
    let attachedRuntime = try appContext.addRuntime()

    #expect(try attachedRuntime.eval(
      "expo.SharedObject.__resolveInWorklet(\(root.sharedObjectId)).rootMethod()"
    ).asInt() == 1)
  }

  @Test
  func `a class without the macro has no members of its own in an attached runtime`() throws {
    let middle = ChainMiddle()
    try runtime.global().setProperty("middle", value: try ChainMiddle.encode(middle, in: runtime))
    let attachedRuntime = try appContext.addRuntime()
    try attachedRuntime.eval("middle = expo.SharedObject.__resolveInWorklet(\(middle.sharedObjectId))")

    #expect(try attachedRuntime.eval("middle.rootMethod()").asInt() == 1)
    #expect(try !attachedRuntime.eval(
      "Object.prototype.hasOwnProperty.call(Object.getPrototypeOf(middle), 'rootMethod')"
    ).asBool())
  }

  @Test
  func `a chain of SharedRef classes ends at the base SharedRef prototype in an attached runtime`() throws {
    let ref = ChainRefLeaf("ref")
    try runtime.global().setProperty("ref", value: try ChainRefLeaf.encode(ref, in: runtime))
    let attachedRuntime = try appContext.addRuntime()

    #expect(try attachedRuntime.eval(
      """
      ref = expo.SharedObject.__resolveInWorklet(\(ref.sharedObjectId));
      Object.getPrototypeOf(Object.getPrototypeOf(Object.getPrototypeOf(ref))) === expo.SharedRef.prototype
      """
    ).asBool())
  }
}
