// Copyright 2026-present 650 Industries. All rights reserved.

import Testing
import UIKit

@testable import ExpoModulesCore

private final class TestSharedObject: SharedObject {}

/**
 Every definition element declared in this module must classify itself.
 An element that stays `.unknown` is only picked up by the containers' cast fallback,
 which covers just the protocols a type from another module can conform to.
 */
@Suite("DefinitionClassification")
struct DefinitionClassificationTests {
  @Test
  func `classifies every core definition element`() {
    let elements: [(String, AnyDefinition)] = [
      ("Name", Name("module")),
      ("Constants", Constants { [:] }),
      ("Constant", Constant("constant") { 1 }),
      ("Events", Events("event")),
      ("OnCreate", OnCreate {}),
      ("OnStartObserving", OnStartObserving {}),
      ("Function", Function("function") {}),
      ("Function with arguments", Function("function") { (_: Int) in }),
      ("AsyncFunction", AsyncFunction("asyncFunction") {}),
      ("AsyncFunction with async closure", AsyncFunction("concurrentFunction") { () async in }),
      ("StaticFunction", StaticFunction("staticFunction") {}),
      ("StaticAsyncFunction", StaticAsyncFunction("staticAsyncFunction") {}),
      ("StaticAsyncFunction with async closure", StaticAsyncFunction("staticConcurrentFunction") { () async in }),
      ("Property", Property("property") { 1 }),
      ("Class", Class("Class") {}),
      ("Class with shared object", Class(TestSharedObject.self) {}),
      ("View", View(UIView.self) {}),
      ("Prop", Prop("prop") { (_: UIView, _: Int) in }),
      ("ViewName", ViewName("view")),
      ("OnViewDidUpdateProps", OnViewDidUpdateProps { (_: UIView) in })
    ]

    for (name, element) in elements {
      if case .unknown = element._definitionClassification.kind {
        Issue.record("\(name) is not classified")
      }
    }
  }
}
