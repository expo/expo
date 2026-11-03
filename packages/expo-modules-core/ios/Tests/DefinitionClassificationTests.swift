// Copyright 2026-present 650 Industries. All rights reserved.

import Testing
import UIKit

@testable import ExpoModulesCore

private final class TestSharedObject: SharedObject {}

/**
 Every definition element declared in this module must classify itself as its own kind.
 An element that stays `.unknown` is only picked up by the containers' cast fallback,
 which covers just the protocols a type from another module can conform to.
 A static function subclass that loses its override inherits `.function` and gets registered as an instance function.
 */
@Suite("DefinitionClassification")
struct DefinitionClassificationTests {
  @Test
  func `classifies every core definition element as its kind`() {
    let elements: [(String, String, AnyDefinition)] = [
      ("Name", "moduleName", Name("module")),
      ("Constants", "legacyConstants", Constants { [:] }),
      ("Constant", "constant", Constant("constant") { 1 }),
      ("Events", "events", Events("event")),
      ("OnCreate", "eventListener", OnCreate {}),
      ("OnStartObserving", "eventObserver", OnStartObserving {}),
      ("Function", "function", Function("function") {}),
      ("Function with arguments", "function", Function("function") { (_: Int) in }),
      ("AsyncFunction", "function", AsyncFunction("asyncFunction") {}),
      ("AsyncFunction with async closure", "function", AsyncFunction("concurrentFunction") { () async in }),
      ("StaticFunction", "staticFunction", StaticFunction("staticFunction") {}),
      ("StaticAsyncFunction", "staticFunction", StaticAsyncFunction("staticAsyncFunction") {}),
      ("StaticAsyncFunction with async closure", "staticFunction", StaticAsyncFunction("staticConcurrentFunction") { () async in }),
      ("Property", "property", Property("property") { 1 }),
      ("Class", "klass", Class("Class") {}),
      ("Class with shared object", "klass", Class(TestSharedObject.self) {}),
      ("View", "view", View(UIView.self) {}),
      ("Prop", "viewProp", Prop("prop") { (_: UIView, _: Int) in }),
      ("ViewName", "viewName", ViewName("view")),
      ("OnViewDidUpdateProps", "viewLifecycle", OnViewDidUpdateProps { (_: UIView) in })
    ]

    for (name, expectedKind, element) in elements {
      #expect(kindName(element._definitionClassification.kind) == expectedKind, "\(name)")
    }
  }
}

private func kindName(_ kind: DefinitionClassification.Kind) -> String {
  switch kind {
  case .unknown: return "unknown"
  case .function: return "function"
  case .staticFunction: return "staticFunction"
  case .legacyConstants: return "legacyConstants"
  case .constant: return "constant"
  case .property: return "property"
  case .klass: return "klass"
  case .moduleName: return "moduleName"
  case .eventListener: return "eventListener"
  case .events: return "events"
  case .eventObserver: return "eventObserver"
  case .view: return "view"
  case .viewProp: return "viewProp"
  case .viewName: return "viewName"
  case .viewLifecycle: return "viewLifecycle"
  }
}
