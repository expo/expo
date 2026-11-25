// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore

// MARK: - Test classes

// The classes override the hooks by hand, the way the `@SharedObject` macro does, so the tests don't depend on the
// version of the macro.

/// A class with the macro whose superclass doesn't have it.
private class ChainRoot: SharedObject {
  override class var _jsName: String { "ChainRoot" }
  override class var _jsClassType: (any AnyJavaScriptClass.Type)? { ChainRoot.self }
  override class var _jsSuperclassType: (any AnyJavaScriptClass.Type)? { super._jsClassType }

  @JavaScriptActor
  override class func _decorateClass(prototype: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) throws {
    prototype.setProperty("rootMethod", value: runtime.createFunction("rootMethod") { _, _ in .number(1) }.asValue())
  }

  @JavaScriptActor
  override class func _decorateClass(constructor: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) throws {
    constructor.setProperty("rootStatic", value: runtime.createFunction("rootStatic") { _, _ in .number(10) }.asValue())
  }
}

/// A class without the macro that no module registers. It inherits all the hooks of `ChainRoot`, also `_jsName`.
private class ChainMiddle: ChainRoot {}

/// A class with the macro whose superclass doesn't have it, but a class above does.
private final class ChainLeaf: ChainMiddle {
  override class var _jsName: String { "ChainLeaf" }
  override class var _jsClassType: (any AnyJavaScriptClass.Type)? { ChainLeaf.self }
  override class var _jsSuperclassType: (any AnyJavaScriptClass.Type)? { super._jsClassType }

  @JavaScriptActor
  override class func _decorateClass(prototype: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) throws {
    prototype.setProperty("leafMethod", value: runtime.createFunction("leafMethod") { _, _ in .number(2) }.asValue())
  }

  @JavaScriptActor
  override class func _decorateClass(constructor: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) throws {}

  @JavaScriptActor
  override class func _constructInstance(
    this: borrowing JavaScriptValue,
    arguments: borrowing JavaScriptValuesBuffer,
    in runtime: JavaScriptRuntime
  ) throws -> (any AnyJavaScriptClass)? {
    return ChainLeaf()
  }
}

/// A second class with the macro that extends `ChainRoot`.
private final class ChainSibling: ChainRoot {
  override class var _jsName: String { "ChainSibling" }
  override class var _jsClassType: (any AnyJavaScriptClass.Type)? { ChainSibling.self }
  override class var _jsSuperclassType: (any AnyJavaScriptClass.Type)? { super._jsClassType }

  @JavaScriptActor
  override class func _decorateClass(prototype: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) throws {}

  @JavaScriptActor
  override class func _decorateClass(constructor: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) throws {}

  @JavaScriptActor
  override class func _constructInstance(
    this: borrowing JavaScriptValue,
    arguments: borrowing JavaScriptValuesBuffer,
    in runtime: JavaScriptRuntime
  ) throws -> (any AnyJavaScriptClass)? {
    return ChainSibling()
  }
}

/// A class with the macro that no module registers.
private final class ChainUnregistered: ChainRoot {
  override class var _jsName: String { "ChainUnregistered" }
  override class var _jsClassType: (any AnyJavaScriptClass.Type)? { ChainUnregistered.self }
  override class var _jsSuperclassType: (any AnyJavaScriptClass.Type)? { super._jsClassType }

  @JavaScriptActor
  override class func _decorateClass(prototype: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) throws {
    let method = runtime.createFunction("unregisteredMethod") { _, _ in .number(3) }
    prototype.setProperty("unregisteredMethod", value: method.asValue())
  }

  @JavaScriptActor
  override class func _decorateClass(constructor: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) throws {}
}

/// A `SharedRef` class with the macro.
private class ChainRefRoot: SharedRef<String> {
  override class var _jsName: String { "ChainRefRoot" }
  override class var _jsClassType: (any AnyJavaScriptClass.Type)? { ChainRefRoot.self }
  override class var _jsSuperclassType: (any AnyJavaScriptClass.Type)? { super._jsClassType }
}

/// A subclass of `ChainRefRoot` with the macro.
private final class ChainRefLeaf: ChainRefRoot {
  override class var _jsName: String { "ChainRefLeaf" }
  override class var _jsClassType: (any AnyJavaScriptClass.Type)? { ChainRefLeaf.self }
  override class var _jsSuperclassType: (any AnyJavaScriptClass.Type)? { super._jsClassType }
}

/// A class without `_jsClassType`, like a class that an earlier version of the macro expands.
private final class ChainFlat: SharedObject {}

@ExpoModule(classes: [ChainLeaf.self, ChainSibling.self, ChainRefLeaf.self])
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

  // MARK: - Superclasses

  @Test
  func `the JS superclass of a class is its nearest superclass with the macro`() {
    #expect(ChainRoot.resolvedJSSuperclassType == nil)
    #expect(ChainMiddle.resolvedJSSuperclassType == ChainRoot.self)
    #expect(ChainLeaf.resolvedJSSuperclassType == ChainRoot.self)
    #expect(ChainFlat.resolvedJSSuperclassType == nil)
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
  func `the class extends the class of its superclass`() throws {
    #expect(try evalBool("Object.getPrototypeOf(expo.modules.ClassChainModule.ChainLeaf).name === 'ChainRoot'"))
    #expect(try evalBool(
      "Object.getPrototypeOf(Object.getPrototypeOf(expo.modules.ClassChainModule.ChainLeaf)) === expo.SharedObject"
    ))
  }

  @Test
  func `an instance is an instance of each class in the chain`() throws {
    let rootClass = try appContext.getJavaScriptClass(ChainRoot.self)
    try runtime.global().setProperty("rootClass", value: rootClass.asValue())
    try runtime.eval("leaf = new expo.modules.ClassChainModule.ChainLeaf()")
    #expect(try evalBool("leaf instanceof expo.modules.ClassChainModule.ChainLeaf"))
    #expect(try evalBool("leaf instanceof rootClass"))
    #expect(try evalBool("leaf instanceof expo.SharedObject"))
    #expect(try evalBool("leaf instanceof expo.EventEmitter"))
  }

  @Test
  func `the members of the superclass are only on its prototype`() throws {
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
  func `the class inherits the static members of its superclass`() throws {
    #expect(try runtime.eval("expo.modules.ClassChainModule.ChainLeaf.rootStatic()").asInt() == 10)
    #expect(try !evalBool(
      "Object.prototype.hasOwnProperty.call(expo.modules.ClassChainModule.ChainLeaf, 'rootStatic')"
    ))
  }

  @Test
  func `classes with the same superclass share its class`() throws {
    #expect(try evalBool(
      """
      Object.getPrototypeOf(expo.modules.ClassChainModule.ChainLeaf)
        === Object.getPrototypeOf(expo.modules.ClassChainModule.ChainSibling)
      """
    ))
    let rootClass = try appContext.getJavaScriptClass(ChainRoot.self)
    try runtime.global().setProperty("rootClass", value: rootClass.asValue())
    #expect(try evalBool("rootClass === Object.getPrototypeOf(expo.modules.ClassChainModule.ChainLeaf)"))
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
  func `classes with the same superclass share its prototype in an attached runtime`() throws {
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
      leafSuperclass = Object.getPrototypeOf(Object.getPrototypeOf(expo.SharedObject.__resolveInWorklet(\(leafId))));
      siblingSuperclass = Object.getPrototypeOf(Object.getPrototypeOf(expo.SharedObject.__resolveInWorklet(\(siblingId))));
      leafSuperclass === siblingSuperclass && Object.prototype.hasOwnProperty.call(leafSuperclass, 'rootMethod')
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
  func `an object of a class without the macro gets the class of its nearest superclass with the macro`() throws {
    let rootClass = try appContext.getJavaScriptClass(ChainRoot.self)
    try runtime.global().setProperty("rootClass", value: rootClass.asValue())
    let middle = ChainMiddle()
    try runtime.global().setProperty("middle", value: try ChainMiddle.encode(middle, in: runtime))
    let attachedRuntime = try appContext.addRuntime()
    try attachedRuntime.eval("middle = expo.SharedObject.__resolveInWorklet(\(middle.sharedObjectId))")

    #expect(try evalBool("Object.getPrototypeOf(middle) === rootClass.prototype"))
    #expect(try attachedRuntime.eval(
      "Object.prototype.hasOwnProperty.call(Object.getPrototypeOf(middle), 'rootMethod')"
    ).asBool())
  }

  @Test
  func `an object gets the class of its own type, not of the declared type, in both runtimes`() throws {
    let object = ChainUnregistered()
    try runtime.global().setProperty("object", value: try ChainRoot.encode(object, in: runtime))
    let attachedRuntime = try appContext.addRuntime()

    #expect(try runtime.eval("object.unregisteredMethod()").asInt() == 3)
    #expect(try attachedRuntime.eval(
      "expo.SharedObject.__resolveInWorklet(\(object.sharedObjectId)).unregisteredMethod()"
    ).asInt() == 3)
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
